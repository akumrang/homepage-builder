import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const internalAccessToken = "visual-regression-local-token-20260628";
const internalAccessStorageKey = "muksan-homepage-internal-access-token";

function formatUtcTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function toFileUrlPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function resolveArtifactDirectory() {
  const configuredDirectory = process.env.HOMEPAGE_VISUAL_REGRESSION_DIR?.trim();

  if (configuredDirectory) {
    return path.resolve(configuredDirectory);
  }

  return path.resolve(workspaceRoot, ".tmp", "visual-regression", formatUtcTimestamp());
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
          reject(new Error("Failed to allocate a local visual regression port."));
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
    console.log(`\n[visual] ${label}`);
    console.log(`[visual] $ ${command} ${args.join(" ")}`);

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
  console.log("\n[visual] Start backend from production build");
  const backendEntry = path.resolve(workspaceRoot, "backend", "dist", "server.js");
  console.log(`[visual] $ node ${path.relative(workspaceRoot, backendEntry)}`);

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
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function startFrontendDistServer({ backendBaseUrl, distDirectory, port }) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? `127.0.0.1:${port}`}`);

      if (requestUrl.pathname.startsWith("/api/")) {
        const proxyHeaders = {
          Accept: req.headers.accept ?? "application/json"
        };

        if (req.headers.authorization) {
          proxyHeaders.Authorization = req.headers.authorization;
        }

        const proxiedResponse = await fetch(`${backendBaseUrl}${requestUrl.pathname}${requestUrl.search}`, {
          headers: proxyHeaders,
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
      await delay(500);
    }
  }

  throw lastError ?? new Error(`${label} did not become ready within ${timeoutMs}ms.`);
}

async function expectVisibleText(page, text, label) {
  await page.getByText(text).first().waitFor({ state: "visible", timeout: 10000 }).catch((error) => {
    throw new Error(`${label} did not show expected text "${text}": ${error.message}`);
  });
}

async function createPage(browser, viewport, internalToken = null) {
  const context = await browser.newContext({ viewport });

  if (internalToken) {
    await context.addInitScript(
      ([storageKey, token]) => {
        window.sessionStorage.setItem(storageKey, token);
      },
      [internalAccessStorageKey, internalToken]
    );
  }

  const page = await context.newPage();
  return { context, page };
}

async function capturePage({ browser, frontendBaseUrl, screenshotDirectory, name, pathName, viewport, expectedTexts, internalToken }) {
  const screenshotPath = path.join(screenshotDirectory, `${name}.png`);
  const failureScreenshotPath = path.join(screenshotDirectory, `${name}-failure.png`);
  const { context, page } = await createPage(browser, viewport, internalToken);

  try {
    await page.goto(`${frontendBaseUrl}${pathName}`, { waitUntil: "networkidle" });

    if (internalToken) {
      const accessInput = page.locator("#internal-access-token");

      if ((await accessInput.count()) > 0) {
        await accessInput.fill(internalToken);
        await page.getByRole("button", { name: "내부 화면 열기" }).click();
        await page.waitForLoadState("networkidle").catch(() => {});
      }
    }

    for (const expectedText of expectedTexts) {
      await expectVisibleText(page, expectedText, name);
    }

    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    await page.screenshot({ path: failureScreenshotPath, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }

  console.log(`[visual] Captured ${name}: ${screenshotPath}`);
  return screenshotPath;
}

async function main() {
  const artifactDirectory = resolveArtifactDirectory();
  const screenshotDirectory = path.join(artifactDirectory, "screenshots");
  const databasePath = path.join(artifactDirectory, "homepage-visual-regression.db");
  const backupDirectory = path.join(artifactDirectory, "backups");
  const backendPort = Number(process.env.HOMEPAGE_VISUAL_BACKEND_PORT || (await getFreePort()));
  const frontendPort = Number(process.env.HOMEPAGE_VISUAL_FRONTEND_PORT || (await getFreePort()));

  mkdirSync(screenshotDirectory, { recursive: true });
  mkdirSync(backupDirectory, { recursive: true });

  const visualEnv = {
    ...process.env,
    NODE_ENV: "production",
    DATABASE_URL: `file:${toFileUrlPath(databasePath)}`,
    HOMEPAGE_DB_BACKUP_DIR: backupDirectory,
    HOMEPAGE_INTERNAL_ACCESS_TOKEN: internalAccessToken,
    HOMEPAGE_CORS_ORIGINS: `http://127.0.0.1:${frontendPort}`,
    HOST: "127.0.0.1",
    PORT: String(backendPort),
    VITE_API_BASE_URL: ""
  };

  console.log("[visual] Screenshot regression capture");
  console.log(`[visual] Artifacts: ${artifactDirectory}`);
  console.log(`[visual] Database: ${databasePath}`);
  console.log(`[visual] Backend port: ${backendPort}`);
  console.log(`[visual] Frontend dist port: ${frontendPort}`);

  await run(npmCommand, ["run", "db:deploy"], visualEnv, "Prepare visual regression DB");
  await run(npmCommand, ["run", "build"], visualEnv, "Build shared, backend, and frontend");

  const backend = startBackend(visualEnv);
  let frontendServer = null;
  let browser = null;

  try {
    const backendBaseUrl = `http://127.0.0.1:${backendPort}`;
    const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;
    const readiness = await waitForJson(`${backendBaseUrl}/api/ready`, "readiness check");

    if (!readiness?.ok) {
      throw new Error(`Readiness check did not return ok: true: ${JSON.stringify(readiness)}`);
    }

    frontendServer = await startFrontendDistServer({
      backendBaseUrl,
      distDirectory: path.resolve(workspaceRoot, "frontend", "dist"),
      port: frontendPort
    });
    console.log(`[visual] Frontend dist server is running on ${frontendBaseUrl}`);

    browser = await chromium.launch({ headless: true });

    const screenshots = {
      publicDesktop: await capturePage({
        browser,
        frontendBaseUrl,
        screenshotDirectory,
        name: "public-desktop-full",
        pathName: "/h/sample-korean-academy",
        viewport: { width: 1440, height: 1200 },
        expectedTexts: ["샘플 한빛국어학원", "상담 문의"]
      }),
      publicMobile: await capturePage({
        browser,
        frontendBaseUrl,
        screenshotDirectory,
        name: "public-mobile-full",
        pathName: "/h/sample-korean-academy",
        viewport: { width: 390, height: 844 },
        expectedTexts: ["샘플 한빛국어학원", "상담 문의"]
      }),
      internalAccessMobile: await capturePage({
        browser,
        frontendBaseUrl,
        screenshotDirectory,
        name: "internal-access-mobile",
        pathName: "/internal",
        viewport: { width: 390, height: 844 },
        expectedTexts: ["내부 접근 키 입력", "내부 화면 열기"]
      }),
      internalStatusDesktop: await capturePage({
        browser,
        frontendBaseUrl,
        screenshotDirectory,
        name: "internal-status-desktop",
        pathName: "/internal",
        viewport: { width: 1440, height: 1200 },
        expectedTexts: ["홈페이지 내부 제작 화면", "샘플 학원 목록", "샘플 한빛국어학원"],
        internalToken: internalAccessToken
      }),
      internalStatusMobile: await capturePage({
        browser,
        frontendBaseUrl,
        screenshotDirectory,
        name: "internal-status-mobile",
        pathName: "/internal",
        viewport: { width: 390, height: 844 },
        expectedTexts: ["홈페이지 내부 제작 화면", "샘플 학원 목록", "샘플 한빛국어학원"],
        internalToken: internalAccessToken
      })
    };

    const manifestPath = path.join(artifactDirectory, "visual-regression-manifest.json");
    writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          service: "muksan-homepage",
          type: "visual-regression-screenshots",
          createdAt: new Date().toISOString(),
          frontendBaseUrl,
          backendBaseUrl,
          screenshots
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    console.log(`[visual] Manifest: ${manifestPath}`);
  } finally {
    if (browser) {
      await browser.close();
    }

    if (frontendServer) {
      await stopServer(frontendServer);
      await waitForPortClosed(frontendPort, "frontend dist server");
    }

    await stopBackend(backend);
    await waitForPortClosed(backendPort, "backend");
  }

  console.log("\n[visual] Screenshot regression capture passed.");
  console.log(`[visual] Artifacts remain in: ${artifactDirectory}`);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error("\n[visual] Screenshot regression capture failed.");
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
