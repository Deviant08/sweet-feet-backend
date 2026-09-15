import "dotenv/config";
import http from "http";
import app from "./app";
import mongoose from "mongoose";
import { attachChatSocket } from "./chat/chat.gateway";
import { ensureAdmin } from "./utils/ensureAdmin";

mongoose.set("strictQuery", false);

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION SHUTTING DOWN");
  console.log(err.name, err.message);
  process.exit(1);
});

const port = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === "production";
const host =
  isProd || process.env.RENDER
    ? "0.0.0.0"
    : process.env.HOST || "0.0.0.0";

function sanitizeMongoUri(raw: string): string {
  let uri = raw.trim().replace(/^['"]|['"]$/g, "");
  const q = uri.indexOf("?");
  if (q !== -1) uri = uri.slice(0, q);
  uri = uri.replace(/\/+$/, "");
  return uri;
}

function redact(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

const uri = sanitizeMongoUri(process.env.DATABASE_HOSTED || "");
const looksLocal = /127\.0\.0\.1|localhost/i.test(uri);

const dbConnect = async () => {
  if (!uri) {
    throw new Error("DATABASE_HOSTED is not set. Add a MongoDB Atlas URI in the Render environment.");
  }
  if (uri.includes("<db_password>") || uri.includes("<password>")) {
    throw new Error(
      "DATABASE_HOSTED still contains <db_password>. Replace that placeholder with the real Atlas user password."
    );
  }
  if (isProd && looksLocal) {
    throw new Error("DATABASE_HOSTED points at localhost. Use a MongoDB Atlas mongodb+srv URI.");
  }
  if (!uri.startsWith("mongodb")) {
    throw new Error("DATABASE_HOSTED must start with mongodb+srv:// or mongodb://");
  }

  console.log("Connecting to", redact(uri));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  console.log("************ DATABASE CONNECTED ************");
};

const start = async () => {
  try {
    await dbConnect();
    await ensureAdmin();
  } catch (err: any) {
    console.error("Startup failed:", err?.name, err?.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  attachChatSocket(server);

  server.listen(port, host, () => {
    console.log(`Sweet Feet API listening on http://${host}:${port}`);
    console.log("Chat WebSocket on /ws/chat");
  });

  process.on("unhandledRejection", (err: any) => {
    console.log(err?.name, err?.message);
    console.log("UNHANDLED REJECTION SHUTTING DOWN");
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    server.close(() => console.log("Process terminated"));
  });
};

start().catch((err) => {
  console.log(err?.name, err?.message);
  process.exit(1);
});
