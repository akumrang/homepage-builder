#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RuntimeRoot = "C:/muksan-homepage/runtime",
  [string]$AppRoot = "C:/muksan-homepage/app",
  [string]$DataDir = "C:/muksan-homepage/data",
  [string]$BackupDir = "C:/muksan-homepage/backups",
  [string]$LogDir = "C:/muksan-homepage/logs",
  [string]$CaddyfilePath = "",
  [string]$ServiceXmlPath = "",
  [string]$ExpectedBackendHost = "127.0.0.1",
  [string]$ExpectedBackendPort = "4200",
  [switch]$AllowTemplatePlaceholders,
  [switch]$SkipPathChecks
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($CaddyfilePath)) {
  $CaddyfilePath = Join-Path $RuntimeRoot "Caddyfile"
}

if ([string]::IsNullOrWhiteSpace($ServiceXmlPath)) {
  $ServiceXmlPath = Join-Path $RuntimeRoot "muksan-homepage-backend.xml"
}

$results = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )

  $script:results.Add([pscustomobject]@{
    Name = $Name
    Ok = $Ok
    Detail = $Detail
  }) | Out-Null
}

function Normalize-PathText {
  param([string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return $Value.Replace("\", "/")
}

function Test-RequiredPath {
  param(
    [string]$Name,
    [string]$Path,
    [string]$Kind
  )

  if ($SkipPathChecks) {
    Add-Check $Name $true "skipped path existence check: $Path"
    return
  }

  $exists = Test-Path -LiteralPath $Path

  if (-not $exists) {
    Add-Check $Name $false "$Kind missing: $Path"
    return
  }

  Add-Check $Name $true "$Kind found: $Path"
}

function Get-ServiceEnvValue {
  param(
    [xml]$Xml,
    [string]$Name
  )

  $node = @($Xml.service.env) | Where-Object { $_.name -eq $Name } | Select-Object -First 1

  if ($null -eq $node) {
    return $null
  }

  return [string]$node.value
}

function Add-TextContainsCheck {
  param(
    [string]$Name,
    [string]$Text,
    [string]$Pattern,
    [string]$Detail
  )

  Add-Check $Name ($Text -like "*$Pattern*") $Detail
}

Write-Host "[runtime:preflight] Muksan homepage Windows runtime check"
Write-Host "[runtime:preflight] RuntimeRoot=$RuntimeRoot"
Write-Host "[runtime:preflight] AppRoot=$AppRoot"
Write-Host "[runtime:preflight] Caddyfile=$CaddyfilePath"
Write-Host "[runtime:preflight] ServiceXml=$ServiceXmlPath"

Test-RequiredPath "runtime-root" $RuntimeRoot "directory"
Test-RequiredPath "app-root" $AppRoot "directory"
Test-RequiredPath "data-dir" $DataDir "directory"
Test-RequiredPath "backup-dir" $BackupDir "directory"
Test-RequiredPath "log-dir" $LogDir "directory"
Test-RequiredPath "caddyfile" $CaddyfilePath "file"
Test-RequiredPath "service-xml" $ServiceXmlPath "file"

$backendEntry = Join-Path $AppRoot "backend/dist/server.js"
$frontendIndex = Join-Path $AppRoot "frontend/dist/index.html"
$frontendAssets = Join-Path $AppRoot "frontend/dist/assets"

Test-RequiredPath "backend-entry" $backendEntry "file"
Test-RequiredPath "frontend-index" $frontendIndex "file"
Test-RequiredPath "frontend-assets" $frontendAssets "directory"

$caddyText = ""
if (Test-Path -LiteralPath $CaddyfilePath) {
  $caddyText = Get-Content -Raw -Encoding UTF8 -LiteralPath $CaddyfilePath
}

$caddyPlaceholders = @("admin@example.com", "homepage.example.com")
$remainingCaddyPlaceholders = @($caddyPlaceholders | Where-Object { $caddyText -like "*$_*" })

if ($AllowTemplatePlaceholders) {
  Add-Check "caddy-placeholders" $true "template placeholders allowed for this run"
} else {
  Add-Check "caddy-placeholders" ($remainingCaddyPlaceholders.Count -eq 0) ("remaining placeholders: " + ($remainingCaddyPlaceholders -join ", "))
}

Add-TextContainsCheck "caddy-api-handle" $caddyText "handle /api/*" "Caddyfile must route /api/* separately"
Add-TextContainsCheck "caddy-api-proxy" $caddyText "reverse_proxy ${ExpectedBackendHost}:${ExpectedBackendPort}" "Caddyfile must proxy API to backend"
Add-TextContainsCheck "caddy-assets-handle" $caddyText "handle /assets/*" "Caddyfile must serve hashed assets separately"
Add-TextContainsCheck "caddy-spa-fallback" $caddyText "try_files {path} /index.html" "Caddyfile must use SPA fallback"
Add-TextContainsCheck "caddy-log-dir" (Normalize-PathText $caddyText) (Normalize-PathText $LogDir) "Caddy logs must stay under log directory"
Add-TextContainsCheck "caddy-frontend-dist" (Normalize-PathText $caddyText) (Normalize-PathText (Join-Path $AppRoot "frontend/dist")) "Caddy must serve frontend/dist"

$serviceXml = $null
try {
  if (Test-Path -LiteralPath $ServiceXmlPath) {
    $serviceXml = [xml](Get-Content -Raw -Encoding UTF8 -LiteralPath $ServiceXmlPath)
    Add-Check "service-xml-parse" $true "service XML parsed"
  } else {
    Add-Check "service-xml-parse" $false "service XML not found"
  }
} catch {
  Add-Check "service-xml-parse" $false $_.Exception.Message
}

if ($null -ne $serviceXml) {
  Add-Check "service-id" ([string]$serviceXml.service.id -eq "muksan-homepage-backend") "service id must be muksan-homepage-backend"

  $serviceExecutable = [string]$serviceXml.service.executable
  $serviceArguments = [string]$serviceXml.service.arguments
  $serviceWorkingDirectory = [string]$serviceXml.service.workingdirectory
  $serviceLogPath = [string]$serviceXml.service.logpath

  Test-RequiredPath "service-node-executable" $serviceExecutable "file"
  Add-Check "service-arguments" ((Normalize-PathText $serviceArguments) -eq (Normalize-PathText $backendEntry)) "service arguments should point to backend dist entry"
  Add-Check "service-working-directory" ((Normalize-PathText $serviceWorkingDirectory) -eq (Normalize-PathText $AppRoot)) "service working directory should match app root"
  Add-Check "service-log-path" ((Normalize-PathText $serviceLogPath) -eq (Normalize-PathText $LogDir)) "service log path should match log dir"

  $nodeEnv = Get-ServiceEnvValue $serviceXml "NODE_ENV"
  $databaseUrl = Get-ServiceEnvValue $serviceXml "DATABASE_URL"
  $backupEnv = Get-ServiceEnvValue $serviceXml "HOMEPAGE_DB_BACKUP_DIR"
  $internalToken = Get-ServiceEnvValue $serviceXml "HOMEPAGE_INTERNAL_ACCESS_TOKEN"
  $hostEnv = Get-ServiceEnvValue $serviceXml "HOST"
  $portEnv = Get-ServiceEnvValue $serviceXml "PORT"

  Add-Check "env-node-env" ($nodeEnv -eq "production") "NODE_ENV must be production"
  Add-Check "env-database-url" ((Normalize-PathText $databaseUrl) -eq ("file:" + (Normalize-PathText (Join-Path $DataDir "homepage-prod.db")))) "DATABASE_URL must point to data dir"
  Add-Check "env-backup-dir" ((Normalize-PathText $backupEnv) -eq (Normalize-PathText $BackupDir)) "backup dir env must match backup dir"
  Add-Check "env-host" ($hostEnv -eq $ExpectedBackendHost) "HOST must bind backend to expected host"
  Add-Check "env-port" ($portEnv -eq $ExpectedBackendPort) "PORT must match expected backend port"

  $placeholderToken = "REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS"
  if ($AllowTemplatePlaceholders -and $internalToken -eq $placeholderToken) {
    Add-Check "env-internal-token" $true "template token placeholder allowed for this run"
  } else {
    $tokenOk = -not [string]::IsNullOrWhiteSpace($internalToken) -and $internalToken -ne $placeholderToken -and $internalToken.Trim().Length -ge 32
    Add-Check "env-internal-token" $tokenOk "internal token must be replaced with 32+ characters"
  }
}

$failed = @($results | Where-Object { -not $_.Ok })

foreach ($result in $results) {
  $prefix = if ($result.Ok) { "OK" } else { "FAIL" }
  Write-Host ("[{0}] {1}: {2}" -f $prefix, $result.Name, $result.Detail)
}

if ($failed.Count -gt 0) {
  Write-Error ("Windows runtime preflight failed with {0} issue(s)." -f $failed.Count)
  exit 1
}

Write-Host "[runtime:preflight] passed"
