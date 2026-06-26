import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const defaultLocalDatabaseUrl = "file:../data/homepage-dev.db";

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set when NODE_ENV=production.");
  }

  process.env.DATABASE_URL = defaultLocalDatabaseUrl;
}

const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");

export const prisma = new PrismaClient();
