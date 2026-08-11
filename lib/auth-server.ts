import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies the Firebase ID token sent in the Authorization header and confirms
 * the signed-in email exists in the `whitelisted_users` collection.
 * Every API route in this app calls this first — it is the single source of
 * truth for access control, since there is no public sign-up.
 */
export async function requireWhitelistedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new AuthError("No auth token provided.", 401);
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid or expired session. Please log in again.", 401);
  }

  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new AuthError("Access Denied: Unregistered Email", 403);
  }

  const whitelistDoc = await adminDb.collection("whitelisted_users").doc(email).get();
  if (!whitelistDoc.exists) {
    throw new AuthError("Access Denied: Unregistered Email", 403);
  }

  return { uid: decoded.uid, email };
}
