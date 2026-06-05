# Sends a signed fake Flutterwave `charge.completed` webhook to the local app so
# the payment flow can be tested without an actual bank transfer.
#
# Because the webhook route falls back to the payload when getCharge() 404s (the
# charge isn't real), this drives the full chain: verify signature ->
# mark_payment_status -> orders.payment_status='paid' -> pay page flips.
#
# Usage:
#   ./scripts/test-webhook.ps1 -Reference "reefa...."            # paid (default)
#   ./scripts/test-webhook.ps1 -Reference "reefa...." -Status failed
#   ./scripts/test-webhook.ps1 -Reference "reefa...." -Url http://localhost:3000/api/webhooks/flutterwave
#
# Get the Reference from the `payments` table (or the pay page network tab) for
# the order you just initiated.

param(
  [Parameter(Mandatory = $true)]
  [string]$Reference,
  [string]$Status = "succeeded",
  [string]$Url = "http://localhost:3000/api/webhooks/flutterwave",
  [string]$ChargeId = "chg_test_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
)

# Read the secret hash + currency from .env.local so the signature matches.
$envPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envPath)) { throw ".env.local not found at $envPath" }

$secret = $null
$currency = "NGN"
foreach ($line in Get-Content $envPath) {
  $t = $line.Trim()
  if ($t -match '^FLUTTERWAVE_SECRET_HASH\s*=\s*(.+)$') { $secret = $Matches[1].Trim() }
  if ($t -match '^FLUTTERWAVE_CURRENCY\s*=\s*(.+)$')    { $currency = $Matches[1].Trim() }
}
if (-not $secret) { throw "FLUTTERWAVE_SECRET_HASH not found in .env.local" }

# Build the payload as a compact JSON string. The exact bytes we sign must be
# the exact bytes we send, so build the string once and reuse it.
$payload = @{
  type = "charge.completed"
  data = @{
    id        = $ChargeId
    status    = $Status
    reference = $Reference
    currency  = $currency
  }
} | ConvertTo-Json -Compress -Depth 5

# Signature = base64(HMAC-SHA256(rawBody, secret))
$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret))
$sig  = [Convert]::ToBase64String($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload)))

Write-Host "POST $Url"
Write-Host "  reference: $Reference"
Write-Host "  status:    $Status"
Write-Host "  body:      $payload"
Write-Host "  signature: $sig`n"

try {
  $resp = Invoke-WebRequest -Uri $Url -Method Post -Body $payload `
    -ContentType "application/json" `
    -Headers @{ "flutterwave-signature" = $sig } `
    -UseBasicParsing
  Write-Host "HTTP $($resp.StatusCode): $($resp.Content)" -ForegroundColor Green
} catch {
  $r = $_.Exception.Response
  if ($r) {
    $code = [int]$r.StatusCode
    $body = (New-Object System.IO.StreamReader($r.GetResponseStream())).ReadToEnd()
    Write-Host "HTTP ${code}: $body" -ForegroundColor Red
  } else {
    throw
  }
}
