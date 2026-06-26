import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  formatUtcTimestamp,
  getDatabaseUrl,
  listSqliteCompanionFiles,
  resolveSqliteFilePath,
  sanitizeBackupLabel,
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

const args = process.argv.slice(2);
const databaseUrl = getDatabaseUrl();
const sourcePath = resolveSqliteFilePath(databaseUrl);
const backupDirectory = path.resolve(
  readOption(args, "--out-dir") ?? process.env.HOMEPAGE_DB_BACKUP_DIR ?? "backups"
);
const label = sanitizeBackupLabel(readOption(args, "--label") ?? "homepage-sqlite");
const timestamp = formatUtcTimestamp();

if (!existsSync(sourcePath)) {
  console.error(`SQLite DB file does not exist: ${sourcePath}`);
  process.exit(1);
}

const companionFiles = listSqliteCompanionFiles(sourcePath);

if (companionFiles.length > 0) {
  console.error("SQLite companion files are present. Stop the backend process before file-level backup.");
  for (const companionFile of companionFiles) {
    console.error(`- ${companionFile}`);
  }
  process.exit(1);
}

mkdirSync(backupDirectory, { recursive: true });

const backupPath = path.join(backupDirectory, `${label}-${timestamp}.db`);
const manifestPath = `${backupPath}.manifest.json`;

copyFileSync(sourcePath, backupPath);

const sourceStat = statSync(sourcePath);
const backupStat = statSync(backupPath);
const backupSha256 = await sha256File(backupPath);

writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      service: "muksan-homepage",
      type: "sqlite-backup",
      createdAt: new Date().toISOString(),
      sourcePath,
      backupPath,
      byteSize: backupStat.size,
      sourceByteSize: sourceStat.size,
      sha256: backupSha256
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`SQLite backup created: ${backupPath}`);
console.log(`Manifest created: ${manifestPath}`);
console.log(`Bytes: ${backupStat.size}`);
console.log(`SHA256: ${backupSha256}`);
