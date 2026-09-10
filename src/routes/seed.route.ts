import { Router, Request, Response } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import Retailer from "../models/retailer.model";
import Product from "../models/product.model";
import User from "../models/user.model";
import { RetailerStatus } from "../interface/retailer.interface";
import { UserRole } from "../interface/user.interface";

const seedRouter = Router();

const DEMO_EMAIL = "lagoskicks@sweetfeet.demo";
const DEMO_PASSWORD = "SweetFeet123!";
const LOGO =
  "https://ui-avatars.com/api/?name=Lagos+Kicks&background=160c02&color=f7dfb8&size=128&bold=true";

const SAMPLE_PRODUCTS = [
  {
    name: "Pro Grip Trainers",
    category: "trainers",
    gender: "unisex",
    price: 45000,
    oldPrice: 52000,
    color: "black",
    badge: "top",
    badgeLabel: "TOP PICK",
    rating: 4.3,
    ratingCount: 128,
    sizes: [40, 41, 42, 43, 44],
    img: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80",
  },
  {
    name: "Urban Street Runners",
    category: "runners",
    gender: "men",
    price: 38500,
    oldPrice: 42000,
    color: "white",
    badge: "new",
    badgeLabel: "NEW",
    rating: 4.5,
    ratingCount: 86,
    sizes: [41, 42, 43, 44, 45],
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  },
  {
    name: "Classic Court Sneakers",
    category: "casual",
    gender: "unisex",
    price: 32000,
    oldPrice: 36000,
    color: "white",
    badge: "top",
    badgeLabel: "TOP PICK",
    rating: 4.1,
    ratingCount: 64,
    sizes: [39, 40, 41, 42, 43],
    img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
  },
];

/** Create admin + customer + approved retailer if missing */
seedRouter.post(
  "/accounts",
  catchAsync(async (_req: Request, res: Response) => {
    const created: string[] = [];

    let admin = await User.findOne({ email: "admin@sweetfeet.demo" });
    if (!admin) {
      admin = await User.create({
        fullName: "Sweet Feet Admin",
        email: "admin@sweetfeet.demo",
        phone: "08000000000",
        password: DEMO_PASSWORD,
        passwordConfirm: DEMO_PASSWORD,
        role: UserRole.admin,
      });
      created.push("admin");
    } else if (admin.role !== UserRole.admin) {
      admin.role = UserRole.admin;
      await admin.save({ validateBeforeSave: false });
      created.push("admin-role-updated");
    }

    let customer = await User.findOne({ email: "customer@sweetfeet.demo" });
    if (!customer) {
      customer = await User.create({
        fullName: "Demo Customer",
        email: "customer@sweetfeet.demo",
        phone: "08011111111",
        password: DEMO_PASSWORD,
        passwordConfirm: DEMO_PASSWORD,
        role: UserRole.customer,
      });
      created.push("customer");
    }

    let retailer = await Retailer.findOne({ email: DEMO_EMAIL });
    if (!retailer) {
      retailer = await Retailer.create({
        businessName: "Lagos Kicks",
        email: DEMO_EMAIL,
        phone: "08022222222",
        location: "Lagos, Nigeria",
        bio: "Premium trainers and everyday kicks shipped across Nigeria.",
        logo: LOGO,
        password: DEMO_PASSWORD,
        passwordConfirm: DEMO_PASSWORD,
        status: RetailerStatus.approved,
      });
      created.push("retailer");
    } else if (retailer.status !== RetailerStatus.approved) {
      retailer.status = RetailerStatus.approved;
      retailer.logo = retailer.logo || LOGO;
      await retailer.save({ validateBeforeSave: false });
      created.push("retailer-approved");
    }

    res.status(200).json({
      status: "Success",
      message: "Demo accounts ready",
      data: {
        created,
        accounts: {
          admin: { email: "admin@sweetfeet.demo", password: DEMO_PASSWORD, login: "/nav/login.html (Admin)" },
          customer: { email: "customer@sweetfeet.demo", password: DEMO_PASSWORD, login: "/nav/login.html (Customer)" },
          retailer: { email: DEMO_EMAIL, password: DEMO_PASSWORD, login: "/nav/login.html (Retailer)" },
        },
      },
    });
  })
);

seedRouter.post(
  "/demo",
  catchAsync(async (_req: Request, res: Response) => {
    let retailer = await Retailer.findOne({ email: DEMO_EMAIL });
    if (!retailer) {
      return res.status(404).json({
        status: "Failed",
        message: `Demo retailer ${DEMO_EMAIL} not found. Call POST /api/v1/seed/accounts first.`,
      });
    }

    retailer.status = RetailerStatus.approved;
    retailer.logo = LOGO;
    retailer.bio =
      retailer.bio ||
      "Premium trainers and everyday kicks shipped across Nigeria.";
    await retailer.save({ validateBeforeSave: false });

    await Product.deleteMany({ retailer: retailer._id });

    const created = await Product.insertMany(
      SAMPLE_PRODUCTS.map((p) => ({
        ...p,
        retailer: retailer!._id,
        isActive: true,
      }))
    );

    res.status(200).json({
      status: "Success",
      message: "Demo retailer approved and sample products created",
      data: {
        retailer: {
          id: retailer._id,
          businessName: retailer.businessName,
          email: retailer.email,
          status: retailer.status,
          logo: retailer.logo,
        },
        products: created.length,
      },
    });
  })
);

export default seedRouter;
