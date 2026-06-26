import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import {
  getDatabaseUrl,
  readSchemaPathFromArgs,
  resolveSqliteFilePath
} from "./sqliteDatabaseUtils.mjs";

if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = getDatabaseUrl();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/withPrismaEnv.mjs <command> [...args]");
  process.exit(1);
}

const shouldEnsureSqliteDatabase =
  command === "prisma" &&
  args[0] === "migrate" &&
  (args[1] === "deploy" || args[1] === "status");

if (shouldEnsureSqliteDatabase) {
  let sqliteFilePath = null;

  try {
    sqliteFilePath = resolveSqliteFilePath(process.env.DATABASE_URL, readSchemaPathFromArgs(args));
  } catch {
    sqliteFilePath = null;
  }

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
