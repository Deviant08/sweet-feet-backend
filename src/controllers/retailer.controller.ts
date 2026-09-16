import { Request, Response, NextFunction } from "express";
import Retailer from "../models/retailer.model";
import { AppError } from "../middlewares/handleAppError.middleware";
import { RetailerStatus } from "../interface/retailer.interface";

const PROFILE_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
const HIDDEN = "-password -passwordResetToken -passwordResetTokenExpires";

function editMeta(retailer: { lastProfileEditAt?: Date | null }) {
  const last = retailer.lastProfileEditAt ? new Date(retailer.lastProfileEditAt) : null;
  if (!last) {
    return {
      canEdit: true,
      lastProfileEditAt: null,
      nextEditAt: null,
      cooldownDays: 90,
    };
  }
  const next = new Date(last.getTime() + PROFILE_COOLDOWN_MS);
  const canEdit = Date.now() >= next.getTime();
  return {
    canEdit,
    lastProfileEditAt: last,
    nextEditAt: canEdit ? null : next,
    cooldownDays: 90,
  };
}

function sanitizeLogo(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const value = String(raw).trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    if (value.length > 2000) throw new AppError("Photo URL is too long", 400);
    return value;
  }
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!match) throw new AppError("Profile photo must be a JPEG, PNG, or WebP", 400);
  const kind = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  const b64 = match[2].replace(/\s/g, "");
  const bytes = Math.ceil((b64.length * 3) / 4);
  if (bytes > 550000) throw new AppError("Profile photo is too large. Choose a smaller image.", 400);
  return `data:image/${kind};base64,${b64}`;
}

export const getApprovedRetailers = async (_req: Request, res: Response) => {
  const retailers = await Retailer.find({ status: RetailerStatus.approved }).select(HIDDEN);
  res.status(200).json({ status: "Success", results: retailers.length, data: retailers });
};

/** Admin: all retailers regardless of status */
export const getAllRetailers = async (_req: Request, res: Response) => {
  const retailers = await Retailer.find().select(HIDDEN).sort({ createdAt: -1 });
  res.status(200).json({ status: "Success", results: retailers.length, data: retailers });
};

export const getRetailer = async (req: Request, res: Response, next: NextFunction) => {
  const retailer = await Retailer.findById(req.params.id).select(HIDDEN);
  if (!retailer) return next(new AppError("Retailer not found", 404));
  res.status(200).json({ status: "Success", data: retailer, meta: editMeta(retailer) });
};

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  const retailer = await Retailer.findById(req.retailer!.id).select(HIDDEN);
  if (!retailer) return next(new AppError("Retailer not found", 404));
  res.status(200).json({ status: "Success", data: retailer, meta: editMeta(retailer) });
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  const retailer = await Retailer.findById(req.retailer!.id).select(HIDDEN);
  if (!retailer) return next(new AppError("Retailer not found", 404));

  const meta = editMeta(retailer);
  if (!meta.canEdit) {
    const when = meta.nextEditAt
      ? new Date(meta.nextEditAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "later";
    return next(
      new AppError(`Profile can only be edited once every 90 days. Next edit on ${when}.`, 403)
    );
  }

  const updates: Record<string, unknown> = {};
  if (req.body.businessName !== undefined) updates.businessName = String(req.body.businessName).trim();
  if (req.body.phone !== undefined) updates.phone = String(req.body.phone).trim();
  if (req.body.location !== undefined) updates.location = String(req.body.location).trim();
  if (req.body.bio !== undefined) updates.bio = String(req.body.bio).trim();
  if (req.body.logo !== undefined) updates.logo = sanitizeLogo(req.body.logo);

  if (updates.businessName !== undefined && !updates.businessName) {
    return next(new AppError("Business name is required", 400));
  }

  updates.lastProfileEditAt = new Date();

  const saved = await Retailer.findByIdAndUpdate(req.retailer!.id, updates, {
    new: true,
    runValidators: true,
  }).select(HIDDEN);

  if (!saved) return next(new AppError("Retailer not found", 404));
  res.status(200).json({ status: "Success", data: saved, meta: editMeta(saved) });
};

export const setRetailerStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!Object.values(RetailerStatus).includes(status)) {
    return next(new AppError("Invalid status", 400));
  }
  const retailer = await Retailer.findByIdAndUpdate(req.params.id, { status }, { new: true }).select(
    HIDDEN
  );
  if (!retailer) return next(new AppError("Retailer not found", 404));
  res.status(200).json({ status: "Success", data: retailer });
};