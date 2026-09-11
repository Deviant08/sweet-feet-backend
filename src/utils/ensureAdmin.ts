import User from "../models/user.model";
import { UserRole } from "../interface/user.interface";

/**
 * Creates or promotes the operator admin from environment variables.
 * Set ADMIN_EMAIL and ADMIN_PASSWORD on Render. Never commit the password.
 */
export async function ensureAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const fullName = (process.env.ADMIN_NAME || "Sweet Feet Operator").trim();

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping operator admin bootstrap");
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
