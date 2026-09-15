import { Router, Request, Response } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import Retailer from "../models/retailer.model";
import Product from "../models/product.model";
import User from "../models/user.model";
import { RetailerStatus } from "../interface/retailer.interface";
import { UserRole } from "../interface/user.interface";

const seedRouter = Router();

const DEMO_PASSWORD = "SweetFeet123!";

const RETAILERS = [
  {
    email: "lagoskicks@sweetfeet.demo",
    businessName: "Lagos Kicks Hub",
    phone: "08031234567",
    location: "Ikeja, Lagos",
    bio: "Premium trainers and everyday kicks shipped across Nigeria.",
    logo: "https://ui-avatars.com/api/?name=Lagos+Kicks&background=160c02&color=f7dfb8&size=128&bold=true",
  },
  {
    email: "abuja.style@sweetfeet.demo",
    businessName: "Abuja Style Co",
    phone: "08039876543",
    location: "Wuse 2, Abuja",
    bio: "Corporate, loafers and formal footwear for the capital city.",
    logo: "https://ui-avatars.com/api/?name=Abuja+Style&background=c8440c&color=fff&size=128&bold=true",
  },
];

const CATALOGUE: Array<{
  retailerEmail: string;
  products: Array<Record<string, unknown>>;
}> = [
  {
    retailerEmail: "lagoskicks@sweetfeet.demo",
    products: [
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
      {
        name: "Foam Runner Lite",
        category: "runners",
        gender: "unisex",
        price: 28000,
        oldPrice: 33000,
        color: "multi",
        badge: "sale",
        badgeLabel: "SALE",
        rating: 4.2,
        ratingCount: 190,
        sizes: [39, 40, 41, 42, 43, 44],
        img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
      },
      {
        name: "Canvas Low-Top",
        category: "casual",
        gender: "unisex",
        price: 24500,
        color: "white",
        badge: "",
        badgeLabel: "",
        rating: 4.0,
        ratingCount: 112,
        sizes: [39, 40, 41, 42, 43],
        img: "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=800&q=80",
      },
      {
        name: "Slide Comfort Sandals",
        category: "sandals",
        gender: "women",
        price: 18500,
        color: "brown",
        badge: "new",
        badgeLabel: "NEW",
        rating: 4.4,
        ratingCount: 94,
        sizes: [36, 37, 38, 39, 40],
        img: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80",
      },
    ],
  },
  {
    retailerEmail: "abuja.style@sweetfeet.demo",
    products: [
      {
        name: "Classic Oxford",
        category: "corporate",
        gender: "men",
        price: 55000,
        color: "brown",
        badge: "top",
        badgeLabel: "TOP PICK",
        rating: 4.8,
        ratingCount: 87,
        sizes: [40, 41, 42, 43, 44, 45],
        img: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80",
      },
      {
        name: "EverDay Loafers",
        category: "loafers",
        gender: "unisex",
        price: 38500,
        color: "black",
        badge: "top",
        badgeLabel: "BEST SELLER",
        rating: 4.7,
        ratingCount: 302,
        sizes: [38, 39, 40, 41, 42, 43],
        img: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80",
      },
      {
        name: "Derby Brogue",
        category: "corporate",
        gender: "men",
        price: 62000,
        color: "brown",
        badge: "new",
        badgeLabel: "NEW",
        rating: 4.6,
        ratingCount: 43,
        sizes: [40, 41, 42, 43, 44],
        img: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=800&q=80",
      },
      {
        name: "Chelsea Boot – Tan",
        category: "boots",
        gender: "men",
        price: 72000,
        color: "brown",
        badge: "new",
        badgeLabel: "NEW",
        rating: 4.8,
        ratingCount: 31,
        sizes: [40, 41, 42, 43, 44, 45],
        img: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80",
      },
      {
        name: "Ankle Boot – Midnight",
        category: "boots",
        gender: "women",
        price: 68000,
        oldPrice: 78000,
        color: "black",
        badge: "sale",
        badgeLabel: "SALE",
        rating: 4.9,
        ratingCount: 59,
        sizes: [36, 37, 38, 39, 40, 41],
        img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
      },
      {
        name: "Espadrille Mule",
        category: "sandals",
        gender: "women",
        price: 22000,
        oldPrice: 28000,
        color: "brown",
        badge: "sale",
        badgeLabel: "SALE",
        rating: 4.0,
        ratingCount: 77,
        sizes: [36, 37, 38, 39, 40],
        img: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
      },
    ],
  },
];

seedRouter.post(
  "/accounts",
  catchAsync(async (_req: Request, res: Response) => {
    const created: string[] = [];

    let admin = await User.findOne({ email: "admin@sweetfeet.demo" });
    if (!admin) {
      await User.create({
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
      await User.create({
        fullName: "Demo Customer",
        email: "customer@sweetfeet.demo",
        phone: "08011111111",
        password: DEMO_PASSWORD,
        passwordConfirm: DEMO_PASSWORD,
        role: UserRole.customer,
      });
      created.push("customer");
    }

    for (const r of RETAILERS) {
      let retailer = await Retailer.findOne({ email: r.email }).select("+password");
      if (!retailer) {
        await Retailer.create({
          ...r,
          password: DEMO_PASSWORD,
          passwordConfirm: DEMO_PASSWORD,
          status: RetailerStatus.approved,
        });
        created.push(`retailer:${r.email}`);
      } else {
        retailer.status = RetailerStatus.approved;
        retailer.businessName = r.businessName;
        retailer.phone = r.phone;
        retailer.location = r.location;
        retailer.bio = r.bio;
        retailer.logo = r.logo;
        retailer.password = DEMO_PASSWORD;
        retailer.passwordConfirm = DEMO_PASSWORD;
        await retailer.save();
        created.push(`retailer-reset:${r.email}`);
      }
    }

    res.status(200).json({
      status: "Success",
      message: "Demo accounts ready",
      data: {
        created,
        accounts: {
          admin: { email: "admin@sweetfeet.demo", password: DEMO_PASSWORD },
          customer: { email: "customer@sweetfeet.demo", password: DEMO_PASSWORD },
          retailers: RETAILERS.map((r) => ({ email: r.email, password: DEMO_PASSWORD, name: r.businessName })),
        },
      },
    });
  })
);

/** Full public catalogue — safe to call anytime; replaces demo products */
seedRouter.post(
  "/demo",
  catchAsync(async (_req: Request, res: Response) => {
    const summary: Array<{ retailer: string; products: number }> = [];

    for (const block of CATALOGUE) {
      let retailer = await Retailer.findOne({ email: block.retailerEmail });
      if (!retailer) {
        const meta = RETAILERS.find((r) => r.email === block.retailerEmail)!;
        retailer = await Retailer.create({
          ...meta,
          password: DEMO_PASSWORD,
          passwordConfirm: DEMO_PASSWORD,
          status: RetailerStatus.approved,
        });
      } else {
        retailer.status = RetailerStatus.approved;
        await retailer.save({ validateBeforeSave: false });
      }

      await Product.deleteMany({ retailer: retailer._id });
      const created = await Product.insertMany(
        block.products.map((p) => ({
          ...p,
          retailer: retailer!._id,
          isActive: true,
        }))
      );
      summary.push({ retailer: retailer.businessName, products: created.length });
    }

    const total = summary.reduce((s, x) => s + x.products, 0);
    res.status(200).json({
      status: "Success",
      message: "Marketplace catalogue seeded (public — no login required to browse)",
      data: { totalProducts: total, byRetailer: summary },
    });
  })
);

export default seedRouter;
