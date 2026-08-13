import { NextRequest, NextResponse } from "next/server";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebaseAdmin";
import { AdsDailyLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const snap = await adminDb.collection("adsDailyLogs").orderBy("date", "desc").get();
    const logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdsDailyLog, "id">) }));

    return NextResponse.json({ logs });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/ads-daily-logs failed:", err);
    return NextResponse.json({ error: "Failed to load daily logs." }, { status: 500 });
  }
}
