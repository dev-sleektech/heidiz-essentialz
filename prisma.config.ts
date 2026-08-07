import { defineConfig, env } from "prisma/config";

// This project follows Next.js convention and keeps secrets in .env.local
// (Prisma's CLI only auto-loads plain .env), so load it explicitly here.
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
