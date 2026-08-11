import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { encryptPassword } from "@/lib/crypto";
import { GmailAccount, GmailAccountPublic } from "@/lib/types";

function toPublic(doc: GmailAccount): GmailAccountPublic {
  const { encryptedPassword, ...rest } = doc;
  return { ...rest, hasPassword: Boolean(encryptedPassword) };
}

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb
      .collection("gmailAccounts")
      .orderBy("createdAt", "desc")
      .get();

    const accounts = snap.docs.map((d) =>
      toPublic({ id: d.id, ...(d.data() as Omit<GmailAccount, "id">) })
    );

    return NextResponse.json({ accounts });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/gmail-accounts failed:", err);
    return NextResponse.json({ error: "Failed to load Gmail accounts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const body = await req.json();
    const { email, password, tiktokAccountName, tiktokManagerAccountName, status, notes, dateCreated } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const doc: Omit<GmailAccount, "id"> = {
      email: String(email).trim().toLowerCase(),
      encryptedPassword: encryptPassword(String(password)),
      tiktokAccountName: tiktokAccountName || "",
      tiktokManagerAccountName: tiktokManagerAccountName || "",
      status: status === "disabled" ? "disabled" : "active",
      notes: notes || "",
      dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
      createdAt: now,
    };

    const ref = await adminDb.collection("gmailAccounts").add(doc);
    return NextResponse.json({ account: toPublic({ id: ref.id, ...doc }) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/gmail-accounts failed:", err);
    return NextResponse.json({ error: "Failed to create Gmail account." }, { status: 500 });
  }
}
