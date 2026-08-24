# ============================================================
#  EduSync - Baseline Load Test Runner (PowerShell)
#
#  Runs the full load test pipeline:
#    1. Checks k6 is installed
#    2. Seeds the test user
#    3. Runs the 100-VU, 1-minute load test
#    4. Parses and prints the results report
#
#  Usage:
#    .\run_load_test.ps1
#    .\run_load_test.ps1 -BaseUrl "https://your-api.com/api"
#    .\run_load_test.ps1 -BaseUrl "http://localhost:5000/api" -Email "test@example.com" -Pass "Secret123"
# ============================================================

param(
    [string]$BaseUrl = "http://localhost:5000/api",
    [string]$Email   = "loadtest@edusync.dev",
    [string]$Pass    = "LoadTest@123"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# ── ANSI Helpers ─────────────────────────────────────────────
function Write-Info  { param($msg) Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Err   { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Sep   { Write-Host ("─" * 64) -ForegroundColor DarkGray }

Write-Host ""
Write-Sep
Write-Host "  EduSync — Baseline Load Test Runner" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Sep
Write-Host "  Base URL : $BaseUrl" -ForegroundColor White
Write-Host "  Email    : $Email"    -ForegroundColor White
Write-Host "  VUs      : 100"       -ForegroundColor White
Write-Host "  Duration : ~60 seconds" -ForegroundColor White
Write-Sep
Write-Host ""

# ── Step 1: Check k6 ─────────────────────────────────────────
Write-Info "[1/4] Checking k6 installation..."
try {
    $k6Version = & k6 version 2>&1
    Write-Ok "k6 found: $k6Version"
} catch {
    Write-Err "k6 not found! Install it from https://k6.io/docs/getting-started/installation/"
    Write-Host "  Or run: winget install k6" -ForegroundColor Yellow
    exit 1
}

# ── Step 2: Seed Test User ───────────────────────────────────
Write-Host ""
Write-Info "[2/4] Seeding load test user..."
$env:BASE_URL   = $BaseUrl
$env:TEST_EMAIL = $Email
$env:TEST_PASS  = $Pass

$seedScript = Join-Path $ScriptDir "seed_test_user.js"
node $seedScript
if ($LASTEXITCODE -ne 0) {
    Write-Err "User seed failed. Make sure the backend is running."
    exit 1
}

# ── Step 3: Run Load Test ─────────────────────────────────────
$testScript   = Join-Path $ScriptDir "baseline_load_test.js"
$resultsJson  = Join-Path $ScriptDir "results.json"
$resultsSummary = Join-Path $ScriptDir "results_summary.txt"

Write-Host ""
Write-Info "[3/4] Running load test (100 VUs for ~1 minute)..."
Write-Host ""

& k6 run `
    --out "json=$resultsJson" `
    -e "BASE_URL=$BaseUrl" `
    -e "TEST_EMAIL=$Email" `
    -e "TEST_PASS=$Pass" `
    $testScript 2>&1 | Tee-Object -FilePath $resultsSummary

if ($LASTEXITCODE -ne 0) {
    Write-Warn "k6 exited with a non-zero code — some thresholds may have failed."
    Write-Warn "Check the output above and the detailed report below."
}

# ── Step 4: Parse & Print Report ────────────────────────────
Write-Host ""
Write-Info "[4/5] Generating detailed results report..."
Write-Host ""

$parseScript = Join-Path $ScriptDir "parse_results.js"
if (Test-Path $resultsJson) {
    node $parseScript $resultsJson
} else {
    Write-Warn "results.json not found — skipping detailed report."
}

# ── Step 5: Generate Excel Report ───────────────────────────
Write-Host ""
Write-Info "[5/5] Generating Excel report..."

$excelScript = Join-Path $ScriptDir "generate_excel_report.js"
$excelOutput = Join-Path $ScriptDir "load_test_report.xlsx"

if (Test-Path $resultsJson) {
    node $excelScript $resultsJson $excelOutput
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Excel report saved: $excelOutput"
    } else {
        Write-Warn "Excel generation failed. Run manually: node generate_excel_report.js results.json"
    }
} else {
    Write-Warn "results.json not found — skipping Excel report."
}

Write-Host ""
Write-Sep
Write-Host "  Output files:" -ForegroundColor White
Write-Host "    $resultsJson          (raw k6 metrics, JSONL)" -ForegroundColor DarkGray
Write-Host "    $resultsSummary       (k6 console summary)"    -ForegroundColor DarkGray
Write-Host "    $excelOutput          (Excel report, 6 sheets)" -ForegroundColor Green
Write-Sep
Write-Host ""
