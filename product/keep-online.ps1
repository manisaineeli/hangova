<#
  Keeps the public link alive.

  Watches the five backend services and the Cloudflare tunnel, restarting
  whatever has stopped, and records the current public URL so it can be
  shared again after a reboot.

  Run it with:  powershell -ExecutionPolicy Bypass -File keep-online.ps1
  Stop it with: powershell -ExecutionPolicy Bypass -File keep-online.ps1 -Stop
#>
param([switch]$Stop)

$root = $PSScriptRoot
$exe = Join-Path $root 'cloudflared.exe'
$logs = Join-Path $env:TEMP 'opencode\logs'
$urlFile = Join-Path $env:TEMP 'opencode\tunnel-url.txt'
$pidFile = Join-Path $env:TEMP 'opencode\keep-online.pid'

if ($Stop) {
    if (Test-Path $pidFile) {
        $watcher = [int](Get-Content $pidFile -ErrorAction SilentlyContinue)
        Stop-Process -Id $watcher -Force -ErrorAction SilentlyContinue
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        Write-Host "watcher stopped (pid $watcher)"
    }
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "tunnel stopped"
    exit 0
}

if (-not (Test-Path $exe)) {
    Write-Host "cloudflared.exe is missing from $root" -ForegroundColor Red
    exit 1
}
New-Item -ItemType Directory -Path $logs -Force | Out-Null

$me = $PID
Set-Content -LiteralPath $pidFile -Value $me
Write-Host "watcher running as pid $me - Ctrl+C or run with -Stop to end it"

function Test-Health {
    try {
        $r = Invoke-RestMethod 'http://localhost:8080/actuator/health' -TimeoutSec 5
        return $r.status -eq 'UP'
    } catch {
        return $false
    }
}

function Start-TunnelIfDown {
    if (Get-Process cloudflared -ErrorAction SilentlyContinue) { return }
    Write-Host "starting tunnel..."
    Start-Process -FilePath $exe `
        -ArgumentList 'tunnel', '--no-autoupdate', '--url', 'http://localhost:8080' `
        -RedirectStandardOutput "$logs\tunnel.log" `
        -RedirectStandardError "$logs\tunnel.err" `
        -WindowStyle Hidden
}

function Read-TunnelUrl {
    for ($i = 0; $i -lt 30; $i++) {
        $hit = Select-String -Path "$logs\tunnel.err", "$logs\tunnel.log" `
            -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches -ErrorAction SilentlyContinue |
            ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } |
            Select-Object -Unique -First 1
        if ($hit) { return $hit }
        Start-Sleep -Seconds 2
    }
    return $null
}

while ($true) {
    # 1. the app itself
    if (-not (Test-Health)) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss')  app is down, restarting the services"
        Start-Process -FilePath 'cmd.exe' `
            -ArgumentList '/c', "`"$root\start-services.cmd`"" -WindowStyle Hidden
        Start-Sleep -Seconds 45
    }

    # 2. the tunnel
    Start-TunnelIfDown
    Start-Sleep -Seconds 5

    $url = Read-TunnelUrl
    if ($url) {
        Set-Content -LiteralPath $urlFile -Value $url -Encoding ascii
        if ((Get-Content $urlFile -ErrorAction SilentlyContinue) -ne $url) { }
        Write-Host "$(Get-Date -Format 'HH:mm:ss')  public link: $url"
    }

    Start-Sleep -Seconds 60
}
