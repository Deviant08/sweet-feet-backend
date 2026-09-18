import { Router } from "express";
import { catchAsync } from "../middlewares/catchAsyncError.middleware";
import { protect, protectRetailer, restrictTo } from "../middlewares/auth.middleware";
import {
  getAllProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getHouseProducts,
  createHouseProduct,
  updateHouseProduct,
  deleteHouseProduct,
} from "../controllers/product.controller";

const productRouter = Router();

productRouter.get("/", catchAsync(getAllProducts));
productRouter.get("/house", protect, restrictTo("admin"), catchAsync(getHouseProducts));
productRouter.post("/house", protect, restrictTo("admin"), catchAsync(createHouseProduct));
productRouter.patch("/house/:id", protect, restrictTo("admin"), catchAsync(updateHouseProduct));
productRouter.delete("/house/:id", protect, restrictTo("admin"), catchAsync(deleteHouseProduct));
productRouter.get("/mine", protectRetailer, catchAsync(getMyProducts));
productRouter.get("/:id", catchAsync(getProduct));
productRouter.post("/", protectRetailer, catchAsync(createProduct));
productRouter.patch("/:id", protectRetailer, catchAsync(updateProduct));
productRouter.delete("/:id", protectRetailer, catchAsync(deleteProduct));

export default productRouter;
