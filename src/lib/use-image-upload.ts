"use client";

// Shared admin image-upload plumbing. The same
// upload-a-file-then-read-{uploaded,url,message} dance was written out three
// times (the product's cover photo, the product gallery's multi-select, and
// the category image) with its own copy of the pending/error state and the
// input-reset in `finally`. Each copy also read the response as untyped
// `any`, so a change to the route's payload broke them silently.
//
// The route always answers with UploadResponse — see
// src/app/api/admin/upload/route.ts, which returns `{uploaded: false,
// message}` for every failure path including auth and rate limiting, so a
// non-2xx still carries a message worth showing.

import { useRef, useState } from "react";

const UPLOAD_ENDPOINT = "/api/admin/upload";
const FALLBACK_ERROR = "Upload failed.";

type UploadResponse = { uploaded: true; url: string } | { uploaded: false; message?: string };

/** Posts one file and narrows the response. Never throws for an upload the
 *  server rejected — that comes back as `ok: false` with its message, so
 *  callers only need a try/catch for the network itself. */
export async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body });
  const json: UploadResponse = await res.json();

  return json.uploaded ? { ok: true, url: json.url } : { ok: false, message: json.message ?? FALLBACK_ERROR };
}

type UseImageUpload = {
  uploading: boolean;
  error: string | null;
  /** Clears a stale message, e.g. after the user removes the failed image. */
  setError: (message: string | null) => void;
  /** Attach to the file input so it can be reset after a run — otherwise
   *  picking the same file twice in a row fires no change event. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** onChange handler. `onUploaded` is called once per successful file, in
   *  the order selected. A file the server rejects doesn't stop the run —
   *  the rest still upload and the last failure's message is what shows,
   *  matching how the gallery picker behaved before this was extracted. */
  handleFiles: (e: React.ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void) => Promise<void>;
};

/** `limit` guards a gallery's maximum; omit it for single-image fields. */
export function useImageUpload(limit?: { max: number; current: () => number; message: string }): UseImageUpload {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        if (limit && limit.current() >= limit.max) {
          setError(limit.message);
          break;
        }
        const result = await uploadImage(file);
        if (result.ok) {
          onUploaded(result.url);
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return { uploading, error, setError, inputRef, handleFiles };
}
