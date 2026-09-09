import "dotenv/config";
import http from "http";
import app from "./app";
import mongoose from "mongoose";
import { attachChatSocket } from "./chat/chat.gateway";

mongoose.set("strictQuery", false);

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 🔥 SHUTTING DOWN");
  console.log(err.name, err.message);
  process.exit(1);
});

const port = process.env.PORT || 5000;
const uri = process.env.DATABASE_HOSTED || "";
const isProd = process.env.NODE_ENV === "production";
const looksLocal =
  /127\.0\.0\.1|localhost/i.test(uri) || uri.startsWith("mongodb://127");

const dbConnect = async () => {
  if (!uri) {
    throw new Error("DATABASE_HOSTED is not set. Add a MongoDB Atlas URI in the Render environment.");
  }
  if (isProd && looksLocal) {
    throw new Error(
      "DATABASE_HOSTED points at localhost. On Render you must use a hosted URI (MongoDB Atlas), not 127.0.0.1."
    );
  }
  await mongoose.connect(uri);
  console.log("************ DATABASE CONNECTED ************");
};

const start = async () => {
  await dbConnect();
  const server = http.createServer(app);
  attachChatSocket(server);
  server.listen(port, () => {
    console.log(`Sweet Feet API listening on port ${port}`);
    console.log(`Chat WebSocket on /ws/chat`);
  });

  process.on("unhandledRejection", (err: any) => {
    console.log(err?.name, err?.message);
    console.log("UNHANDLED REJECTION 🔥 SHUTTING DOWN");
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM RECEIVED 🔥 SHUTTING DOWN");
    server.close(() => console.log("Process terminated"));
  });
};

start().catch((err) => {
  console.log(err?.name, err?.message);
  process.exit(1);
});
