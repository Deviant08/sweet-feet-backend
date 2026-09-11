import User from "../models/user.model";
import { UserRole } from "../interface/user.interface";

const DEFAULT_ADMIN_EMAIL = "nnimoyoefoki@gmail.com";
const DEFAULT_ADMIN_USERNAME = "10thmav";

export async function ensureAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const username = (process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const fullName = (process.env.ADMIN_NAME || "10thmav").trim();

  if (!password) {
    console.log("ADMIN_PASSWORD is not set — operator admin will not be created or updated");
    return;
  }
  if (password.length < 8) {
    console.log("ADMIN_PASSWORD is shorter than 8 characters — skipping operator admin bootstrap");
    return;
  }

  let user = await User.findOne({ $or: [{ email }, { username }] }).select("+password");
  if (!user) {
    user = await User.create({
      fullName,
      username,
      email,
      phone: process.env.ADMIN_PHONE || undefined,
      password,
      passwordConfirm: password,
      role: UserRole.admin,
      active: true,
    });
    console.log(`Operator admin created: ${username} <${email}>`);
    return;
  }

  user.role = UserRole.admin;
  user.active = true;
  user.fullName = fullName;
  user.username = username;
  user.email = email;
  user.password = password;
  user.passwordConfirm = password;
  await user.save();
  console.log(`Operator admin updated: ${username} <${email}>`);
}
