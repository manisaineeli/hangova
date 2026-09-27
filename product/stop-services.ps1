# Stops any Hangova service holding one of the backend ports.
$ports = 8080, 8081, 8082, 8083, 8084
$stopped = @()

foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            $stopped += "port {0} (pid {1}, {2})" -f $p, $proc.Id, $proc.ProcessName
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

$remaining = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in $ports }

if ($stopped) {
    "stopped: " + ($stopped -join ', ')
} else {
    "nothing was running"
}

if ($remaining) {
    "WARNING still listening: " + (($remaining | ForEach-Object { $_.LocalPort }) -join ',')
    exit 1
}
"all backend ports free"
