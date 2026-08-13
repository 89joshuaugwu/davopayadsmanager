import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { PaymentCard } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb.collection("cards").orderBy("createdAt", "desc").get();
    const cards = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentCard, "id">) }));

    return NextResponse.json({ cards });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/cards failed:", err);
    return NextResponse.json({ error: "Failed to load cards." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);
    const body = await req.json();
    const { name, lastFour, businessCenterId, status, notes } = body;

    if (!name || !lastFour) {
      return NextResponse.json({ error: "Card name and last 4 digits are required." }, { status: 400 });
    }
    if (!/^\d{4}$/.test(String(lastFour))) {
      return NextResponse.json({ error: "Last 4 digits must be exactly 4 numbers." }, { status: 400 });
    }

    const doc: Omit<PaymentCard, "id"> = {
      name: String(name).trim(),
      lastFour: String(lastFour),
      businessCenterId: businessCenterId || "",
      status: status === "inactive" ? "inactive" : "active",
      notes: notes || "",
      createdAt: Date.now(),
    };

    const ref = await adminDb.collection("cards").add(doc);
    return NextResponse.json({ card: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/cards failed:", err);
    return NextResponse.json({ error: "Failed to create card." }, { status: 500 });
  }
}
