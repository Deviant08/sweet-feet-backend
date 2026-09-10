import { Request, Response, NextFunction } from "express";
import Message from "../models/message.model";
import User from "../models/user.model";
import Retailer from "../models/retailer.model";
import { AppError } from "../middlewares/handleAppError.middleware";
import { UserRole } from "../interface/user.interface";

const isAdmin = (req: Request) => req.user?.role === UserRole.admin || req.user?.role === "admin";

/** Find any platform admin user id (for retailer → admin threads). */
async function resolveAdminId(preferred?: string) {
  if (preferred) return preferred;
  const admin = await User.findOne({ role: UserRole.admin }).select("_id");
  return admin ? String(admin._id) : null;
}

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  const { retailerId, customerId, adminId, productId, orderId, message, threadType } = req.body;
  if (!message || !String(message).trim()) {
    return next(new AppError("Message text is required", 400));
  }

  const text = String(message).trim();
  const wantStaff = threadType === "staff" || !!adminId || (isAdmin(req) && !!retailerId && !customerId);

  // ── Staff thread: admin ↔ retailer ─────────────────────────
  if (wantStaff || (req.retailer && req.body.toAdmin)) {
    let admin: string | null = null;
    let retailer: string;
    let senderType: "admin" | "retailer";

    if (isAdmin(req) && !req.retailer) {
      senderType = "admin";
      admin = String(req.user!.id);
      retailer = retailerId;
      if (!retailer) return next(new AppError("retailerId required when admin sends", 400));
    } else if (req.retailer) {
      senderType = "retailer";
      retailer = String(req.retailer.id);
      admin = await resolveAdminId(adminId);
      if (!admin) return next(new AppError("No admin account exists to message", 400));
    } else {
      return next(new AppError("Only admin or retailer can use staff chat", 403));
    }

    const msg = await Message.create({
      threadType: "staff",
      admin,
      retailer,
      senderType,
      message: text,
      product: productId,
      order: orderId,
    });

    return res.status(201).json({ status: "Success", data: msg });
  }

  // ── Shop thread: customer ↔ retailer ───────────────────────
  let senderType: "customer" | "retailer";
  let customer: string;
  let retailer: string;

  if (req.retailer) {
    senderType = "retailer";
    retailer = String(req.retailer.id);
    customer = customerId;
    if (!customer) return next(new AppError("customerId required when retailer sends", 400));
  } else if (req.user) {
    senderType = "customer";
    customer = String(req.user.id);
    retailer = retailerId;
    if (!retailer) return next(new AppError("retailerId required when customer sends", 400));
  } else {
    return next(new AppError("Authentication required", 401));
  }

  const msg = await Message.create({
    threadType: "shop",
    customer,
    retailer,
    product: productId,
    order: orderId,
    senderType,
    message: text,
  });

  res.status(201).json({ status: "Success", data: msg });
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  const { retailerId, customerId, threadType } = req.query;
  const filter: any = {};

  // Staff inbox / conversation
  if (threadType === "staff" || (isAdmin(req) && !customerId)) {
    filter.threadType = "staff";

    if (isAdmin(req) && !req.retailer) {
      if (retailerId) filter.retailer = retailerId;
      // admin sees all staff threads (optionally filtered by retailer)
    } else if (req.retailer) {
      filter.retailer = req.retailer.id;
    } else {
      return next(new AppError("Staff chat requires admin or retailer login", 403));
    }

    const messages = await Message.find(filter)
      .populate("retailer", "businessName email logo status")
      .populate("admin", "fullName email")
      .sort({ createdAt: 1 })
      .limit(300);

    return res.status(200).json({ status: "Success", results: messages.length, data: messages });
  }

  // Shop threads
  filter.threadType = { $ne: "staff" };

  if (req.retailer) {
    filter.retailer = req.retailer.id;
    if (customerId) filter.customer = customerId;
  } else if (req.user) {
    filter.customer = req.user.id;
    if (retailerId) filter.retailer = retailerId;
  } else {
    return next(new AppError("Authentication required", 401));
  }

  const messages = await Message.find(filter).sort({ createdAt: 1 }).limit(200);
  res.status(200).json({ status: "Success", results: messages.length, data: messages });
};

/** Admin: list retailers for starting staff chats */
export const listStaffPartners = async (req: Request, res: Response, next: NextFunction) => {
  if (!isAdmin(req) || req.retailer) {
    return next(new AppError("Admin only", 403));
  }
  const retailers = await Retailer.find()
    .select("businessName email logo status location phone")
    .sort({ businessName: 1 });
  res.status(200).json({ status: "Success", results: retailers.length, data: retailers });
};

export const markRead = async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length) {
    await Message.updateMany({ _id: { $in: ids } }, { isRead: true });
  }
  res.status(200).json({ status: "Success" });
};
