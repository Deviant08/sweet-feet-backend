import { Router, Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import { protect, protectRetailer, restrictTo } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/handleAppError.middleware";
import {
  sendSupportMessage,
  getSupportConversation,
  getSupportInbox,
  getSupportUnread,
} from "../controllers/support.controller";

const supportRouter = Router();

/** Accept admin user token or retailer token */
const protectAdminOrRetailer = (req: Request, res: Response, next: NextFunction) => {
  protect(req, res, (err?: any) => {
    if (err) return next(err);
    if (req.retailer) return next();
    if (req.user && req.user.role === "admin") return next();
    return next(new AppError("Only admins and retailers can use support chat", 403));
  });
};

supportRouter.get("/inbox", protect, restrictTo("admin"), catchAsync(getSupportInbox));
supportRouter.get("/unread", protectRetailer, catchAsync(getSupportUnread));
supportRouter.get("/", protectAdminOrRetailer, catchAsync(getSupportConversation));
supportRouter.post("/", protectAdminOrRetailer, catchAsync(sendSupportMessage));

export default supportRouter;
