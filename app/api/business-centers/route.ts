import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { BusinessCenter, MAX_BUSINESS_CENTERS_PER_GMAIL } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb
      .collection("businessCenters")
      .orderBy("createdAt", "desc")
      .get();

    const centers = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessCenter, "id">) }));
    return NextResponse.json({ centers });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/business-centers failed:", err);
    return NextResponse.json({ error: "Failed to load business centers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();
    const { gmailAccountId, name, websiteUrl, amountFunded, dateFunded, dateCreated, status } = body;

    if (!gmailAccountId || !name) {
      return NextResponse.json(
        { error: "gmailAccountId and name are required." },
        { status: 400 }
      );
    }

    const existingSnap = await adminDb
      .collection("businessCenters")
      .where("gmailAccountId", "==", gmailAccountId)
      .get();

    if (existingSnap.size >= MAX_BUSINESS_CENTERS_PER_GMAIL) {
      return NextResponse.json(
        {
          error: `This Gmail account already has the maximum of ${MAX_BUSINESS_CENTERS_PER_GMAIL} business centers.`,
        },
        { status: 409 }
      );
    }

    const doc: Omit<BusinessCenter, "id"> = {
      gmailAccountId,
      name: String(name).trim(),
      websiteUrl: websiteUrl || "",
      amountFunded: Number(amountFunded) || 0,
      dateFunded: dateFunded || new Date().toISOString().slice(0, 10),
      dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
      status: status === "disabled" ? "disabled" : "active",
      createdAt: Date.now(),
    };

    const ref = await adminDb.collection("businessCenters").add(doc);
    return NextResponse.json({ center: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/business-centers failed:", err);
    return NextResponse.json({ error: "Failed to create business center." }, { status: 500 });
  }
}
