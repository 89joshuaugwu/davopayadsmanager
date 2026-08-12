import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { AdsDailyLog } from "@/lib/types";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; logId: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const logRef = adminDb.collection("adsDailyLogs").doc(params.logId);
    const logDoc = await logRef.get();
    if (!logDoc.exists) {
      return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
    }
    const logData = logDoc.data() as AdsDailyLog;

    await adminDb.collection("adsAccounts").doc(params.id).update({
      amountSpent: FieldValue.increment(-logData.amountSpent),
    });
    await logRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/ads-accounts/[id]/daily-logs/[logId] failed:", err);
    return NextResponse.json({ error: "Failed to delete log entry." }, { status: 500 });
  }
}
