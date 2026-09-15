import { Schema, model, SchemaTypes } from "mongoose";

export interface MessageProps {
  threadType: "shop" | "staff";
  customer?: Schema.Types.ObjectId;
  admin?: Schema.Types.ObjectId;
  retailer: Schema.Types.ObjectId;
  product?: Schema.Types.ObjectId;
  order?: Schema.Types.ObjectId;
  senderType: "customer" | "retailer" | "admin";
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

const messageSchema = new Schema<MessageProps>(
  {
    threadType: {
      type: String,
      enum: ["shop", "staff"],
      default: "shop",
    },
    customer: { type: SchemaTypes.ObjectId, ref: "User" },
    admin: { type: SchemaTypes.ObjectId, ref: "User" },
    retailer: { type: SchemaTypes.ObjectId, ref: "Retailer", required: true },
    product: { type: SchemaTypes.ObjectId, ref: "Product" },
    order: { type: SchemaTypes.ObjectId, ref: "Order" },
    senderType: {
      type: String,
      enum: ["customer", "retailer", "admin"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ customer: 1, retailer: 1, createdAt: -1 });
messageSchema.index({ admin: 1, retailer: 1, createdAt: -1 });
messageSchema.index({ threadType: 1, retailer: 1, createdAt: -1 });

const Message = model<MessageProps>("Message", messageSchema);
export default Message;
