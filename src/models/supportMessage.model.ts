import { Schema, model, SchemaTypes } from "mongoose";

export interface SupportMessageProps {
  retailer: Schema.Types.ObjectId;
  admin?: Schema.Types.ObjectId;
  senderType: "admin" | "retailer";
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

const supportMessageSchema = new Schema<SupportMessageProps>(
  {
    retailer: { type: SchemaTypes.ObjectId, ref: "Retailer", required: true, index: true },
    admin: { type: SchemaTypes.ObjectId, ref: "User" },
    senderType: { type: String, enum: ["admin", "retailer"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    isRead: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
);

supportMessageSchema.index({ retailer: 1, createdAt: 1 });

const SupportMessage = model<SupportMessageProps>("SupportMessage", supportMessageSchema);
export default SupportMessage;
