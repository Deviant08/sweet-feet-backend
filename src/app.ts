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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mw = (handler: any) => handler;

const defaultOrigins = [
  "https://sweet-feet.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
];

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // allow same-origin / tools with no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // allow any *.vercel.app preview deployment
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.options("*", cors());

app.use(
  mw(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    })
  )
);
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
