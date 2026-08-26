import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baseline security headers on every response. Deliberately no
  // Content-Security-Policy here: this page loads Clerk, Paystack inline JS,
  // the Monnify SDK script, Cloudinary/Unsplash images, and Google Fonts —
  // a CSP tight enough to matter has to be built and tested against all of
  // those origins together, and a wrong one fails silently in production by
  // breaking checkout/sign-in. Add one deliberately, not as a drive-by.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the browser guessing content types (e.g. treating an
          // uploaded "image" as executable HTML/script).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nothing on this site is meant to be framed by another site —
          // blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak the full URL (which can carry query params) to
          // third-party sites we link out to; still send origin cross-site
          // for analytics-style referrers.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs camera/mic/geolocation — deny by default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel already redirects http->https, but this tells the
          // browser itself to never even try http again for this host.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  images: {
    // Unsplash-hosted stock photography standing in for real product
    // photography (see src/lib/placeholder-data.ts). Remove once the
    // catalog moves to the client's own images/CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        // Real product photos uploaded via /admin (see
        // src/app/api/admin/upload) land here.
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
