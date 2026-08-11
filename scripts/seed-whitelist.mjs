/**
 * One-time script to add a whitelisted email so it can log in to DavoPay.
 * There is no in-app sign-up, so this is how you grant access to a new user.
 *
 * Usage:
 *   node scripts/seed-whitelist.mjs joshuaugwu89@gmail.com
 *   node scripts/seed-whitelist.mjs boss@example.com another@example.com
 *
 * Requires the same FIREBASE_ADMIN_* env vars as the app (loaded from .env.local).
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Minimal .env.local loader so this works without extra dependencies
function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("No .env.local found — relying on already-exported environment variables.");
  }
}

loadEnvLocal();

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY in .env.local"
  );
  process.exit(1);
}

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("Usage: node scripts/seed-whitelist.mjs email1@example.com [email2@example.com ...]");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

for (const rawEmail of emails) {
  const email = rawEmail.trim().toLowerCase();
  await db.collection("whitelisted_users").doc(email).set({
    email,
    addedAt: Date.now(),
  });
  console.log(`✔ Whitelisted: ${email}`);
}

console.log("Done. These emails can now sign in with Google Sign-In or Email/Password.");
process.exit(0);
