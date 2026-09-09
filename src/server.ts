import "dotenv/config";
import http from "http";
import app from "./app";
import mongoose from "mongoose";
import { attachChatSocket } from "./chat/chat.gateway";

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 🔥 SHUTTING DOWN");
  console.log(err.name, err.message);
  process.exit(1);
});

const port = process.env.PORT || 5000;
const { DATABASE_HOSTED, HOST } = process.env;

const dbConnect = async () => {
  if (!DATABASE_HOSTED) throw new Error("DATABASE_HOSTED is not set");
  await mongoose.connect(DATABASE_HOSTED);
  console.log("************ DATABASE CONNECTED ************");
};

const server = http.createServer(app);
attachChatSocket(server);

server.listen(port, async () => {
  await dbConnect();
  console.log(`Sweet Feet API running on http://${HOST || "localhost"}:${port}`);
  console.log(`Chat WebSocket on ws://${HOST || "localhost"}:${port}/ws/chat`);
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
