import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { AdsAccount, CPA_ALERT_THRESHOLD, MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb
      .collection("adsAccounts")
      .orderBy("createdAt", "desc")
      .get();

    const accounts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdsAccount, "id">) }));
    return NextResponse.json({ accounts });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/ads-accounts failed:", err);
    return NextResponse.json({ error: "Failed to load ads accounts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();
    const {
      businessCenterId,
      name,
      destinationUrl,
      amountSpent,
      cpa,
      hasAd,
      status,
      invalidationReason,
      fundsLost,
      dateUpdated,
      dateCreated,
    } = body;

    if (!businessCenterId || !name) {
      return NextResponse.json(
        { error: "businessCenterId and name are required." },
        { status: 400 }
      );
    }

    const existingSnap = await adminDb
      .collection("adsAccounts")
      .where("businessCenterId", "==", businessCenterId)
      .get();

    if (existingSnap.size >= MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER) {
      return NextResponse.json(
        {
          error: `This business center already has the maximum of ${MAX_ADS_ACCOUNTS_PER_BUSINESS_CENTER} ads accounts.`,
        },
        { status: 409 }
      );
    }

    const cpaValue = Number(cpa) || 0;
    let finalStatus = status === "active" || status === "paused" || status === "blocked" || status === "closed"
      ? status
      : "active";

    // Auto-flag: if CPA exceeds threshold and no explicit status change was requested,
    // surface it as paused so it doesn't silently keep spending.
    let finalInvalidationReason = invalidationReason || "";
    if (cpaValue > CPA_ALERT_THRESHOLD && !invalidationReason) {
      finalInvalidationReason = `High CPA (${cpaValue}) — flagged for pause`;
    }

    const doc: Omit<AdsAccount, "id"> = {
      businessCenterId,
      name: String(name).trim(),
      destinationUrl: destinationUrl || "",
      amountSpent: Number(amountSpent) || 0,
      cpa: cpaValue,
      hasAd: Boolean(hasAd),
      status: finalStatus,
      invalidationReason: finalInvalidationReason,
      fundsLost: Number(fundsLost) || 0,
      dateUpdated: dateUpdated || new Date().toISOString().slice(0, 10),
      dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    };

    const ref = await adminDb.collection("adsAccounts").add(doc);
    return NextResponse.json({ account: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/ads-accounts failed:", err);
    return NextResponse.json({ error: "Failed to create ads account." }, { status: 500 });
  }
}
