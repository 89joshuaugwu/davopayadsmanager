import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { encryptPassword } from "@/lib/crypto";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();

    const update: Record<string, unknown> = {};
    const allowedFields = [
      "email",
      "tiktokAccountName",
      "tiktokManagerAccountName",
      "status",
      "notes",
      "dateCreated",
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    if (typeof update.email === "string") {
      update.email = update.email.trim().toLowerCase();
    }

    // Only re-encrypt if a new password was actually supplied
    if (body.password) {
      update.encryptedPassword = encryptPassword(String(body.password));
    }

    const ref = adminDb.collection("gmailAccounts").doc(params.id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Gmail account not found." }, { status: 404 });
    }

    await ref.update(update);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/gmail-accounts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update Gmail account." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    // Cascade delete: business centers under this Gmail account, their funding
    // history, the ads accounts under each business center, and those ads
    // accounts' daily logs.
    const bcSnap = await adminDb
      .collection("businessCenters")
      .where("gmailAccountId", "==", params.id)
      .get();

    const batch = adminDb.batch();

    for (const bcDoc of bcSnap.docs) {
      const [adsSnap, fundingSnap] = await Promise.all([
        adminDb.collection("adsAccounts").where("businessCenterId", "==", bcDoc.id).get(),
        adminDb.collection("businessCenterFunding").where("businessCenterId", "==", bcDoc.id).get(),
      ]);

      for (const adDoc of adsSnap.docs) {
        const logsSnap = await adminDb
          .collection("adsDailyLogs")
          .where("adsAccountId", "==", adDoc.id)
          .get();
        logsSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(adDoc.ref);
      }

      fundingSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(bcDoc.ref);
    }

    batch.delete(adminDb.collection("gmailAccounts").doc(params.id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/gmail-accounts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete Gmail account." }, { status: 500 });
  }
}
