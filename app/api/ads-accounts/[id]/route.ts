import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { CPA_ALERT_THRESHOLD } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();

    const ref = adminDb.collection("adsAccounts").doc(params.id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Ads account not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.destinationUrl !== undefined) update.destinationUrl = body.destinationUrl;
    if (body.amountSpent !== undefined) update.amountSpent = Number(body.amountSpent) || 0;
    if (body.hasAd !== undefined) update.hasAd = Boolean(body.hasAd);
    if (body.status !== undefined) update.status = body.status;
    if (body.fundsLost !== undefined) update.fundsLost = Number(body.fundsLost) || 0;
    if (body.dateUpdated !== undefined) update.dateUpdated = body.dateUpdated;

    if (body.cpa !== undefined) {
      const cpaValue = Number(body.cpa) || 0;
      update.cpa = cpaValue;

      // Re-evaluate the auto-flag whenever CPA changes, unless the caller
      // explicitly supplied their own invalidationReason in this same request.
      if (body.invalidationReason === undefined) {
        update.invalidationReason =
          cpaValue > CPA_ALERT_THRESHOLD ? `High CPA (${cpaValue}) — flagged for pause` : "";
      }
    }
    if (body.invalidationReason !== undefined) {
      update.invalidationReason = body.invalidationReason;
    }

    await ref.update(update);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/ads-accounts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update ads account." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const logsSnap = await adminDb
      .collection("adsDailyLogs")
      .where("adsAccountId", "==", params.id)
      .get();

    const batch = adminDb.batch();
    logsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(adminDb.collection("adsAccounts").doc(params.id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/ads-accounts/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete ads account." }, { status: 500 });
  }
}
