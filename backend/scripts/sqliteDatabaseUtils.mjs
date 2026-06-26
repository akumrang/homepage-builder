import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";

export const defaultLocalDatabaseUrl = "file:../data/homepage-dev.db";
export const defaultPrismaSchemaPath = "prisma/schema.prisma";

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set when NODE_ENV=production.");
  }

  return defaultLocalDatabaseUrl;
}

export function readSchemaPathFromArgs(args) {
  const inlineSchemaArg = args.find((arg) => arg.startsWith("--schema="));

  if (inlineSchemaArg) {
    return inlineSchemaArg.slice("--schema=".length);
  }

  const schemaArgIndex = args.indexOf("--schema");

  if (schemaArgIndex >= 0 && args[schemaArgIndex + 1]) {
    return args[schemaArgIndex + 1];
  }

  return defaultPrismaSchemaPath;
}

export function resolveSqliteFilePath(databaseUrl, schemaPath = defaultPrismaSchemaPath) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only SQLite file: DATABASE_URL values are supported by this script.");
  }

  const [rawFilePath] = databaseUrl.slice("file:".length).split("?");

  if (!rawFilePath || rawFilePath === ":memory:") {
    throw new Error("SQLite in-memory DATABASE_URL values cannot be backed up or restored.");
  }

  if (rawFilePath.includes("*")) {
    throw new Error("SQLite DATABASE_URL must point to one concrete file.");
  }

  if (path.isAbsolute(rawFilePath)) {
    return path.normalize(rawFilePath);
  }

  const schemaDirectory = path.dirname(path.resolve(schemaPath));
  return path.resolve(schemaDirectory, rawFilePath);
}

export function formatUtcTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function sanitizeBackupLabel(label) {
  const sanitizedLabel = label.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitizedLabel || "homepage-sqlite";
}

export function listSqliteCompanionFiles(databasePath) {
  return [`${databasePath}-wal`, `${databasePath}-shm`, `${databasePath}-journal`].filter(existsSync);
}

export function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
