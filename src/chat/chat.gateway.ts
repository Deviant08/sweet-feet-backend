import http from "http";
import { URL } from "url";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import User from "../models/user.model";
import Retailer from "../models/retailer.model";
import Message from "../models/message.model";
import { RetailerStatus } from "../interface/retailer.interface";

type Role = "customer" | "retailer";

interface SocketAuth {
  id: string;
  role: Role;
  name: string;
}

interface LiveSocket extends WebSocket {
  auth?: SocketAuth;
  room?: string;
  inbox?: string;
}

interface ClientFrame {
  type?: string;
  partnerId?: string;
  text?: string;
  productId?: string;
  orderId?: string;
  on?: boolean;
}

const rooms = new Map<string, Set<LiveSocket>>();

const roomKey = (customerId: string, retailerId: string) => `c:${customerId}:r:${retailerId}`;
const inboxKey = (role: Role, id: string) => `inbox:${role}:${id}`;

function addToRoom(key: string, ws: LiveSocket) {
  if (!rooms.has(key)) rooms.set(key, new Set());
  rooms.get(key)!.add(ws);
}

function removeFromRoom(key: string | undefined, ws: LiveSocket) {
  if (!key) return;
  const set = rooms.get(key);
  if (!set) return;
  set.delete(ws);
  if (!set.size) rooms.delete(key);
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(key: string, payload: unknown, except?: LiveSocket) {
  const set = rooms.get(key);
  if (!set) return;
  for (const peer of set) {
    if (peer !== except && peer.readyState === WebSocket.OPEN) send(peer, payload);
  }
}

function parseCookieToken(cookieHeader?: string) {
  if (!cookieHeader) return undefined;
  const part = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith("jwt="));
  return part ? decodeURIComponent(part.slice(4)) : undefined;
}

async function authenticate(token?: string): Promise<SocketAuth> {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) throw new Error("Authentication required");
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  if (decoded.type === "retailer") {
    const retailer = await Retailer.findById(decoded.id);
    if (!retailer) throw new Error("Retailer no longer exists");
    if (retailer.status !== RetailerStatus.approved) throw new Error("Retailer account is not approved");
    if (retailer.changedPasswordAfter(decoded.iat ?? 0)) throw new Error("Password recently changed");
    return { id: String(retailer._id), role: "retailer", name: retailer.businessName };
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User no longer exists");
  if (user.changedPasswordAfter(decoded.iat ?? 0)) throw new Error("Password recently changed");
  return { id: String(user._id), role: "customer", name: user.fullName };
}

export function attachChatSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", async (ws: LiveSocket, req) => {
    try {
      const host = req.headers.host || "localhost";
      const url = new URL(req.url || "/ws/chat", `http://${host}`);
      const token = url.searchParams.get("token") || parseCookieToken(req.headers.cookie);
      ws.auth = await authenticate(token || undefined);
      ws.inbox = inboxKey(ws.auth.role, ws.auth.id);
      addToRoom(ws.inbox, ws);
      send(ws, { type: "ready", self: ws.auth });
    } catch (err: any) {
      send(ws, { type: "error", message: err.message || "Unauthorized" });
      ws.close();
      return;
    }

    ws.on("message", async (raw) => {
      let frame: ClientFrame;
      try {
        frame = JSON.parse(String(raw));
      } catch {
        send(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      const auth = ws.auth;
      if (!auth) return;

      if (frame.type === "ping") {
        send(ws, { type: "pong" });
        return;
      }

      if (frame.type === "join") {
        const partnerId = String(frame.partnerId || "");
        if (!partnerId) {
          send(ws, { type: "error", message: "partnerId required" });
          return;
        }
        const customerId = auth.role === "customer" ? auth.id : partnerId;
        const retailerId = auth.role === "retailer" ? auth.id : partnerId;
        const nextRoom = roomKey(customerId, retailerId);
        if (ws.room && ws.room !== nextRoom) removeFromRoom(ws.room, ws);
        ws.room = nextRoom;
        addToRoom(nextRoom, ws);
        send(ws, { type: "joined", room: nextRoom, partnerId });
        return;
      }

      if (frame.type === "typing") {
        if (!ws.room) return;
        broadcast(ws.room, { type: "typing", on: !!frame.on, from: auth.role, name: auth.name }, ws);
        return;
      }

      if (frame.type === "message") {
        const text = String(frame.text || "").trim();
        if (!text) {
          send(ws, { type: "error", message: "Message text is required" });
          return;
        }
        const partnerId = String(frame.partnerId || "");
        if (!partnerId && !ws.room) {
          send(ws, { type: "error", message: "Join a conversation first" });
          return;
        }
        const customerId = auth.role === "customer" ? auth.id : partnerId || ws.room?.split(":")[1];
        const retailerId = auth.role === "retailer" ? auth.id : partnerId || ws.room?.split(":")[3];
        if (!customerId || !retailerId) {
          send(ws, { type: "error", message: "Could not resolve conversation partners" });
          return;
        }

        try {
          const msg = await Message.create({
            customer: customerId,
            retailer: retailerId,
            product: frame.productId || undefined,
            order: frame.orderId || undefined,
            senderType: auth.role,
            message: text,
          });
          const payload = {
            type: "message",
            data: {
              _id: msg._id,
              customer: customerId,
              retailer: retailerId,
              senderType: auth.role,
              message: msg.message,
              isRead: msg.isRead,
              createdAt: msg.createdAt,
              authorName: auth.name,
            },
          };
          const key = roomKey(customerId, retailerId);
          if (ws.room !== key) {
            if (ws.room) removeFromRoom(ws.room, ws);
            ws.room = key;
            addToRoom(key, ws);
          }
          send(ws, payload);
          broadcast(key, payload, ws);
          const otherRole: Role = auth.role === "customer" ? "retailer" : "customer";
          const otherId = auth.role === "customer" ? retailerId : customerId;
          broadcast(inboxKey(otherRole, otherId), {
            type: "inbox",
            partnerId: auth.id,
            partnerName: auth.name,
            last_message: msg.message,
            createdAt: msg.createdAt,
          });
        } catch (err: any) {
          send(ws, { type: "error", message: err.message || "Could not save message" });
        }
      }
    });

    ws.on("close", () => {
      removeFromRoom(ws.room, ws);
      removeFromRoom(ws.inbox, ws);
    });
  });

  return wss;
}
