import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";

const defaultLocalDatabaseUrl = "file:../data/homepage-dev.db";

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    console.error("DATABASE_URL must be set when NODE_ENV=production.");
    process.exit(1);
  }

  process.env.DATABASE_URL = defaultLocalDatabaseUrl;
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/withPrismaEnv.mjs <command> [...args]");
  process.exit(1);
}

const getSchemaPath = () => {
  const inlineSchemaArg = args.find((arg) => arg.startsWith("--schema="));

  if (inlineSchemaArg) {
    return inlineSchemaArg.slice("--schema=".length);
  }

  const schemaArgIndex = args.indexOf("--schema");

  if (schemaArgIndex >= 0 && args[schemaArgIndex + 1]) {
    return args[schemaArgIndex + 1];
  }

  return "prisma/schema.prisma";
};

const resolveSqliteFilePath = (databaseUrl) => {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const [rawFilePath] = databaseUrl.slice("file:".length).split("?");

  if (!rawFilePath || rawFilePath === ":memory:") {
    return null;
  }

  if (path.isAbsolute(rawFilePath)) {
    return rawFilePath;
  }

  const schemaDirectory = path.dirname(path.resolve(getSchemaPath()));
  return path.resolve(schemaDirectory, rawFilePath);
};

const shouldEnsureSqliteDatabase =
  command === "prisma" &&
  args[0] === "migrate" &&
  (args[1] === "deploy" || args[1] === "status");

if (shouldEnsureSqliteDatabase) {
  const sqliteFilePath = resolveSqliteFilePath(process.env.DATABASE_URL);

  if (sqliteFilePath && !existsSync(sqliteFilePath)) {
    mkdirSync(path.dirname(sqliteFilePath), { recursive: true });
    closeSync(openSync(sqliteFilePath, "a"));
  }
}

const commandLine = [command, ...args].join(" ");
const executable = process.platform === "win32" ? "cmd.exe" : command;
const executableArgs = process.platform === "win32" ? ["/d", "/s", "/c", commandLine] : args;

const child = spawn(executable, executableArgs, {
  env: process.env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
