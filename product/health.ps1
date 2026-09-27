# Reports the health of all five Hangova services.
$ports = 8080, 8081, 8082, 8083, 8084
$up = 0
$report = @()

foreach ($p in $ports) {
    try {
        $r = Invoke-RestMethod "http://localhost:$p/actuator/health" -TimeoutSec 3
        if ($r.status -eq "UP") {
            $up++
            $report += "  $p UP"
        } else {
            $report += "  $p $($r.status)"
        }
    } catch {
        $report += "  $p DOWN"
    }
}

$report | ForEach-Object { $_ }
"$up of $($ports.Count) healthy"
if ($up -eq $ports.Count) { exit 0 } else { exit 1 }
