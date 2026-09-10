import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import xss from "xss-clean";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import express, { Application, Request, Response, NextFunction } from "express";
import mongoSanitize from "express-mongo-sanitize";
import { AppError } from "./middlewares/handleAppError.middleware";
import { globalErrorHandler } from "./controllers/handleAppError.controller";

import authRouter from "./routes/auth.route";
import productRouter from "./routes/product.route";
import orderRouter from "./routes/order.route";
import retailerRouter from "./routes/retailer.route";
import messageRouter from "./routes/message.route";
import feedbackRouter from "./routes/feedback.route";
import seedRouter from "./routes/seed.route";

const app: Application = express();

// Avoid Express overload / PathParams typing issues with some middleware packages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mw = (handler: any) => handler;

const origins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : true,
    credentials: true,
  })
);
app.options("*", cors());

app.use(mw(helmet()));
app.use(mw(morgan("dev")));

const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, try again later",
});
app.use("/api", mw(limiter));

app.use(express.json({ limit: "10kb" }));
app.use(mw(cookieParser()));
app.use(mw(mongoSanitize()));
app.use(mw(xss()));
app.use(mw(hpp()));
app.use(mw(compression()));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to Sweet Feet API", version: "1.0" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/retailers", retailerRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/seed", seedRouter);

app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(mw(globalErrorHandler));

export default app;
