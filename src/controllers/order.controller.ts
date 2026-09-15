import axios from "axios";
import { Request, Response, NextFunction } from "express";
import Order from "../models/order.model";
import Product from "../models/product.model";
import { AppError } from "../middlewares/handleAppError.middleware";
import { OrderStatus, ItemStatus } from "../interface/order.interface";

function asId(value: any): string {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const { items, email } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Order items are required", 400));
  }

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      return next(new AppError(`Product ${item.productId} not found`, 404));
    }
    const qty = Number(item.quantity) || 1;
    const unitPrice = product.price;
    const subtotal = unitPrice * qty;
    total += subtotal;
    orderItems.push({
      retailer: product.retailer,
      product: product._id,
      productName: product.name,
      size: item.size,
      quantity: qty,
      unitPrice,
      subtotal,
      status: ItemStatus.placed,
    });
  }

  const order = await Order.create({
    user: req.user?.id,
    items: orderItems,
    total,
    status: OrderStatus.pending,
  });

  // Initiate Paystack payment
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (secret) {
    try {
      const paystackRes = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: email || req.user?.email,
          amount: Math.round(total * 100), // kobo
          metadata: { orderId: order._id.toString() },
          callback_url: req.body.callbackUrl,
        },
        { headers: { Authorization: `Bearer ${secret}` } }
      );
      const { authorization_url, reference } = paystackRes.data.data;
      order.paystackRef = reference;
      await order.save();
      return res.status(201).json({
        status: "Success",
        data: { order, authorization_url, reference },
      });
    } catch (err: any) {
      return next(new AppError(`Paystack error: ${err.response?.data?.message || err.message}`, 502));
    }
  }

  res.status(201).json({ status: "Success", data: { order } });
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  const { reference } = req.body;
  if (!reference) return next(new AppError("Payment reference required", 400));

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return next(new AppError("Paystack not configured", 500));

  try {
    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const data = paystackRes.data.data;
    if (data.status !== "success") {
      return next(new AppError("Payment not successful", 400));
    }

    const order = await Order.findOne({ paystackRef: reference });
    if (!order) return next(new AppError("Order not found for this reference", 404));

    order.status = OrderStatus.paid;
    await order.save();

    res.status(200).json({ status: "Success", data: order });
  } catch (err: any) {
    return next(new AppError(`Verify failed: ${err.response?.data?.message || err.message}`, 502));
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!.id }).sort({ orderedAt: -1 });
  res.status(200).json({ status: "Success", results: orders.length, data: orders });
};

export const getRetailerOrders = async (req: Request, res: Response) => {
  const retailerId = asId(req.retailer!.id);
  const orders = await Order.find({ "items.retailer": req.retailer!.id }).sort({ orderedAt: -1 });
  const data = orders.map((order) => {
    const json = order.toJSON();
    json.items = (json.items || []).filter((it: any) => asId(it.retailer) === retailerId);
    return json;
  });
  res.status(200).json({ status: "Success", results: data.length, data });
};

export const updateItemStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, itemId, status, note } = req.body;
  if (!orderId || !itemId || !status) {
    return next(new AppError("orderId, itemId and status are required", 400));
  }
  if (!Object.values(ItemStatus).includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found", 404));

  const item =
    (order.items as any).id?.(itemId) ||
    (order.items as any).find((it: any) => asId(it._id) === String(itemId));
  if (!item) return next(new AppError("Order item not found", 404));

  const itemRetailerId = asId(item.retailer);
  const loggedInRetailerId = asId(req.retailer!.id);
  if (!itemRetailerId || itemRetailerId !== loggedInRetailerId) {
    return next(new AppError("You do not own this order item", 403));
  }

  item.status = status;
  if (typeof note === "string" && note.trim()) {
    item.note = note.trim();
  }
  await order.save();

  res.status(200).json({ status: "Success", data: order });
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError("Order not found", 404));
  res.status(200).json({ status: "Success", data: order });
};
