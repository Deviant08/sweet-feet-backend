import { Request, Response, NextFunction } from "express";
import Product from "../models/product.model";
import { AppError } from "../middlewares/handleAppError.middleware";
import { RetailerStatus } from "../interface/retailer.interface";

function parseSizes(sizes: unknown): number[] {
  if (Array.isArray(sizes)) return sizes.map(Number).filter((n) => !Number.isNaN(n));
  if (typeof sizes === "string") {
    return sizes
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }
  return [];
}

// Public: active products from approved retailers + Sweet Feet house listings
export const getAllProducts = async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.gender) filter.gender = req.query.gender;
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search), $options: "i" };
  }

  const products = await Product.find(filter)
    .populate({
      path: "retailer",
      match: { status: RetailerStatus.approved },
      select: "businessName location logo phone status",
    })
    .sort({ isHouse: -1, createdAt: -1 })
    .lean();

  const data = products.filter((p: any) => p.isHouse || p.retailer);

  res.status(200).json({ status: "Success", results: data.length, data });
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product || !product.isActive) return next(new AppError("Product not found", 404));
  if (!product.isHouse && !product.retailer) return next(new AppError("Product not found", 404));
  res.status(200).json({ status: "Success", data: product });
};

export const getMyProducts = async (req: Request, res: Response) => {
  const products = await Product.find({ retailer: req.retailer!.id })
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({ status: "Success", results: products.length, data: products });
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  if (req.retailer!.status !== RetailerStatus.approved) {
    return next(
      new AppError(
        "Your retailer account is not approved yet. Wait for admin approval before listing products.",
        403
      )
    );
  }
  const { name, category, gender, price, oldPrice, color, badge, badgeLabel, img, sizes } = req.body;
  if (!name || !price || !img || !sizes) {
    return next(new AppError("name, price, img and sizes are required", 400));
  }
  const sizeArr = parseSizes(sizes);
  if (!sizeArr.length) return next(new AppError("At least one size is required", 400));
  const product = await Product.create({
    retailer: req.retailer!.id,
    isHouse: false,
    name,
    category,
    gender,
    price,
    oldPrice,
    color,
    badge,
    badgeLabel,
    img,
    sizes: sizeArr,
  });
  res.status(201).json({ status: "Success", data: product });
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  if (req.retailer!.status !== RetailerStatus.approved) {
    return next(new AppError("Your retailer account is not approved yet.", 403));
  }
  const product = await Product.findOne({ _id: req.params.id, retailer: req.retailer!.id, isHouse: { $ne: true } });
  if (!product) return next(new AppError("Product not found or you do not own it", 404));

  const fields = ["name", "category", "gender", "price", "oldPrice", "color", "badge", "badgeLabel", "img", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) (product as any)[f] = req.body[f];
  });
  if (req.body.sizes) {
    product.sizes = parseSizes(req.body.sizes);
  }
  await product.save();
  res.status(200).json({ status: "Success", data: product });
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ _id: req.params.id, retailer: req.retailer!.id, isHouse: { $ne: true } });
  if (!product) return next(new AppError("Product not found or you do not own it", 404));
  product.isActive = false;
  await product.save();
  res.status(200).json({ status: "Success", message: "Product removed from listing" });
};

export const getHouseProducts = async (_req: Request, res: Response) => {
  const products = await Product.find({ isHouse: true }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ status: "Success", results: products.length, data: products });
};

export const createHouseProduct = async (req: Request, res: Response, next: NextFunction) => {
  const { name, category, gender, price, oldPrice, color, badge, badgeLabel, img, sizes } = req.body;
  if (!name || !price || !img || !sizes) {
    return next(new AppError("name, price, img and sizes are required", 400));
  }
  const sizeArr = parseSizes(sizes);
  if (!sizeArr.length) return next(new AppError("At least one size is required", 400));
  const product = await Product.create({
    isHouse: true,
    name,
    category,
    gender,
    price,
    oldPrice,
    color,
    badge: badge || "top",
    badgeLabel: badgeLabel || "SWEET FEET",
    img,
    sizes: sizeArr,
  });
  res.status(201).json({ status: "Success", data: product });
};

export const updateHouseProduct = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ _id: req.params.id, isHouse: true });
  if (!product) return next(new AppError("Official product not found", 404));

  const fields = ["name", "category", "gender", "price", "oldPrice", "color", "badge", "badgeLabel", "img", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) (product as any)[f] = req.body[f];
  });
  if (req.body.sizes) {
    product.sizes = parseSizes(req.body.sizes);
  }
  product.isHouse = true;
  product.retailer = undefined;
  await product.save();
  res.status(200).json({ status: "Success", data: product });
};

export const deleteHouseProduct = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ _id: req.params.id, isHouse: true });
  if (!product) return next(new AppError("Official product not found", 404));
  product.isActive = false;
  await product.save();
  res.status(200).json({ status: "Success", message: "Official product hidden from the shop" });
};
