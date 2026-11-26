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

// Raster formats only — image/svg+xml deliberately excluded even though it
// matches "image/*": an SVG is XML and can carry an inline <script>, so a
// "product photo" upload could otherwise become a stored-XSS payload served
// back from Cloudinary's URL.
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isAllowedImageMimeType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(type);
}

// Checks the file's actual leading bytes against known magic numbers for
// the four raster formats we accept — independent of whatever filename or
// Content-Type the client claims.
export function looksLikeAllowedImage(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif =
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return isJpeg || isPng || isGif || isWebp;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ uploaded: false, message: "Not authorized." }, { status: 403 });
  }

  // Keyed by staff user (not IP) since this is already authenticated —
  // bounds Cloudinary quota usage from a compromised session or runaway
  // script, not normal admin usage.
  const { allowed, retryAfterSeconds } = await checkRateLimit(`admin-upload:${user!.id}`, {
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
  // file.type is just the multipart Content-Type the browser sent — a
  // client can set that header to anything regardless of the actual bytes.
  if (!isAllowedImageMimeType(file.type)) {
    return NextResponse.json({ uploaded: false, message: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 400 });
  }
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — plenty for a product photo, bounds Cloudinary quota abuse
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ uploaded: false, message: "Image must be 10MB or smaller." }, { status: 400 });
  }

  // Don't trust the declared type — sniff the real file signature (magic
  // bytes) so a renamed/relabeled non-image file can't ride through on a
  // spoofed Content-Type.
  const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!looksLikeAllowedImage(headerBytes)) {
    return NextResponse.json({ uploaded: false, message: "File content doesn't match a supported image format." }, { status: 400 });
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
