/**
 * ============================================================
 *  EduSync - Load Test Pre-flight Checker
 *
 *  Verifies the backend is reachable and key endpoints respond
 *  before starting the load test.
 *
 *  In local/fallback mode (no Supabase), uses a self-signed JWT.
 *  In production mode, pass AUTH_TOKEN env var with a real token.
 *
 *  Run: node load-tests\baseline\seed_test_user.js
 * ============================================================
 */

const https = require("https");
const http  = require("http");

const BASE_URL   = process.env.BASE_URL   || "http://localhost:5000/api";
const AUTH_TOKEN = process.env.AUTH_TOKEN || buildFallbackToken();

function buildFallbackToken() {
  const header  = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub:   "load-test-user-001",
    email: "loadtest@edusync.dev",
    iat:   Math.floor(Date.now() / 1000),
    exp:   Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  const sig = Buffer.from("load-test-signature").toString("base64url");
  return `${header}.${payload}.${sig}`;
}

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib    = urlObj.protocol === "https:" ? https : http;
    const data   = body ? JSON.stringify(body) : null;

    const headers = {
      "Content-Type": "application/json",
      Accept:         "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(data   ? { "Content-Length": Buffer.byteLength(data) } : {}),
    };

    const req = lib.request(
      { hostname: urlObj.hostname, port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search, method, headers },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try   { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("\n========================================");
  console.log("  EduSync - Load Test Pre-flight Check");
  console.log("========================================");
  console.log(`  Base URL : ${BASE_URL}`);
  console.log("========================================\n");

  let allPassed = true;

  // ── 1. Health Check ─────────────────────────────────────
  process.stdout.write("[ 1/4 ] GET /api/health ... ");
  try {
    const r = await request("GET", `${BASE_URL}/health`);
    if (r.status === 200 && r.body?.success) {
      console.log("✅  200 OK");
    } else {
      console.log(`❌  ${r.status} — ${JSON.stringify(r.body)}`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`❌  Unreachable: ${e.message}`);
    console.log("\n  Make sure the backend is running:  cd pdd-backend && npm run dev\n");
    process.exit(1);
  }

  // ── 2. API Version ──────────────────────────────────────
  process.stdout.write("[ 2/4 ] GET /api/health/version ... ");
  const rv = await request("GET", `${BASE_URL}/health/version`);
  if (rv.status === 200 && rv.body?.version) {
    console.log(`✅  200 OK  (v${rv.body.version})`);
  } else {
    console.log(`❌  ${rv.status} — ${JSON.stringify(rv.body)}`);
    allPassed = false;
  }

  // ── 3. Survey Status (auth) ──────────────────────────────
  process.stdout.write("[ 3/4 ] GET /api/survey/status (auth) ... ");
  const rs = await request("GET", `${BASE_URL}/survey/status`, null, AUTH_TOKEN);
  if (rs.status === 200) {
    console.log("✅  200 OK");
  } else {
    console.log(`❌  ${rs.status} — ${JSON.stringify(rs.body)}`);
    allPassed = false;
  }

  // ── 4. Recommendations (auth) ────────────────────────────
  process.stdout.write("[ 4/4 ] GET /api/recommendations (auth) ... ");
  const rr = await request("GET", `${BASE_URL}/recommendations`, null, AUTH_TOKEN);
  if (rr.status === 200) {
    console.log("✅  200 OK");
  } else {
    console.log(`❌  ${rr.status} — ${JSON.stringify(rr.body)}`);
    allPassed = false;
  }

  console.log();
  if (allPassed) {
    console.log("========================================");
    console.log("  ALL CHECKS PASSED — Ready for load test!");
    console.log("========================================");
    console.log("\n  Run the load test:\n");
    console.log("  k6 run load-tests\\baseline\\baseline_load_test.js\n");
    console.log("  Or with JSON output:");
    console.log("  k6 run --out json=load-tests\\baseline\\results.json load-tests\\baseline\\baseline_load_test.js\n");
  } else {
    console.log("========================================");
    console.log("  SOME CHECKS FAILED — fix issues before running load test");
    console.log("========================================\n");
    process.exit(1);
  }
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
