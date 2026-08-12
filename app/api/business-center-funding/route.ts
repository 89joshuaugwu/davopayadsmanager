import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { BusinessCenterFunding } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb.collection("businessCenterFunding").orderBy("date", "desc").get();
    const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessCenterFunding, "id">) }));

    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/business-center-funding failed:", err);
    return NextResponse.json({ error: "Failed to load funding history." }, { status: 500 });
  }
}
