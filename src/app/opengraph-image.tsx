import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "HEIDIZ Essentialz — Luxury Beauty & Lifestyle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site-wide fallback social share card (Next's file-convention route,
// served automatically wherever a page doesn't set its own openGraph.images
// — product/category pages override this with the real product/category
// photo instead, see their generateMetadata). Renders at request time and
// gets cached by Next — no static asset to keep in sync with the brand.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #1a1410 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "2px solid #E8C9A0",
            marginBottom: 36,
          }}
        >
          <span style={{ fontSize: 40, color: "#E8C9A0", letterSpacing: 2 }}>HE</span>
        </div>
        <div style={{ display: "flex", fontSize: 76, color: "#FFFFFF", letterSpacing: 12 }}>
          HEIDIZ
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#B5531E",
            letterSpacing: 14,
            marginTop: 8,
            fontFamily: "Arial, sans-serif",
          }}
        >
          ESSENTIALZ
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#F8F6F2",
            marginTop: 40,
            fontFamily: "Arial, sans-serif",
            letterSpacing: 1,
          }}
        >
          Luxury, Elegance &amp; Beauty in Every Detail
        </div>
      </div>
    ),
    { ...size }
  );
}
