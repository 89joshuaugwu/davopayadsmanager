import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { AdsAccount, AdsDailyLog, CPA_ALERT_THRESHOLD } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb
      .collection("adsDailyLogs")
      .where("adsAccountId", "==", params.id)
      .orderBy("date", "desc")
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdsDailyLog, "id">) }));
    return NextResponse.json({ logs });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/ads-accounts/[id]/daily-logs failed:", err);
    return NextResponse.json({ error: "Failed to load daily logs." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();
    const { date, amountSpent, cpa } = body;

    if (!date || amountSpent === undefined || cpa === undefined) {
      return NextResponse.json(
        { error: "date, amountSpent, and cpa are required." },
        { status: 400 }
      );
    }

    const adsRef = adminDb.collection("adsAccounts").doc(params.id);
    const adsDoc = await adsRef.get();
    if (!adsDoc.exists) {
      return NextResponse.json({ error: "Ads account not found." }, { status: 404 });
    }
    const adsData = adsDoc.data() as AdsAccount;

    const newSpent = Number(amountSpent) || 0;
    const newCpa = Number(cpa) || 0;

    // One log per account per day — if today already has an entry, replace it
    // and adjust the rollup by the difference rather than double-counting.
    const existingSnap = await adminDb
      .collection("adsDailyLogs")
      .where("adsAccountId", "==", params.id)
      .where("date", "==", date)
      .limit(1)
      .get();

    let spentDelta = newSpent;
    let logId: string;

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data() as AdsDailyLog;
      spentDelta = newSpent - existingData.amountSpent;
      await existingDoc.ref.update({ amountSpent: newSpent, cpa: newCpa });
      logId = existingDoc.id;
    } else {
      const doc: Omit<AdsDailyLog, "id"> = {
        adsAccountId: params.id,
        businessCenterId: adsData.businessCenterId,
        gmailAccountId: body.gmailAccountId || "",
        date,
        amountSpent: newSpent,
        cpa: newCpa,
        createdAt: Date.now(),
      };
      const ref = await adminDb.collection("adsDailyLogs").add(doc);
      logId = ref.id;
    }

    // Keep the ads account's rollup fields in sync: total spend accumulates,
    // CPA reflects the most recent day logged (that's what should trigger the flag).
    const isLatestDay = !adsData.dateUpdated || date >= adsData.dateUpdated;
    const update: Record<string, unknown> = {
      amountSpent: FieldValue.increment(spentDelta),
    };
    if (isLatestDay) {
      update.cpa = newCpa;
      update.dateUpdated = date;
      update.invalidationReason =
        newCpa > CPA_ALERT_THRESHOLD ? `High CPA (${newCpa}) — flagged for pause` : "";
    }
    await adsRef.update(update);

    return NextResponse.json({ logId }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/ads-accounts/[id]/daily-logs failed:", err);
    return NextResponse.json({ error: "Failed to save daily log." }, { status: 500 });
  }
}
