import { Router } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import { protect, protectRetailer, restrictTo, optionalProtect } from "../middlewares/auth.middleware";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getRetailerOrders,
  getHouseOrders,
  updateItemStatus,
  updateHouseItemStatus,
  getOrder,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", optionalProtect, catchAsync(createOrder));
orderRouter.post("/verify", catchAsync(verifyPayment));
orderRouter.get("/verify", catchAsync(verifyPayment));
orderRouter.get("/mine", protect, catchAsync(getMyOrders));
orderRouter.get("/retailer", protectRetailer, catchAsync(getRetailerOrders));
orderRouter.get("/house", protect, restrictTo("admin"), catchAsync(getHouseOrders));
orderRouter.patch("/item-status", protectRetailer, catchAsync(updateItemStatus));
orderRouter.patch("/house-item-status", protect, restrictTo("admin"), catchAsync(updateHouseItemStatus));
orderRouter.get("/:id", protect, catchAsync(getOrder));

export default orderRouter;
