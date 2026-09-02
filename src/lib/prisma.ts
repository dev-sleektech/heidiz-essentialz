import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Standard Next.js singleton pattern — avoids exhausting Neon's connection
// pool by reusing one client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Bounded pool. The default is 10 connections *per process*, and a
  // production build prerenders across several worker processes at once
  // while dev/serverless instances add more on top — enough to exhaust
  // Neon's connection limit and fail a deploy with "Connection terminated
  // unexpectedly" partway through prerendering. Nothing here needs more
  // than a handful of concurrent queries per instance.
  max: 5,
  // Fail a hung connect fast instead of holding a request open until the
  // platform's own timeout kills it with no useful error.
  connectionTimeoutMillis: 10_000,
  // Neon closes idle connections on its side; letting ours go first avoids
  // handing a dead socket to the next query.
  idleTimeoutMillis: 30_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
