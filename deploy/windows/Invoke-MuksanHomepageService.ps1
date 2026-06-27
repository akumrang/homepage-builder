#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("install", "uninstall", "start", "stop", "restart", "status")]
  [string]$Action,

  [string]$RuntimeRoot = "C:/muksan-homepage/runtime",
  [string]$ServiceExePath = "",
  [string]$ServiceXmlPath = "",
  [string]$ServiceName = "muksan-homepage-backend",
  [string]$HealthUrl = "http://127.0.0.1:4200/api/health",
  [string]$ReadyUrl = "http://127.0.0.1:4200/api/ready",
  [int]$TimeoutSeconds = 30,
  [switch]$SkipHealthCheck,
  [switch]$SkipReadyCheck,
  [switch]$SkipPathChecks,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ServiceExePath)) {
  $ServiceExePath = Join-Path $RuntimeRoot "muksan-homepage-backend.exe"
}

if ([string]::IsNullOrWhiteSpace($ServiceXmlPath)) {
  $ServiceXmlPath = Join-Path $RuntimeRoot "muksan-homepage-backend.xml"
}

function Write-Step {
  param([string]$Message)
  Write-Host "[service] $Message"
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

function Invoke-ServiceWrapper {
  param([string]$WrapperAction)

  $commandText = "`"$ServiceExePath`" $WrapperAction"
  Write-Step $commandText

  if ($DryRun) {
    return
  }

  if ($PSCmdlet.ShouldProcess($ServiceName, $WrapperAction)) {
    & $ServiceExePath $WrapperAction
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
      throw "Service wrapper action failed with exit code ${exitCode}: $WrapperAction"
    }
  }
}

function Get-ServiceStateText {
  try {
    $service = Get-Service -Name $ServiceName -ErrorAction Stop
    return $service.Status.ToString()
  } catch {
    return "NotFound"
  }
}

function Wait-ServiceState {
  param(
    [string[]]$ExpectedStates,
    [string]$Label
  )

  if ($DryRun) {
    Write-Step "dry run: skip waiting for $Label"
    return
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $state = Get-ServiceStateText

    if ($ExpectedStates -contains $state) {
      Write-Step "$Label confirmed: $state"
      return
    }

    Start-Sleep -Seconds 1
  }

  throw "Timed out waiting for ${Label}. Last state: $(Get-ServiceStateText)"
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

function Test-PortClosed {
  param(
    [string]$HostName,
    [int]$Port
  )

  if ($DryRun) {
    Write-Step "dry run: skip port close check ${HostName}:${Port}"
    return
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    $socket = New-Object System.Net.Sockets.TcpClient

    try {
      $async = $socket.BeginConnect($HostName, $Port, $null, $null)
      $connected = $async.AsyncWaitHandle.WaitOne(500, $false)

      if (-not $connected) {
        Write-Step "port close confirmed: ${HostName}:${Port}"
        return
      }

      $socket.EndConnect($async)
    } catch {
      Write-Step "port close confirmed: ${HostName}:${Port}"
      return
    } finally {
      $socket.Close()
    }

    Start-Sleep -Seconds 1
  }

  throw "Port remained open after stop: ${HostName}:${Port}"
}

function Get-ReadyEndpoint {
  $uri = [Uri]$ReadyUrl
  return @{
    Host = $uri.Host
    Port = $uri.Port
  }
}

Write-Step "Action=$Action"
Write-Step "RuntimeRoot=$RuntimeRoot"
Write-Step "ServiceExePath=$ServiceExePath"
Write-Step "ServiceXmlPath=$ServiceXmlPath"

if ($Action -ne "status") {
  Assert-PathExists $ServiceExePath "service wrapper executable"
  Assert-PathExists $ServiceXmlPath "service XML"
}

switch ($Action) {
  "install" {
    Invoke-ServiceWrapper "install"
    Wait-ServiceState @("Stopped", "Running", "Paused") "service registration"
  }
  "uninstall" {
    Invoke-ServiceWrapper "uninstall"
    Wait-ServiceState @("NotFound") "service removal"
  }
  "start" {
    Invoke-ServiceWrapper "start"
    Wait-ServiceState @("Running") "service start"

    if (-not $SkipHealthCheck) {
      Wait-HttpOk $HealthUrl "health"
    }

    if (-not $SkipReadyCheck) {
      Wait-HttpOk $ReadyUrl "readiness"
    }
  }
  "stop" {
    Invoke-ServiceWrapper "stop"
    Wait-ServiceState @("Stopped") "service stop"

    $endpoint = Get-ReadyEndpoint
    Test-PortClosed $endpoint.Host $endpoint.Port
  }
  "restart" {
    Invoke-ServiceWrapper "restart"
    Wait-ServiceState @("Running") "service restart"

    if (-not $SkipHealthCheck) {
      Wait-HttpOk $HealthUrl "health"
    }

    if (-not $SkipReadyCheck) {
      Wait-HttpOk $ReadyUrl "readiness"
    }
  }
  "status" {
    $state = Get-ServiceStateText
    Write-Step "Windows service status: $state"

    if (-not $DryRun -and (Test-Path -LiteralPath $ServiceExePath)) {
      Invoke-ServiceWrapper "status"
    } elseif (-not (Test-Path -LiteralPath $ServiceExePath)) {
      Write-Step "service wrapper executable not found: $ServiceExePath"
    }
  }
}

Write-Step "done"
