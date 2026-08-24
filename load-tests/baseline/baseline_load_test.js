/**
 * ============================================================
 *  EduSync - Baseline / Load Test
 *  Tool: k6 (https://k6.io)
 *
 *  Scenario:  100 virtual users, 1 minute continuous run
 *  Goal:      Validate that response times remain fast under
 *             normal, expected concurrent load.
 *
 *  Endpoints exercised (in order per iteration):
 *    1. GET  /api/health              – lightweight health-check (no auth)
 *    2. GET  /api/health/version      – API version (no auth)
 *    3. GET  /api/survey/status       – survey state check (auth required)
 *    4. GET  /api/recommendations     – heaviest cached read (auth required)
 *    5. POST /api/survey/submit       – survey write (auth required)
 *
 *  Auth mode (fallback/local): any valid JWT structure is accepted.
 *  The script self-signs a HS256 token using a fixed secret so no
 *  login endpoint is needed.
 *
 *  Run:
 *    k6 run load-tests\baseline\baseline_load_test.js
 *    k6 run --out json=load-tests\baseline\results.json load-tests\baseline\baseline_load_test.js
 *
 *  Against production (real Supabase JWT required):
 *    k6 run -e AUTH_TOKEN=<supabase_jwt> load-tests\baseline\baseline_load_test.js
 * ============================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import encoding from "k6/encoding";

// ─── Custom Metrics ──────────────────────────────────────────
const healthFailRate          = new Rate("health_fail_rate");
const versionFailRate         = new Rate("version_fail_rate");
const surveyStatusFailRate    = new Rate("survey_status_fail_rate");
const recommendationsFailRate = new Rate("recommendations_fail_rate");
const surveySubmitFailRate    = new Rate("survey_submit_fail_rate");

const healthDuration          = new Trend("health_duration", true);
const versionDuration         = new Trend("version_duration", true);
const surveyStatusDuration    = new Trend("survey_status_duration", true);
const recommendationsDuration = new Trend("recommendations_duration", true);
const surveySubmitDuration    = new Trend("survey_submit_duration", true);

const requestsTotal = new Counter("requests_total");

// ─── Test Configuration ──────────────────────────────────────
export const options = {
  // Stages: ramp up → hold → ramp down  (total ≈ 60 s)
  stages: [
    { duration: "10s", target: 100 }, // Ramp-up  : 0 → 100 VUs in 10 s
    { duration: "40s", target: 100 }, // Sustained: 100 VUs for 40 s
    { duration: "10s", target: 0   }, // Ramp-down: 100 → 0 VUs in 10 s
  ],

  // Pass / Fail Thresholds
  thresholds: {
    http_req_failed:          ["rate<0.01"],   // < 1% errors overall
    http_req_duration:        ["p(95)<500"],   // p95 < 500 ms
    "http_req_duration{p:99}":["p(99)<1500"],  // p99 < 1.5 s

    health_fail_rate:          ["rate<0.01"],
    version_fail_rate:         ["rate<0.01"],
    survey_status_fail_rate:   ["rate<0.01"],
    recommendations_fail_rate: ["rate<0.01"],
    survey_submit_fail_rate:   ["rate<0.05"],  // slightly relaxed for POST

    health_duration:          ["p(95)<100"],
    version_duration:         ["p(95)<100"],
    survey_status_duration:   ["p(95)<300"],
    recommendations_duration: ["p(95)<500"],
    survey_submit_duration:   ["p(95)<800"],
  },
};

// ─── Configuration ───────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:5000/api";

// Pre-signed token (used when AUTH_TOKEN not provided).
// In fallback mode the middleware only decodes the payload —
// it does NOT verify the signature — so this works locally.
const AUTH_TOKEN = __ENV.AUTH_TOKEN || buildFallbackToken();

function buildFallbackToken() {
  // Build a minimal valid JWT (header.payload.signature) structure.
  // Signature is not checked in fallback mode.
  const header  = encoding.b64encode('{"alg":"HS256","typ":"JWT"}', "rawstd");
  const payload = encoding.b64encode(
    JSON.stringify({
      sub:   "load-test-user-001",
      email: "loadtest@edusync.dev",
      iat:   Math.floor(Date.now() / 1000),
      exp:   Math.floor(Date.now() / 1000) + 3600,
    }),
    "rawstd"
  );
  // Signature placeholder (not verified in fallback mode)
  const sig = encoding.b64encode("load-test-signature", "rawstd");
  return `${header}.${payload}.${sig}`;
}

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const AUTH_HEADERS = {
  ...COMMON_HEADERS,
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// Survey domains/levels to rotate through (avoids rate-limiting same data)
const DOMAINS      = ["Frontend", "Backend", "Mobile", "AI"];
const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced"];

// ─── Setup: runs ONCE before test starts ─────────────────────
export function setup() {
  console.log("\n============================================================");
  console.log("  EduSync Baseline / Load Test");
  console.log("============================================================");
  console.log("  Base URL : " + BASE_URL);
  console.log("  VUs      : 100");
  console.log("  Duration : ~60 s  (10 s ramp-up, 40 s hold, 10 s ramp-down)");
  console.log("============================================================\n");

  // Pre-flight health check
  const res = http.get(`${BASE_URL}/health`, { headers: COMMON_HEADERS });
  if (res.status === 200) {
    console.log("Pre-flight: Server healthy — starting load test...\n");
  } else {
    console.warn(
      "Pre-flight: Health check returned " + res.status +
      " — server may not be ready. Body: " + res.body
    );
  }

  return { baseUrl: BASE_URL, token: AUTH_TOKEN };
}

// ─── Default Function: runs per VU per iteration ─────────────
export default function (data) {
  const baseUrl = data.baseUrl;
  const vu = __VU;

  // Rotate survey data per VU to spread load
  const domain      = DOMAINS[vu % DOMAINS.length];
  const proficiency = PROFICIENCIES[vu % PROFICIENCIES.length];
  const hours       = (vu % 20) + 1; // 1-20

  // ── 1. Health Check ──────────────────────────────────────
  group("GET /health", () => {
    const res = http.get(`${baseUrl}/health`, {
      headers: COMMON_HEADERS,
      tags: { endpoint: "health" },
    });

    healthDuration.add(res.timings.duration);
    requestsTotal.add(1);

    const ok = check(res, {
      "health: status 200":       (r) => r.status === 200,
      "health: success true":     (r) => { try { return JSON.parse(r.body)?.success === true; } catch { return false; } },
      "health: response < 200ms": (r) => r.timings.duration < 200,
    });
    healthFailRate.add(!ok);
  });

  sleep(0.2);

  // ── 2. API Version ───────────────────────────────────────
  group("GET /health/version", () => {
    const res = http.get(`${baseUrl}/health/version`, {
      headers: COMMON_HEADERS,
      tags: { endpoint: "version" },
    });

    versionDuration.add(res.timings.duration);
    requestsTotal.add(1);

    const ok = check(res, {
      "version: status 200":       (r) => r.status === 200,
      "version: has version field": (r) => { try { return !!JSON.parse(r.body)?.version; } catch { return false; } },
      "version: response < 200ms": (r) => r.timings.duration < 200,
    });
    versionFailRate.add(!ok);
  });

  sleep(0.2);

  // ── 3. Survey Status ─────────────────────────────────────
  group("GET /survey/status", () => {
    const res = http.get(`${baseUrl}/survey/status`, {
      headers: AUTH_HEADERS,
      tags: { endpoint: "survey_status" },
    });

    surveyStatusDuration.add(res.timings.duration);
    requestsTotal.add(1);

    const ok = check(res, {
      "survey/status: status 200":           (r) => r.status === 200,
      "survey/status: has shouldShowPrompt": (r) => {
        try { return typeof JSON.parse(r.body)?.data?.shouldShowPrompt === "boolean"; }
        catch { return false; }
      },
      "survey/status: response < 400ms":    (r) => r.timings.duration < 400,
    });
    surveyStatusFailRate.add(!ok);
  });

  sleep(0.3);

  // ── 4. Recommendations ──────────────────────────────────
  group("GET /recommendations", () => {
    const res = http.get(`${baseUrl}/recommendations`, {
      headers: AUTH_HEADERS,
      tags: { endpoint: "recommendations" },
    });

    recommendationsDuration.add(res.timings.duration);
    requestsTotal.add(1);

    const ok = check(res, {
      "recommendations: status 200":  (r) => r.status === 200,
      "recommendations: success true": (r) => { try { return JSON.parse(r.body)?.success === true; } catch { return false; } },
      "recommendations: < 600ms":     (r) => r.timings.duration < 600,
    });
    recommendationsFailRate.add(!ok);
  });

  sleep(0.3);

  // ── 5. Survey Submit ─────────────────────────────────────
  group("POST /survey/submit", () => {
    const payload = JSON.stringify({
      focusDomain:   domain,
      proficiency:   proficiency,
      learningHours: hours,
    });

    const res = http.post(`${baseUrl}/survey/submit`, payload, {
      headers: AUTH_HEADERS,
      tags: { endpoint: "survey_submit" },
    });

    surveySubmitDuration.add(res.timings.duration);
    requestsTotal.add(1);

    const ok = check(res, {
      "survey/submit: status 200 or 201": (r) => r.status === 200 || r.status === 201,
      "survey/submit: success true":       (r) => { try { return JSON.parse(r.body)?.success === true; } catch { return false; } },
      "survey/submit: < 1000ms":          (r) => r.timings.duration < 1000,
    });
    surveySubmitFailRate.add(!ok);
  });

  // Think-time: simulate a real user pausing between page loads (0.5–1.5 s)
  sleep(Math.random() * 1 + 0.5);
}

// ─── Teardown: runs ONCE after test ends ─────────────────────
export function teardown(data) {
  console.log("\n============================================================");
  console.log("  Load test complete!");
  console.log("============================================================");
  console.log("  Key metrics to review:");
  console.log("    http_req_duration p(95)    -> overall p95 (target: <500ms)");
  console.log("    http_req_duration p(99)    -> overall p99 (target: <1500ms)");
  console.log("    http_req_failed            -> error rate  (target: <1%)");
  console.log("    http_reqs / s              -> requests per second");
  console.log("    recommendations_duration   -> heaviest endpoint");
  console.log("    survey_submit_duration     -> write endpoint");
  console.log("============================================================\n");
}
