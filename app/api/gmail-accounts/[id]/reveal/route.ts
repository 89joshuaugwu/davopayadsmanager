import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { decryptPassword } from "@/lib/crypto";
import { GmailAccount } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const ref = adminDb.collection("gmailAccounts").doc(params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Gmail account not found." }, { status: 404 });
    }

    const data = doc.data() as GmailAccount;
    const password = decryptPassword(data.encryptedPassword);

    return NextResponse.json({ password });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/gmail-accounts/[id]/reveal failed:", err);
    return NextResponse.json({ error: "Failed to decrypt password." }, { status: 500 });
  }
}
