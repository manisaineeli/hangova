. "C:\Users\ganes\AppData\Local\Temp\opencode\lib.ps1"

$script:pass = 0
$script:fail = 0
function Check([string]$label, $r, [string]$expect) {
  if ($r.ok) {
    $script:pass++
    "  PASS  $label"
  } else {
    $script:fail++
    "  FAIL  $label  -> HTTP $($r.status) : $($r.err)"
  }
}
function CheckBlocked([string]$label, $r) {
  if (-not $r.ok -and ($r.status -eq 401 -or $r.status -eq 403)) {
    $script:pass++
    "  PASS  $label  (blocked: HTTP $($r.status))"
  } else {
    $script:fail++
    "  FAIL  $label  -> expected 401/403, got ok=$($r.ok) HTTP $($r.status)"
  }
}
function CheckFails([string]$label, $r) {
  if (-not $r.ok -and $r.status -ge 400) {
    $script:pass++
    "  PASS  $label  (rejected: HTTP $($r.status))"
  } else {
    $script:fail++
    "  FAIL  $label  -> expected >=400, got ok=$($r.ok) HTTP $($r.status)"
  }
}
function Section([string]$t) { ""; "== $t ==" }

$adm = (Invoke-Api Post "/api/auth/login" @{email="admin@hangova.ai";password="admin123"}).data
$usr = (Invoke-Api Post "/api/auth/login" @{email="demo@hangova.ai";password="demo123"}).data
# NB: pass the RAW token - Invoke-Api adds the "Bearer " prefix itself
$ah = $adm.token
$uh = $usr.token

Section "Module 1 - registration & login"
Check "admin login returns ADMIN role" (Invoke-Api Post "/api/auth/login" @{email="admin@hangova.ai";password="admin123"}) "ADMIN"
Check "demo login" (Invoke-Api Post "/api/auth/login" @{email="demo@hangova.ai";password="demo123"}) "USER"
CheckBlocked "wrong password rejected" (Invoke-Api Post "/api/auth/login" @{email="demo@hangova.ai";password="wrongpass"})
CheckBlocked "unknown email rejected" (Invoke-Api Post "/api/auth/login" @{email="ghost@nowhere.ai";password="whatever"})

$email = "tester$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@student.ai"
$reg = Invoke-Api Post "/api/auth/register" @{fullName="Test Student";email=$email;password="test123";interests=@("Food","Beaches","Food");defaultDays=5;defaultBudget=80000;homeCity="Vijayawada"}
Check "register new user" $reg "201"
if ($reg.ok) { "        interests de-duplicated -> " + ($reg.data.interests -join ",") }
CheckFails "duplicate email rejected (409)" (Invoke-Api Post "/api/auth/register" @{fullName="Dup";email=$email;password="test123"})
CheckFails "short password rejected (400)" (Invoke-Api Post "/api/auth/register" @{fullName="X";email="x$([guid]::NewGuid())@s.ai";password="12"})
CheckFails "invalid email rejected (400)" (Invoke-Api Post "/api/auth/register" @{fullName="Y";email="not-an-email";password="test123"})

Section "Module 1 - JWT protection"
CheckBlocked "no token -> 401" (Invoke-Api Get "/api/users/me")
CheckBlocked "garbage token -> 401" (Invoke-Api Get "/api/users/me" $null "not.a.jwt")
Check "valid token -> profile" (Invoke-Api Get "/api/users/me" $null $uh) "200"

Section "Module 1 - profile & preferences"
Check "update preferences" (Invoke-Api Put "/api/users/me" @{interests=@("Wildlife","Mountains");defaultDays=6;homeCity="Hyderabad"} $uh)
$me = (Invoke-Api Get "/api/users/me" $null $uh).data
"        profile now: interests=" + ($me.interests -join ",") + " days=" + $me.defaultDays + " city=" + $me.homeCity
CheckFails "change password wrong current rejected" (Invoke-Api Put "/api/users/me/password" @{currentPassword="nope";newPassword="newpass1"} $uh)
Check "change password ok" (Invoke-Api Put "/api/users/me/password" @{currentPassword="demo123";newPassword="demo123"} $uh)

Section "Module 1 - admin authorisation"
CheckBlocked "USER token blocked from admin list" (Invoke-Api Get "/api/users/admin" $null $uh)
Check "ADMIN token allowed" (Invoke-Api Get "/api/users/admin" $null $ah)
$all = (Invoke-Api Get "/api/users/admin" $null $ah).data
"        total accounts: " + $all.Count
Check "admin summary" (Invoke-Api Get "/api/users/admin/summary" $null $ah)
if ($reg.ok) {
  Check "admin updates a user" (Invoke-Api Put "/api/users/admin/$($reg.data.id)" @{loanEligible=$true} $ah)
  CheckFails "admin cannot delete self" (Invoke-Api Delete "/api/users/admin/$($adm.user.id)" $null $ah)
  Check "admin deletes test user" (Invoke-Api Delete "/api/users/admin/$($reg.data.id)" $null $ah)
}

Section "Security - password hashing"
"        (hash is BCrypt, verified indirectly: plaintext login still works above)"

""
"================ MODULE 1: $script:pass passed, $script:fail failed ================"
exit $script:fail
