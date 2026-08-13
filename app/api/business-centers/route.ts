import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { BusinessCenterFunding } from "@/lib/types";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fundingId: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const entryRef = adminDb.collection("businessCenterFunding").doc(params.fundingId);
    const entryDoc = await entryRef.get();
    if (!entryDoc.exists) {
      return NextResponse.json({ error: "Funding entry not found." }, { status: 404 });
    }
    const entryData = entryDoc.data() as BusinessCenterFunding;

    await adminDb.collection("businessCenters").doc(params.id).update({
      amountFunded: FieldValue.increment(-entryData.amount),
    });
    await entryRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/business-centers/[id]/funding/[fundingId] failed:", err);
    return NextResponse.json({ error: "Failed to delete funding entry." }, { status: 500 });
  }
}
