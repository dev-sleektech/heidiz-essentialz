import { defineConfig, env } from "prisma/config";

// This project follows Next.js convention and keeps secrets in .env.local
// (Prisma's CLI only auto-loads plain .env), so load it explicitly here.
// Only present locally — on Vercel, env vars are injected directly by the
// platform and there is no .env.local file, so a missing file is expected
// there, not an error. (Surfaced when `prisma generate` started running via
// postinstall on every `npm install`, including Vercel's — previously this
// only ever ran locally where the file always exists.)
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on Vercel/CI, real env vars are already set
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
