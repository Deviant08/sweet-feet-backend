import { Router, Request, Response, NextFunction } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import { protect, protectRetailer, restrictTo } from "../middlewares/auth.middleware";
import {
  sendSupportMessage,
  getSupportConversation,
  getSupportInbox,
  getSupportUnread,
} from "../controllers/support.controller";

const supportRouter = Router();

/** Accept either an admin user token or a retailer token */
const protectAdminOrRetailer = async (req: Request, res: Response, next: NextFunction) => {
  // Try user/admin first via protect, but protect always sets user OR retailer from token type.
  // We call protect which handles both JWT types already.
  return protect(req, res, (err?: any) => {
    if (err) return next(err);
    // After protect: req.user (customer/admin) or req.retailer (and synthetic req.user role retailer)
    if (req.retailer) return next();
    if (req.user && (req.user.role === "admin" || req.user.role === "retailer")) return next();
    return next(new (require("../middlewares/handleAppError.middleware").AppError)("Forbidden", 403));
  });
};

supportRouter.get(
  "/inbox",
  protect,
  restrictTo("admin"),
  catchAsync(getSupportInbox)
);

supportRouter.get(
  "/unread",
  protectRetailer,
  catchAsync(getSupportUnread)
);

supportRouter.get("/", protectAdminOrRetailer, catchAsync(getSupportConversation));
supportRouter.post("/", protectAdminOrRetailer, catchAsync(sendSupportMessage));

export default supportRouter;
