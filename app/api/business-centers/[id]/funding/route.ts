import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { BusinessCenter, BusinessCenterFunding } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb
      .collection("businessCenterFunding")
      .where("businessCenterId", "==", params.id)
      .orderBy("date", "desc")
      .get();

    const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessCenterFunding, "id">) }));
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/business-centers/[id]/funding failed:", err);
    return NextResponse.json({ error: "Failed to load funding history." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();
    const { date, amount, note } = body;

    if (!date || amount === undefined) {
      return NextResponse.json({ error: "date and amount are required." }, { status: 400 });
    }

    const bcRef = adminDb.collection("businessCenters").doc(params.id);
    const bcDoc = await bcRef.get();
    if (!bcDoc.exists) {
      return NextResponse.json({ error: "Business center not found." }, { status: 404 });
    }
    const bcData = bcDoc.data() as BusinessCenter;

    const amountValue = Number(amount) || 0;

    const doc: Omit<BusinessCenterFunding, "id"> = {
      businessCenterId: params.id,
      gmailAccountId: bcData.gmailAccountId,
      amount: amountValue,
      date,
      note: note || "",
      createdAt: Date.now(),
    };
    const ref = await adminDb.collection("businessCenterFunding").add(doc);

    const isLatestDate = !bcData.dateFunded || date >= bcData.dateFunded;
    const update: Record<string, unknown> = {
      amountFunded: FieldValue.increment(amountValue),
    };
    if (isLatestDate) update.dateFunded = date;
    await bcRef.update(update);

    return NextResponse.json({ entry: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/business-centers/[id]/funding failed:", err);
    return NextResponse.json({ error: "Failed to save funding entry." }, { status: 500 });
  }
}
