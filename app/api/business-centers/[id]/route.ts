import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.websiteUrl !== undefined) update.websiteUrl = body.websiteUrl;
    if (body.amountFunded !== undefined) update.amountFunded = Number(body.amountFunded) || 0;
    if (body.dateFunded !== undefined) update.dateFunded = body.dateFunded;
    if (body.status !== undefined) update.status = body.status;

    const ref = adminDb.collection("businessCenters").doc(params.id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Business center not found." }, { status: 404 });
    }

    await ref.update(update);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/business-centers/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update business center." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const [adsSnap, fundingSnap] = await Promise.all([
      adminDb.collection("adsAccounts").where("businessCenterId", "==", params.id).get(),
      adminDb.collection("businessCenterFunding").where("businessCenterId", "==", params.id).get(),
    ]);

    const batch = adminDb.batch();

    for (const adDoc of adsSnap.docs) {
      const logsSnap = await adminDb
        .collection("adsDailyLogs")
        .where("adsAccountId", "==", adDoc.id)
        .get();
      logsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(adDoc.ref);
    }

    fundingSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(adminDb.collection("businessCenters").doc(params.id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/business-centers/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete business center." }, { status: 500 });
  }
}
