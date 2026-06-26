import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function formatUtcTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function toFileUrlPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function resolveRehearsalDirectory() {
  const configuredDirectory = process.env.HOMEPAGE_REHEARSAL_DIR?.trim();

  if (configuredDirectory) {
    return path.resolve(configuredDirectory);
  }

  return path.resolve(workspaceRoot, ".tmp", "local-production-rehearsal", formatUtcTimestamp());
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        if (!port) {
          reject(new Error("Failed to allocate a local rehearsal port."));
          return;
        }

        resolve(port);
      });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canConnectToPort(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    function settle(isOpen) {
      socket.removeAllListeners();
      socket.destroy();
      resolve(isOpen);
    }

    socket.setTimeout(500);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

async function waitForPortClosed(port, label, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!(await canConnectToPort(port))) {
      return;
    }

    await delay(100);
  }

  throw new Error(`${label} port ${port} remained open after shutdown.`);
}

function quoteCommandArg(arg) {
  if (arg === "") {
    return '""';
  }

  if (!/[ \t"&|<>^]/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, "$1$1")}"`;
}

function spawnCommand(command, args, options) {
  if (process.platform !== "win32") {
    return spawn(command, args, options);
  }

  const commandLine = [command, ...args].map(quoteCommandArg).join(" ");
  return spawn("cmd.exe", ["/d", "/s", "/c", commandLine], options);
}

function run(command, args, env, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n[rehearsal] ${label}`);
    console.log(`[rehearsal] $ ${command} ${args.join(" ")}`);

    const child = spawnCommand(command, args, {
      cwd: workspaceRoot,
      env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
    });
  });
}

function startBackend(env) {
  console.log("\n[rehearsal] Start backend from production build");
  const backendEntry = path.resolve(workspaceRoot, "backend", "dist", "server.js");
  console.log(`[rehearsal] $ node ${path.relative(workspaceRoot, backendEntry)}`);

  const child = spawn(process.execPath, [backendEntry], {
    cwd: workspaceRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[backend] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[backend] ${chunk}`));

  return child;
}

function getContentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function startFrontendDistServer({ backendBaseUrl, distDirectory, port }) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `127.0.0.1:${port}`}`);

      if (requestUrl.pathname.startsWith("/api/")) {
        const proxiedResponse = await fetch(`${backendBaseUrl}${requestUrl.pathname}${requestUrl.search}`, {
          headers: {
            Accept: req.headers.accept ?? "application/json"
          },
          method: req.method
        });
        const body = Buffer.from(await proxiedResponse.arrayBuffer());

        res.statusCode = proxiedResponse.status;
        res.setHeader("content-type", proxiedResponse.headers.get("content-type") ?? "application/json; charset=utf-8");
        res.end(body);
        return;
      }

      const normalizedPath = decodeURIComponent(requestUrl.pathname);
      const assetPath = normalizedPath.startsWith("/assets/")
        ? path.resolve(distDirectory, `.${normalizedPath}`)
        : path.resolve(distDirectory, "index.html");

      if (!assetPath.startsWith(distDirectory) || !existsSync(assetPath)) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      res.statusCode = 200;
      res.setHeader("content-type", getContentType(assetPath));
      res.end(readFileSync(assetPath));
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ message: error instanceof Error ? error.message : "Frontend dist server failed." }));
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function waitForChildExit(child, timeoutMs = 5000) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });
}

async function stopBackend(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    child.kill();

    if (!(await waitForChildExit(child, 3000))) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      });
    }
  } else {
    child.kill("SIGTERM");
  }

  if (!(await waitForChildExit(child))) {
    throw new Error(`Backend process ${child.pid ?? ""} did not exit after shutdown signal.`);
  }

}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestJson(url, label) {
  const response = await fetch(url);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${text}`);
  }

  return data;
}

async function waitForJson(url, label, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await requestJson(url, label);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error(`${label} did not become ready within ${timeoutMs}ms.`);
}

function assertFrontendDist() {
  const indexPath = path.resolve(workspaceRoot, "frontend", "dist", "index.html");
  const assetsDirectory = path.resolve(workspaceRoot, "frontend", "dist", "assets");

  if (!existsSync(indexPath)) {
    throw new Error("frontend/dist/index.html was not created.");
  }

  if (!existsSync(assetsDirectory)) {
    throw new Error("frontend/dist/assets was not created.");
  }

  const assetFiles = readdirSync(assetsDirectory);
  const jsFiles = assetFiles.filter((fileName) => fileName.endsWith(".js"));

  if (jsFiles.length === 0) {
    throw new Error("frontend/dist/assets does not contain a JavaScript bundle.");
  }

  for (const jsFile of jsFiles) {
    const bundle = readFileSync(path.join(assetsDirectory, jsFile), "utf8");

    if (bundle.includes("http://localhost:4200")) {
      throw new Error("Production frontend bundle still contains the local development API base URL.");
    }
  }

  return {
    indexPath,
    assetCount: assetFiles.length,
    jsBundleCount: jsFiles.length
  };
}

function assertBackupCreated(backupDirectory) {
  const backupFiles = readdirSync(backupDirectory).filter((fileName) => fileName.endsWith(".db"));
  const manifestFiles = readdirSync(backupDirectory).filter((fileName) => fileName.endsWith(".manifest.json"));

  if (backupFiles.length === 0) {
    throw new Error("No SQLite backup file was created during rehearsal.");
  }

  if (manifestFiles.length === 0) {
    throw new Error("No SQLite backup manifest was created during rehearsal.");
  }

  for (const backupFile of backupFiles) {
    const backupPath = path.join(backupDirectory, backupFile);

    if (statSync(backupPath).size <= 0) {
      throw new Error(`Backup file is empty: ${backupPath}`);
    }
  }

  return { backupFiles, manifestFiles };
}

async function main() {
  const rehearsalDirectory = resolveRehearsalDirectory();
  const databasePath = path.join(rehearsalDirectory, "homepage-rehearsal.db");
  const backupDirectory = path.join(rehearsalDirectory, "backups");
  const backendPort = Number(process.env.HOMEPAGE_REHEARSAL_BACKEND_PORT || (await getFreePort()));
  const frontendPort = Number(process.env.HOMEPAGE_REHEARSAL_FRONTEND_PORT || (await getFreePort()));

  mkdirSync(backupDirectory, { recursive: true });

  const rehearsalEnv = {
    ...process.env,
    NODE_ENV: "production",
    DATABASE_URL: `file:${toFileUrlPath(databasePath)}`,
    HOMEPAGE_DB_BACKUP_DIR: backupDirectory,
    HOMEPAGE_INTERNAL_ACCESS_TOKEN: "local-production-rehearsal-token",
    HOMEPAGE_CORS_ORIGINS: `http://127.0.0.1:${frontendPort}`,
    HOST: "127.0.0.1",
    PORT: String(backendPort),
    VITE_API_BASE_URL: ""
  };

  console.log("[rehearsal] Local production rehearsal");
  console.log(`[rehearsal] Directory: ${rehearsalDirectory}`);
  console.log(`[rehearsal] Database: ${databasePath}`);
  console.log(`[rehearsal] Backup directory: ${backupDirectory}`);
  console.log(`[rehearsal] Backend port: ${backendPort}`);
  console.log(`[rehearsal] Frontend dist port: ${frontendPort}`);

  await run(npmCommand, ["run", "db:deploy"], rehearsalEnv, "Prepare baseline rehearsal DB");
  await run(npmCommand, ["run", "build"], rehearsalEnv, "Build shared, backend, and frontend");

  const frontendDist = assertFrontendDist();
  console.log(
    `[rehearsal] Frontend dist ok: ${frontendDist.indexPath}, assets=${frontendDist.assetCount}, js=${frontendDist.jsBundleCount}`
  );

  await run(
    npmCommand,
    ["run", "db:backup", "--", "--label", "homepage-rehearsal", "--out-dir", backupDirectory],
    rehearsalEnv,
    "Back up rehearsal DB"
  );

  const backups = assertBackupCreated(backupDirectory);
  console.log(
    `[rehearsal] Backup files ok: db=${backups.backupFiles.length}, manifests=${backups.manifestFiles.length}`
  );

  await run(npmCommand, ["run", "db:deploy"], rehearsalEnv, "Apply migrations to rehearsal DB");

  const backend = startBackend(rehearsalEnv);
  let frontendServer = null;

  try {
    const backendBaseUrl = `http://127.0.0.1:${backendPort}`;
    const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;
    const health = await waitForJson(`${backendBaseUrl}/api/health`, "health check");

    if (!health?.ok) {
      throw new Error("Health check did not return ok: true.");
    }

    const readiness = await waitForJson(`${backendBaseUrl}/api/ready`, "readiness check");

    if (!readiness?.ok) {
      throw new Error(`Readiness check did not return ok: true: ${JSON.stringify(readiness)}`);
    }

    await requestJson(`${backendBaseUrl}/api/academies/sample-korean-academy`, "public academy check");

    console.log("[rehearsal] Backend health, readiness, and public academy API checks passed.");

    frontendServer = await startFrontendDistServer({
      backendBaseUrl,
      distDirectory: path.resolve(workspaceRoot, "frontend", "dist"),
      port: frontendPort
    });
    console.log(`[rehearsal] Frontend dist server is running on ${frontendBaseUrl}`);

    const publicPage = await fetch(`${frontendBaseUrl}/h/sample-korean-academy`);
    const publicPageHtml = await publicPage.text();

    if (!publicPage.ok || !publicPageHtml.includes('id="root"')) {
      throw new Error("Frontend public route did not serve the SPA index.");
    }

    const proxiedReady = await requestJson(`${frontendBaseUrl}/api/ready`, "same-origin proxied readiness check");

    if (!proxiedReady?.ok) {
      throw new Error(`Same-origin proxied readiness check failed: ${JSON.stringify(proxiedReady)}`);
    }

    console.log("[rehearsal] Frontend dist route and same-origin /api proxy checks passed.");
  } finally {
    if (frontendServer) {
      await stopServer(frontendServer);
      await waitForPortClosed(frontendPort, "frontend dist server");
    }

    await stopBackend(backend);
    await waitForPortClosed(backendPort, "backend");
  }

  console.log("\n[rehearsal] Local production rehearsal passed.");
  console.log(`[rehearsal] Artifacts remain in: ${rehearsalDirectory}`);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error("\n[rehearsal] Local production rehearsal failed.");
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
