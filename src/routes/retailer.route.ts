import { Router } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import { protect, protectRetailerSession, restrictTo } from "../middlewares/auth.middleware";
import {
  getApprovedRetailers,
  getAllRetailers,
  getRetailer,
  getMyProfile,
  updateMyProfile,
  setRetailerStatus,
} from "../controllers/retailer.controller";

const retailerRouter = Router();

retailerRouter.get("/", catchAsync(getApprovedRetailers));
retailerRouter.get("/admin/all", protect, restrictTo("admin"), catchAsync(getAllRetailers));
retailerRouter.get("/me", protectRetailerSession, catchAsync(getMyProfile));
retailerRouter.patch("/me", protectRetailerSession, catchAsync(updateMyProfile));
retailerRouter.get("/:id", catchAsync(getRetailer));
retailerRouter.patch("/:id/status", protect, restrictTo("admin"), catchAsync(setRetailerStatus));

export default retailerRouter;