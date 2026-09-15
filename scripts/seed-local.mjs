#!/usr/bin/env node
/**
 * Loads demo retailers + products into the LOCAL Mongo database.
 * Does nothing to Render / Atlas. Requires the API to be running locally.
 *
 *   npm run seed
 */
const base = (process.env.LOCAL_API || "http://127.0.0.1:5000/api/v1").replace(/\/$/, "");

async function post(path) {
  const res = await fetch(`${base}${path}`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} → ${res.status} ${body.message || JSON.stringify(body)}`);
  }
  return body;
}

try {
  console.log(`Seeding local API at ${base}`);
  const accounts = await post("/seed/accounts");
  console.log("Accounts:", JSON.stringify(accounts.data?.accounts, null, 2));
  const demo = await post("/seed/demo");
  console.log("Catalogue:", JSON.stringify(demo.data, null, 2));
  console.log("Done. Browse http://127.0.0.1:5000/api/v1/products");
} catch (err) {
  console.error("Local seed failed:", err.message);
  console.error("Is the API running?  npm run dev   (DATABASE_HOSTED must be mongodb://127.0.0.1:27017/sweetfeet)");
  process.exit(1);
}
