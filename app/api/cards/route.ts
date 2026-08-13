import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
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
    if (body.lastFour !== undefined) {
      if (!/^\d{4}$/.test(String(body.lastFour))) {
        return NextResponse.json({ error: "Last 4 digits must be exactly 4 numbers." }, { status: 400 });
      }
      update.lastFour = String(body.lastFour);
    }
    if (body.businessCenterId !== undefined) update.businessCenterId = body.businessCenterId;
    if (body.status !== undefined) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;

    const ref = adminDb.collection("cards").doc(params.id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    await ref.update(update);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/cards/[id] failed:", err);
    return NextResponse.json({ error: "Failed to update card." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    // Deleting a card shouldn't delete the funding history it paid for —
    // just detach the reference so past entries still show their amount/date,
    // with the card shown as removed rather than pointing at a ghost ID.
    const fundingSnap = await adminDb
      .collection("businessCenterFunding")
      .where("cardId", "==", params.id)
      .get();

    const batch = adminDb.batch();
    fundingSnap.docs.forEach((d) => batch.update(d.ref, { cardId: FieldValue.delete() }));
    batch.delete(adminDb.collection("cards").doc(params.id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/cards/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete card." }, { status: 500 });
  }
}
