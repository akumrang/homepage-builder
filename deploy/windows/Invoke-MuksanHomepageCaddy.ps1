#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("version", "validate", "fmt", "run", "reload")]
  [string]$Action,

  [string]$RuntimeRoot = "C:/muksan-homepage/runtime",
  [string]$CaddyExePath = "caddy",
  [string]$CaddyfilePath = "",
  [string]$HealthUrl = "https://homepage.example.com/api/health",
  [string]$ReadyUrl = "https://homepage.example.com/api/ready",
  [int]$TimeoutSeconds = 30,
  [switch]$SkipHealthCheck,
  [switch]$SkipReadyCheck,
  [switch]$SkipPathChecks,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($CaddyfilePath)) {
  $CaddyfilePath = Join-Path $RuntimeRoot "Caddyfile"
}

function Write-Step {
  param([string]$Message)
  Write-Host "[caddy] $Message"
}

function Assert-PathExists {
  param(
    [string]$Path,
    [string]$Description
  )

  if ($SkipPathChecks) {
    Write-Step "skip path check: $Description $Path"
    return
  }

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Description not found: $Path"
  }
}

function Assert-CaddyAvailable {
  if ($SkipPathChecks) {
    Write-Step "skip caddy executable check: $CaddyExePath"
    return
  }

  if (Test-Path -LiteralPath $CaddyExePath) {
    return
  }

  $command = Get-Command $CaddyExePath -ErrorAction SilentlyContinue

  if ($null -eq $command) {
    throw "Caddy executable not found: $CaddyExePath"
  }
}

function Invoke-Caddy {
  param([string[]]$Arguments)

  $commandText = "$CaddyExePath $($Arguments -join ' ')"
  Write-Step $commandText

  if ($DryRun) {
    return
  }

  if ($PSCmdlet.ShouldProcess("Caddy", ($Arguments -join " "))) {
    & $CaddyExePath @Arguments
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
      throw "Caddy command failed with exit code ${exitCode}: $($Arguments -join ' ')"
    }
  }
}

function Wait-HttpOk {
  param(
    [string]$Url,
    [string]$Label
  )

  if ($DryRun) {
    Write-Step "dry run: skip HTTP check $Label $Url"
    return
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $lastError = $null

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5

      if ($response.ok -eq $true) {
        Write-Step "$Label confirmed: ok=true"
        return
      }

      $lastError = "response did not include ok=true"
    } catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Seconds 1
  }

  throw "Timed out waiting for $Label at $Url. Last error: $lastError"
}

Write-Step "Action=$Action"
Write-Step "RuntimeRoot=$RuntimeRoot"
Write-Step "CaddyExePath=$CaddyExePath"
Write-Step "CaddyfilePath=$CaddyfilePath"

Assert-CaddyAvailable

if ($Action -ne "version") {
  Assert-PathExists $CaddyfilePath "Caddyfile"
}

switch ($Action) {
  "version" {
    Invoke-Caddy @("version")
  }
  "validate" {
    Invoke-Caddy @("validate", "--config", $CaddyfilePath)
  }
  "fmt" {
    Invoke-Caddy @("fmt", "--overwrite", $CaddyfilePath)
    Invoke-Caddy @("validate", "--config", $CaddyfilePath)
  }
  "run" {
    Invoke-Caddy @("run", "--config", $CaddyfilePath)
  }
  "reload" {
    Invoke-Caddy @("reload", "--config", $CaddyfilePath)

    if (-not $SkipHealthCheck) {
      Wait-HttpOk $HealthUrl "health"
    }

    if (-not $SkipReadyCheck) {
      Wait-HttpOk $ReadyUrl "readiness"
    }
  }
}

Write-Step "done"
