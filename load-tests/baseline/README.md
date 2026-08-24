# 🏋️ EduSync — Baseline / Load Testing

A fully automated **baseline load test** for the EduSync API using [k6](https://k6.io).

## 📋 What This Test Does

| Property | Value |
|----------|-------|
| **Tool** | k6 v2.x |
| **Virtual Users** | 100 |
| **Duration** | ~1 minute (10s ramp-up + 40s hold + 10s ramp-down) |
| **Endpoints** | 5 (login, profile, survey/status, recommendations, health) |

Each virtual user simulates a real user session:
1. **Login** → obtains a JWT token
2. **Get Profile** → authenticated read
3. **Survey Status** → check for prompts
4. **Recommendations** → heaviest endpoint (cached)
5. **Health Check** → lightweight liveness

---

## 📁 Files

```
load-tests/baseline/
│
├── baseline_load_test.js   ← 🔑 Main k6 test script
├── seed_test_user.js       ← Creates the load-test user in DB
├── parse_results.js        ← Parses k6 JSON → readable report
├── run_load_test.ps1       ← All-in-one Windows runner (PowerShell)
└── README.md               ← This file
```

---

## ⚡ Quick Start

### Prerequisites

1. **Backend running locally:**
   ```bash
   cd pdd-backend
   npm run dev
   ```

2. **k6 installed:**
   ```powershell
   winget install k6
   # OR download from https://k6.io/docs/get-started/installation/
   ```
   > k6 v2.2.0 is already installed on this machine.

---

### Option A — One-Command Runner (Recommended)

```powershell
cd load-tests\baseline
.\run_load_test.ps1
```

With custom API URL:
```powershell
.\run_load_test.ps1 -BaseUrl "https://your-api.onrender.com/api"
```

With custom credentials:
```powershell
.\run_load_test.ps1 -BaseUrl "http://localhost:5000/api" -Email "myuser@test.com" -Pass "MyPass123"
```

---

### Option B — Step by Step

**Step 1:** Seed the load-test user
```powershell
node load-tests\baseline\seed_test_user.js
```

**Step 2:** Run the load test
```powershell
k6 run load-tests\baseline\baseline_load_test.js
```

**Step 3:** Save results + parse report
```powershell
k6 run --out json=load-tests\baseline\results.json load-tests\baseline\baseline_load_test.js
node load-tests\baseline\parse_results.js load-tests\baseline\results.json
```

---

## 📊 Reading the Output

### During the Test (k6 live output)

```
✓ login: status 200
✓ profile: status 200
✓ recommendations: status 200

http_req_duration............: avg=245ms min=42ms med=210ms max=1.4s p(90)=400ms p(95)=480ms
http_req_failed..............: 0.21%
http_reqs....................: 7320   120/s
```

### Key Metrics Explained

| Metric | Meaning | Target |
|--------|---------|--------|
| `http_reqs / s` | **Requests per second** — how many req your API handles | Higher = better |
| `http_req_duration p(95)` | **95th percentile response time** — 95% of requests finish within this | **< 500ms** ✅ |
| `http_req_duration p(99)` | **99th percentile** — worst-case except top 1% | **< 1500ms** ✅ |
| `http_req_failed` | **Error rate** | **< 1%** ✅ |
| `login_duration p(95)` | Login endpoint p95 | < 800ms |
| `recommendations_duration p(95)` | Heaviest endpoint p95 | < 500ms |
| `health_duration p(95)` | Health check p95 | < 100ms |

### Example Expected Output

```
📊  THROUGHPUT
   Total Requests : 7,320
   Duration       : ~60s
   RPS (approx)   : 122.0 req/sec

⏱️  RESPONSE TIMES
   Average : 245.3 ms
   Min     :  42.1 ms
   Max     : 1420.8 ms
   p95     : 478.2 ms   ✅ (threshold: < 500ms)
   p99     : 980.5 ms   ✅ (threshold: < 1500ms)

🚨  ERROR RATE
   Error Rate :   0.21 %   ✅ (threshold: < 1%)
```

---

## ⚙️ Configuration

Override defaults via environment variables:

```powershell
# Custom API target
$env:BASE_URL = "https://your-api.onrender.com/api"

# Custom credentials
$env:TEST_EMAIL = "loadtest@example.com"
$env:TEST_PASS  = "YourPassword123"

k6 run -e BASE_URL=$env:BASE_URL -e TEST_EMAIL=$env:TEST_EMAIL -e TEST_PASS=$env:TEST_PASS load-tests\baseline\baseline_load_test.js
```

---

## 🚦 Pass / Fail Thresholds

The test automatically passes or fails based on:

| Threshold | Limit | Meaning |
|-----------|-------|---------|
| `http_req_failed` | < 1% | Max 1% of requests can fail |
| `http_req_duration p(95)` | < 500ms | 95% of requests under 500ms |
| `http_req_duration p(99)` | < 1500ms | 99% of requests under 1.5s |
| `login_duration p(95)` | < 800ms | Login handles auth overhead |
| `profile_duration p(95)` | < 300ms | Fast profile reads |
| `survey_duration p(95)` | < 300ms | Fast survey status reads |
| `recommendations_duration p(95)` | < 500ms | Cached recommendations |
| `health_duration p(95)` | < 100ms | Near-instant health checks |

k6 exits with **code 0** (all passed) or **code 1** (threshold failed).

---

## 🔗 Related Tests

| Type | Location |
|------|----------|
| E2E Tests | `selenium-tests/` |
| Appium Tests | `appium-tests/` |
| **Baseline Load Test** | `load-tests/baseline/` ← You are here |
