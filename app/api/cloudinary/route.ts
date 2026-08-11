import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireWhitelistedUser, AuthError } from "@/lib/auth-server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Accepts a base64 data URL (e.g. a generated PDF report or screenshot) and
 * uploads it to Cloudinary under the "davopay-reports" folder. Returns the
 * secure URL so it can be linked or re-downloaded later.
 */
export async function POST(req: NextRequest) {
  try {
    await requireWhitelistedUser(req);

    const body = await req.json();
    const { file, filename } = body;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: "davopay-reports",
      public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
      use_filename: true,
      unique_filename: true,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      createdAt: result.created_at,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/cloudinary failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
