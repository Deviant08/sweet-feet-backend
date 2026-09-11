import User from "../models/user.model";
import { UserRole } from "../interface/user.interface";

const DEFAULT_ADMIN_EMAIL = "nnimoyoefoki@gmail.com";

/**
 * Creates or promotes the operator admin.
 * Email defaults to the platform owner. Password comes only from ADMIN_PASSWORD
 * (Render environment) and is never committed.
 */
export async function ensureAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const fullName = (process.env.ADMIN_NAME || "Nnimoyo Efoki").trim();

  if (!password) {
    console.log("ADMIN_PASSWORD is not set — operator admin will not be created or updated");
    return;
  }
  if (password.length < 8) {
    console.log("ADMIN_PASSWORD is shorter than 8 characters — skipping operator admin bootstrap");
    return;
  }

  let user = await User.findOne({ email }).select("+password");
  if (!user) {
    user = await User.create({
      fullName,
      email,
      phone: process.env.ADMIN_PHONE || undefined,
      password,
      passwordConfirm: password,
      role: UserRole.admin,
      active: true,
    });
    console.log(`Operator admin created: ${email}`);
    return;
  }

  user.role = UserRole.admin;
  user.active = true;
  if (fullName) user.fullName = fullName;
  user.password = password;
  user.passwordConfirm = password;
  await user.save();
  console.log(`Operator admin updated: ${email}`);
}
