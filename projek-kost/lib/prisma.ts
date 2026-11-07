import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma =
  g.prisma ??
  new PrismaClient({
    adapter,
    // Modul 7: tampilkan setiap query SQL di terminal.
    // Hapus "query" setelah praktikum agar log tidak terlalu ramai.
    log: ["query", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
