. "C:\Users\ganes\AppData\Local\Temp\opencode\lib.ps1"

$script:pass = 0
$script:fail = 0
function Check([string]$label, $r) {
  if ($r.ok) { $script:pass++; "  PASS  $label" }
  else { $script:fail++; "  FAIL  $label  -> HTTP $($r.status) : $($r.err)" }
}
function CheckFails([string]$label, $r) {
  if (-not $r.ok -and $r.status -ge 400) { $script:pass++; "  PASS  $label  (rejected: HTTP $($r.status))" }
  else { $script:fail++; "  FAIL  $label  -> expected >=400, got ok=$($r.ok) HTTP $($r.status)" }
}
function CheckBlocked([string]$label, $r) {
  if (-not $r.ok -and ($r.status -eq 401 -or $r.status -eq 403)) { $script:pass++; "  PASS  $label  (blocked: HTTP $($r.status))" }
  else { $script:fail++; "  FAIL  $label  -> expected 401/403, got ok=$($r.ok) HTTP $($r.status)" }
}
function Section([string]$t) { ""; "== $t ==" }

$adm  = (Invoke-Api Post "/api/auth/login" @{email="admin@hangova.ai";password="admin123"}).data
$usr  = (Invoke-Api Post "/api/auth/login" @{email="demo@hangova.ai";password="demo123"}).data
$ah = $adm.token
$uh = $usr.token

Section "Module 2 - AI trip planning"
$plan = Invoke-Api Post "/api/trips/plan" @{destination="Goa";days=4;travellers=2;budget=70000;interests=@("Beaches","Food","Nightlife");startDate="2026-11-05";save=$true} $uh
Check "generate itinerary for Goa" $plan
if ($plan.ok) {
  $t = $plan.data
  "        $($t.title)  |  by $($t.generatedBy)  |  live weather=$($t.liveWeather)"
  "        days returned: $($t.itinerary.Count) (requested 4)"
  "        first day stops: $($t.itinerary[0].activities.Count)"
  "        budget: Rs $($t.budgetBreakdown.total) vs Rs $($t.budgetBreakdown.budgetGiven) -> within=$($t.budgetBreakdown.withinBudget)"
  "        place suggestions: $($t.places.Count)   activity suggestions: $($t.activities.Count)"
  "        budget tips: $($t.budgetTips.Count)"
  $tripId = $t.id
}
CheckFails "blank destination rejected" (Invoke-Api Post "/api/trips/plan" @{destination="";days=3} $uh)
CheckFails "unknown destination rejected" (Invoke-Api Post "/api/trips/plan" @{destination="Xyzzy Nowhere Isle";days=3} $uh)
CheckFails "0 days rejected" (Invoke-Api Post "/api/trips/plan" @{destination="Goa";days=0} $uh)
CheckFails "absurd budget rejected" (Invoke-Api Post "/api/trips/plan" @{destination="Goa";days=3;travellers=2;budget=-5} $uh)
CheckBlocked "no token cannot plan" (Invoke-Api Post "/api/trips/plan" @{destination="Goa";days=3})
Check "preview without saving" (Invoke-Api Post "/api/trips/plan" @{destination="Kerala";days=2;save=$false} $uh)
Check "list my trips" (Invoke-Api Get "/api/trips" $null $uh)
Check "trip stats" (Invoke-Api Get "/api/trips/stats" $null $uh)
Check "destination recommendations by interest" (Invoke-Api Get "/api/trips/recommendations?interest=Wildlife" $null $uh)
Check "provider status" (Invoke-Api Get "/api/weather/status" $null $uh)

Section "Module 2 - live external APIs"
$w = Invoke-Api Get "/api/weather?destination=Goa&days=3" $null $uh
Check "weather endpoint" $w
if ($w.ok) { "        live=$($w.data.live)  $($w.data.summary)" }
$ps = Invoke-Api Get "/api/places/search?q=Jaipur" $null $uh
Check "place search" $ps
Check "destination detail" (Invoke-Api Get "/api/places/detail?name=Manali" $null $uh)

Section "Module 3 - hotels and transport"
$h = Invoke-Api Get "/api/hotels?destination=Goa&checkIn=2026-11-05&checkOut=2026-11-08&travellers=2&rooms=1" $null $uh
Check "hotel availability for Goa" $h
if ($h.ok) { "        $($h.data.Count) hotels; cheapest Rs $($h.data[-1].perNight)/night; sample: $($h.data[0].name) ($($h.data[0].tier))" }
Check "hotel availability for unknown city still returns options" (Invoke-Api Get "/api/hotels?destination=Kadapa" $null $uh)
$t3 = Invoke-Api Get "/api/transport?destination=Manali&date=2026-11-05&travellers=2" $null $uh
Check "transport options for Manali" $t3
if ($t3.ok) { "        $($t3.data.Count) options: " + (($t3.data | ForEach-Object { $_.mode }) -join ", ") }
Check "transport filtered by FLIGHT" (Invoke-Api Get "/api/transport?destination=Goa&mode=FLIGHT" $null $uh)
Check "weather via booking service (service-to-service)" (Invoke-Api Get "/api/availability/weather?destination=Goa&days=3" $null $uh)
Check "availability bundle" (Invoke-Api Get "/api/availability/bundle?destination=Goa" $null $uh)

Section "Module 3 - booking and cancellation"
$hotel = $h.data[1]
$bk = Invoke-Api Post "/api/bookings" @{type="HOTEL";title=$hotel.name;provider=$hotel.name;subtitle="$($hotel.area) - $($hotel.tier)";destination="Goa";checkIn="2026-11-05";checkOut="2026-11-08";travellers=2;rooms=1;amount=$hotel.totalPrice;refundable=$hotel.refundable;tripId=$tripId} $uh
Check "create hotel booking" $bk
if ($bk.ok) { "        ref $($bk.data.reference)  Rs $($bk.data.amount)  $($bk.data.seatOrRoom)  refundable=$($bk.data.refundable)" }
$tr = $t3.data[0]
$bk2 = Invoke-Api Post "/api/bookings" @{type="TRANSPORT";title="$($tr.operator) $($tr.from)-$($tr.to)";provider=$tr.operator;subtitle="$($tr.mode) $($tr.travelClass)";destination="Manali";travellers=2;amount=$tr.totalPrice;transportMode=$tr.mode;departureTime=$tr.depart;arrivalTime=$tr.arrive;tripId=$tripId} $uh
Check "create transport booking" $bk2
CheckFails "bad booking type rejected" (Invoke-Api Post "/api/bookings" @{type="SPACESHIP";title="x";amount=100} $uh)
CheckFails "missing amount rejected" (Invoke-Api Post "/api/bookings" @{type="HOTEL";title="x"} $uh)
Check "booking history" (Invoke-Api Get "/api/bookings" $null $uh)
Check "booking summary" (Invoke-Api Get "/api/bookings/summary" $null $uh)
if ($bk.ok) {
  $cx = Invoke-Api Post "/api/bookings/$($bk.data.id)/cancel" @{reason="Plans changed"} $uh
  Check "cancel booking" $cx
  if ($cx.ok) { "        status=$($cx.data.status)  refund=Rs $($cx.data.refundAmount) of Rs $($cx.data.amount)  reason=$($cx.data.cancellationReason)" }
  $cx2 = Invoke-Api Post "/api/bookings/$($bk.data.id)/cancel" @{reason="again"} $uh
  CheckFails "double cancellation rejected" $cx2
}
CheckFails "unknown booking id returns 404" (Invoke-Api Get "/api/bookings/000000000000000000000000" $null $uh)

Section "Module 3 - money borrowing (admin as nominee)"
$loan = Invoke-Api Post "/api/borrow/apply" @{amount=40000;purpose="Family trip to Goa";destination="Goa";travelDate="2026-11-05";durationMonths=12;contactNumber="9812345670"} $uh
Check "traveller applies for travel loan" $loan
if ($loan.ok) { "        ref $($loan.data.reference)  Rs $($loan.data.amount)  status=$($loan.data.status)" }
CheckFails "loan below minimum rejected" (Invoke-Api Post "/api/borrow/apply" @{amount=500;purpose="tiny"} $uh)
CheckFails "loan above cap rejected" (Invoke-Api Post "/api/borrow/apply" @{amount=900000;purpose="huge"} $uh)
CheckBlocked "traveller cannot approve own loan" (Invoke-Api Post "/api/borrow/$($loan.data.id)/approve" @{} $uh)
CheckBlocked "traveller cannot list all loans" (Invoke-Api Get "/api/borrow/all" $null $uh)
Check "admin sees pending queue" (Invoke-Api Get "/api/borrow/pending" $null $ah)
$ap = Invoke-Api Post "/api/borrow/$($loan.data.id)/approve" @{approvedAmount=35000;note="Approved at a reduced amount"} $ah
Check "admin approves loan" $ap
if ($ap.ok) { "        status=$($ap.data.status)  approved=Rs $($ap.data.approvedAmount)  by $($ap.data.nomineeName)  note=$($ap.data.decisionNote)" }
CheckFails "re-approving a decided loan rejected" (Invoke-Api Post "/api/borrow/$($loan.data.id)/approve" @{} $ah)
Check "admin disburses loan" (Invoke-Api Post "/api/borrow/$($loan.data.id)/disburse" @{} $ah)
Check "usable loans for paying" (Invoke-Api Get "/api/borrow/usable" $null $uh)
Check "my loans" (Invoke-Api Get "/api/borrow/mine" $null $uh)
if ($loan.ok) {
  $funded = Invoke-Api Post "/api/bookings" @{type="HOTEL";title="Loan funded hotel";destination="Goa";travellers=2;rooms=1;amount=12000;borrowRequestId=$loan.data.id} $uh
  Check "book using approved loan" $funded
}
Check "admin booking monitor" (Invoke-Api Get "/api/admin/bookings" $null $ah)
Check "admin summary" (Invoke-Api Get "/api/admin/summary" $null $ah)

Section "Module 4 - travel information"
Check "list trips with spend" (Invoke-Api Get "/api/info/trips" $null $uh)
Check "trip overview" (Invoke-Api Get "/api/info/trips/$tripId" $null $uh)
Check "booking history via info module" (Invoke-Api Get "/api/info/bookings" $null $uh)
$ex = Invoke-Api Post "/api/info/expenses" @{category="Food";description="Beach shack dinner";amount=2400;date="2026-11-06";paymentMode="UPI";tripId=$tripId} $uh
Check "add expense" $ex
$ex2 = Invoke-Api Post "/api/info/expenses" @{category="Activities";description="Water sports";amount=3200;date="2026-11-07";tripId=$tripId} $uh
Check "add second expense" $ex2
Check "update expense" (Invoke-Api Put "/api/info/expenses/$($ex.data.id)" @{amount=2600} $uh)
CheckFails "zero amount expense rejected" (Invoke-Api Post "/api/info/expenses" @{category="Food";description="x";amount=0} $uh)
Check "list expenses for trip" (Invoke-Api Get "/api/info/expenses?tripId=$tripId" $null $uh)
$sum = Invoke-Api Get "/api/info/expenses/summary?tripId=$tripId" $null $uh
Check "expense summary" $sum
if ($sum.ok) { "        total=Rs $($sum.data.total)  categories=" + (($sum.data.byCategory.PSObject.Properties | Where-Object { $_.Value -gt 0 } | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join ", ") }
Check "update trip title" (Invoke-Api Put "/api/info/trips/$tripId" @{title="Goa family holiday 2026"} $uh)
Check "delete expense" (Invoke-Api Delete "/api/info/expenses/$($ex2.data.id)" $null $uh)
CheckBlocked "admin overview blocked for user" (Invoke-Api Get "/api/admin/overview" $null $uh)
Check "admin overview" (Invoke-Api Get "/api/admin/overview" $null $ah)
Check "admin activity log" (Invoke-Api Get "/api/admin/activity?limit=10" $null $ah)

""
"============ MODULES 2-4: $script:pass passed, $script:fail failed ============"
