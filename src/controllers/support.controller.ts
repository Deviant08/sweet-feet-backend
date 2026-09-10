import { Request, Response, NextFunction } from "express";
import SupportMessage from "../models/supportMessage.model";
import Retailer from "../models/retailer.model";
import { AppError } from "../middlewares/handleAppError.middleware";

/** Send a support message (admin → retailer or retailer → admin) */
export const sendSupportMessage = async (req: Request, res: Response, next: NextFunction) => {
  const text = String(req.body.message || "").trim();
  if (!text) return next(new AppError("Message text is required", 400));

  // Admin sending to a retailer
  if (req.user && req.user.role === "admin") {
    const retailerId = req.body.retailerId;
    if (!retailerId) return next(new AppError("retailerId is required", 400));
    const retailer = await Retailer.findById(retailerId);
    if (!retailer) return next(new AppError("Retailer not found", 404));

    const msg = await SupportMessage.create({
      retailer: retailerId,
      admin: req.user.id,
      senderType: "admin",
      message: text,
    });
    return res.status(201).json({ status: "Success", data: msg });
  }

  // Retailer sending to admin
  if (req.retailer) {
    const msg = await SupportMessage.create({
      retailer: req.retailer.id,
      senderType: "retailer",
      message: text,
    });
    return res.status(201).json({ status: "Success", data: msg });
  }

  return next(new AppError("Only admins and retailers can use support chat", 403));
};

/** Get conversation messages */
export const getSupportConversation = async (req: Request, res: Response, next: NextFunction) => {
  let retailerId: string | undefined;

  if (req.user && req.user.role === "admin") {
    retailerId = String(req.query.retailerId || "");
    if (!retailerId) return next(new AppError("retailerId query is required for admin", 400));
  } else if (req.retailer) {
    retailerId = String(req.retailer.id);
  } else {
    return next(new AppError("Authentication required", 401));
  }

  const messages = await SupportMessage.find({ retailer: retailerId })
    .sort({ createdAt: 1 })
    .limit(300);

  // Mark messages from the other party as read
  if (req.user && req.user.role === "admin") {
    await SupportMessage.updateMany(
      { retailer: retailerId, senderType: "retailer", isRead: false },
      { isRead: true }
    );
  } else if (req.retailer) {
    await SupportMessage.updateMany(
      { retailer: retailerId, senderType: "admin", isRead: false },
      { isRead: true }
    );
  }

  res.status(200).json({ status: "Success", results: messages.length, data: messages });
};

/** Admin inbox: retailers with last message + unread counts */
export const getSupportInbox = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin only", 403));
  }

  const retailers = await Retailer.find()
    .select("businessName email status location logo")
    .sort({ createdAt: -1 });

  const threads = await Promise.all(
    retailers.map(async (r) => {
      const last = await SupportMessage.findOne({ retailer: r._id }).sort({ createdAt: -1 });
      const unread = await SupportMessage.countDocuments({
        retailer: r._id,
        senderType: "retailer",
        isRead: false,
      });
      return {
        retailer: {
          id: r._id,
          businessName: r.businessName,
          email: r.email,
          status: r.status,
          location: r.location,
          logo: r.logo,
        },
        lastMessage: last
          ? {
              message: last.message,
              senderType: last.senderType,
              createdAt: last.createdAt,
            }
          : null,
        unread,
      };
    })
  );

  // Put threads with activity first
  threads.sort((a, b) => {
    const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta;
  });

  res.status(200).json({ status: "Success", results: threads.length, data: threads });
};

/** Retailer unread count from admin */
export const getSupportUnread = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.retailer) return next(new AppError("Retailer only", 403));
  const unread = await SupportMessage.countDocuments({
    retailer: req.retailer.id,
    senderType: "admin",
    isRead: false,
  });
  res.status(200).json({ status: "Success", data: { unread } });
};
