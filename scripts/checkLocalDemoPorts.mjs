import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");
const frontendPort = Number.parseInt(process.env.HOMEPAGE_DEMO_FRONTEND_PORT ?? "5175", 10);
const backendPort = Number.parseInt(process.env.HOMEPAGE_DEMO_BACKEND_PORT ?? "4200", 10);

function normalizePath(value) {
  return value.replace(/\\/g, "/").toLowerCase();
}

function parsePort(value, label) {
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`${label} must be a valid TCP port. Received: ${value}`);
  }

  return value;
}

function readListeningPorts(ports) {
  if (process.platform !== "win32") {
    throw new Error("demo:ports currently supports Windows local rehearsal environments only.");
  }

  const portList = ports.join(",");
  const script = `
$ErrorActionPreference = "SilentlyContinue"
$ports = @(${portList})
$items = @()
foreach ($connection in Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue) {
  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
  $items += [PSCustomObject]@{
    port = [int]$connection.LocalPort
    address = [string]$connection.LocalAddress
    pid = [int]$connection.OwningProcess
    commandLine = [string]$processInfo.CommandLine
    executablePath = [string]$processInfo.ExecutablePath
  }
}
$items | ConvertTo-Json -Depth 4
`;

  const output = execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();

  if (!output) {
    return [];
  }

  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function classifyPort({ label, port, items, normalizedWorkspaceRoot }) {
  const matchingItems = items.filter((item) => Number(item.port) === port);

  if (matchingItems.length === 0) {
    return {
      label,
      port,
      status: "PASS",
      message: `${label} port ${port} is free.`
    };
  }

  const ownedByThisWorkspace = matchingItems.every((item) => {
    const commandLine = normalizePath(item.commandLine ?? "");
    const executablePath = normalizePath(item.executablePath ?? "");
    return commandLine.includes(normalizedWorkspaceRoot) || executablePath.includes(normalizedWorkspaceRoot);
  });

  if (ownedByThisWorkspace) {
    return {
      label,
      port,
      status: "PASS",
      message: `${label} port ${port} is already used by this homepage workspace.`,
      items: matchingItems
    };
  }

  return {
    label,
    port,
    status: "HOLD",
    message: `${label} port ${port} is used by another process. Do not use the documented local demo URL until this is resolved.`,
    items: matchingItems
  };
}

function printResult(result) {
  console.log(`[demo:ports] ${result.status} ${result.message}`);

  for (const item of result.items ?? []) {
    console.log(`[demo:ports]   pid=${item.pid} address=${item.address} port=${item.port}`);
    console.log(`[demo:ports]   command=${item.commandLine || "(empty)"}`);
  }
}

function main() {
  const checkedFrontendPort = parsePort(frontendPort, "HOMEPAGE_DEMO_FRONTEND_PORT");
  const checkedBackendPort = parsePort(backendPort, "HOMEPAGE_DEMO_BACKEND_PORT");
  const normalizedWorkspaceRoot = normalizePath(workspaceRoot);
  const items = readListeningPorts([checkedFrontendPort, checkedBackendPort]);

  const results = [
    classifyPort({
      label: "frontend",
      port: checkedFrontendPort,
      items,
      normalizedWorkspaceRoot
    }),
    classifyPort({
      label: "backend",
      port: checkedBackendPort,
      items,
      normalizedWorkspaceRoot
    })
  ];

  console.log(`[demo:ports] workspace=${workspaceRoot}`);
  for (const result of results) {
    printResult(result);
  }

  const hasHold = results.some((result) => result.status === "HOLD");

  if (hasHold) {
    console.log("[demo:ports] HOLD local demo precheck failed.");
    console.log("[demo:ports] If Vite uses an alternate frontend port, restart backend with HOMEPAGE_CORS_ORIGINS for that port.");
    console.log("[demo:ports] Example: $env:HOMEPAGE_CORS_ORIGINS=\"http://127.0.0.1:5176,http://localhost:5176\"");
    process.exitCode = 1;
    return;
  }

  console.log("[demo:ports] PASS local demo ports are safe to use for this workspace.");
}

main();
