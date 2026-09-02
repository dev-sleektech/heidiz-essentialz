"use client";

// Last-resort boundary: catches a failure in the root layout itself, which
// error.tsx can't — it lives inside that layout. Because the layout is what
// broke, this has to render its own <html>/<body>, and it can't rely on the
// font variables or Tailwind theme the layout normally provides. Hence the
// inline styles: brand colours from globals.css, hard-coded, so this always
// renders even when everything above it is unavailable.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal storefront error:", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f6f2",
          color: "#2d2d2d",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 500, color: "#000", margin: "0 0 1rem" }}>
            HEIDIZ Essentialz is temporarily unavailable
          </h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 1.75rem", opacity: 0.75 }}>
            We hit an unexpected problem loading the store. Nothing has been charged. Please try
            again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#b5531e",
              color: "#fff",
              border: "none",
              borderRadius: "9999px",
              padding: "0.75rem 1.75rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.75rem", fontSize: "0.75rem", opacity: 0.5 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
