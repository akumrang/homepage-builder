import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  formatUtcTimestamp,
  getDatabaseUrl,
  listSqliteCompanionFiles,
  resolveSqliteFilePath,
  sha256File
} from "./sqliteDatabaseUtils.mjs";

function readOption(args, name) {
  const inlineArg = args.find((arg) => arg.startsWith(`${name}=`));

  if (inlineArg) {
    return inlineArg.slice(name.length + 1);
  }

  const optionIndex = args.indexOf(name);
  return optionIndex >= 0 ? args[optionIndex + 1] : undefined;
}

function readBackupPath(args) {
  const configuredBackupPath = readOption(args, "--backup");

  if (configuredBackupPath) {
    return configuredBackupPath;
  }

  return args.find((arg) => !arg.startsWith("-"));
}

async function verifyBackupManifest(backupPath) {
  const manifestPath = `${backupPath}.manifest.json`;

  if (!existsSync(manifestPath)) {
    return { manifestPath, verified: false };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const backupStat = statSync(backupPath);
  const backupSha256 = await sha256File(backupPath);

  if (manifest.byteSize !== backupStat.size) {
    throw new Error(`Backup size does not match manifest: ${manifestPath}`);
  }

  if (manifest.sha256 !== backupSha256) {
    throw new Error(`Backup SHA256 does not match manifest: ${manifestPath}`);
  }

  return { manifestPath, verified: true };
}

const args = process.argv.slice(2);
const backupPathInput = readBackupPath(args);
const force = args.includes("--force");

if (!backupPathInput) {
  console.error("Usage: node scripts/restoreSqlite.mjs --backup <backup.db> [--force]");
  process.exit(1);
}

const backupPath = path.resolve(backupPathInput);
const databaseUrl = getDatabaseUrl();
const targetPath = resolveSqliteFilePath(databaseUrl);

if (!existsSync(backupPath)) {
  console.error(`Backup file does not exist: ${backupPath}`);
  process.exit(1);
}

if (path.resolve(backupPath).toLowerCase() === path.resolve(targetPath).toLowerCase()) {
  console.error("Backup path and target DB path must be different.");
  process.exit(1);
}

const manifestVerification = await verifyBackupManifest(backupPath);
const backupStat = statSync(backupPath);
const backupSha256 = await sha256File(backupPath);

if (!force) {
  console.log("SQLite restore dry run.");
  console.log(`Backup: ${backupPath}`);
  console.log(`Target: ${targetPath}`);
  console.log(`Backup bytes: ${backupStat.size}`);
  console.log(`Backup SHA256: ${backupSha256}`);
  console.log(`Manifest verified: ${manifestVerification.verified ? "yes" : "no"}`);
  console.log("Re-run with --force after stopping the backend process to replace the target DB.");
  process.exit(0);
}

const targetDirectory = path.dirname(targetPath);
mkdirSync(targetDirectory, { recursive: true });

const companionFiles = listSqliteCompanionFiles(targetPath);

if (companionFiles.length > 0) {
  console.error("SQLite companion files are present. Stop the backend process before restore.");
  for (const companionFile of companionFiles) {
    console.error(`- ${companionFile}`);
  }
  process.exit(1);
}

let safetyBackupPath = null;

if (existsSync(targetPath)) {
  const safetyBackupDirectory = path.resolve(process.env.HOMEPAGE_DB_BACKUP_DIR ?? "backups");
  mkdirSync(safetyBackupDirectory, { recursive: true });
  safetyBackupPath = path.join(safetyBackupDirectory, `pre-restore-${formatUtcTimestamp()}.db`);
  copyFileSync(targetPath, safetyBackupPath);
}

copyFileSync(backupPath, targetPath);

const restoredSha256 = await sha256File(targetPath);

if (restoredSha256 !== backupSha256) {
  throw new Error("Restored DB SHA256 does not match backup SHA256.");
}

writeFileSync(
  `${targetPath}.restore-log.json`,
  `${JSON.stringify(
    {
      service: "muksan-homepage",
      type: "sqlite-restore",
      restoredAt: new Date().toISOString(),
      backupPath,
      targetPath,
      safetyBackupPath,
      byteSize: statSync(targetPath).size,
      sha256: restoredSha256,
      manifestVerified: manifestVerification.verified
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`SQLite DB restored: ${targetPath}`);
if (safetyBackupPath) {
  console.log(`Previous target copied to: ${safetyBackupPath}`);
}
console.log(`Bytes: ${statSync(targetPath).size}`);
console.log(`SHA256: ${restoredSha256}`);
