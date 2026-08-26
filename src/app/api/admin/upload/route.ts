import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Real product-photo upload, backing the image field in the admin product
// form (src/components/admin/product-edit-form.tsx). Product.image just
// stores a URL string either way, so this slots in without any schema
// change — previously that field held a /public path, now it can hold a
// Cloudinary URL too, both render identically via ProductVisual/next/image.
//
// Signed upload (never expose the API secret to the client): the signature
// is SHA1("folder=<folder>&timestamp=<ts>" + apiSecret), per Cloudinary's
// documented signing scheme (params sorted alphabetically, api_secret
// appended directly with no separator).
export async function POST(request: Request) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ uploaded: false, message: "Not authorized." }, { status: 403 });
  }

  // Keyed by staff user (not IP) since this is already authenticated —
  // bounds Cloudinary quota usage from a compromised session or runaway
  // script, not normal admin usage.
  const { allowed, retryAfterSeconds } = checkRateLimit(`admin-upload:${user!.id}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName.includes("replace_me")) {
    return NextResponse.json(
      { uploaded: false, message: "Image upload isn't configured yet. Add Cloudinary keys to enable this." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ uploaded: false, message: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ uploaded: false, message: "Only image files are allowed." }, { status: 400 });
  }
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — plenty for a product photo, bounds Cloudinary quota abuse
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ uploaded: false, message: "Image must be 10MB or smaller." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "heidiz-essentialz/products";
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(stringToSign).digest("hex");

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("timestamp", String(timestamp));
  uploadForm.append("folder", folder);
  uploadForm.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { uploaded: false, message: data?.error?.message ?? "Upload failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({ uploaded: true, url: data.secure_url as string });
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return NextResponse.json({ uploaded: false, message: "Could not reach the upload service." }, { status: 502 });
  }
}
