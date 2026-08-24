/**
 * ============================================================
 *  EduSync - Load Test Results Parser
 *
 *  Parses the k6 JSON output and prints a clear, human-readable
 *  performance report with pass/fail status for every metric.
 *
 *  Usage:
 *    k6 run --out json=results.json baseline_load_test.js
 *    node parse_results.js results.json
 *    node parse_results.js           (defaults to results.json)
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const resultsFile = process.argv[2] || path.join(__dirname, "results.json");

// ─── ANSI Colours ────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  white: "\x1b[37m",
};

function pass(txt) { return `${C.green}✅ PASS${C.reset} ${txt}`; }
function fail(txt) { return `${C.red}❌ FAIL${C.reset} ${txt}`; }
function header(txt) { return `${C.bold}${C.cyan}${txt}${C.reset}`; }
function sub(txt) { return `${C.dim}${txt}${C.reset}`; }

function fmt(ms) {
  if (ms === undefined || ms === null || isNaN(ms)) return "  n/a ";
  return `${ms.toFixed(1).padStart(7)} ms`;
}

function fmtRate(r) {
  if (r === undefined || r === null || isNaN(r)) return "  n/a ";
  return `${(r * 100).toFixed(2).padStart(6)} %`;
}

// ─── Parse JSONL (k6 --out json format) ─────────────────────
function parseK6Json(filepath) {
  const raw = fs.readFileSync(filepath, "utf8");
  const lines = raw.split("\n").filter(Boolean);

  const metrics = {};

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type !== "Point") continue;

      const name = obj.metric;
      const val = obj.data?.value;
      if (val === undefined) continue;

      if (!metrics[name]) {
        metrics[name] = { values: [], tags: obj.data?.tags || {} };
      }
      metrics[name].values.push(val);
    } catch {
      // skip malformed lines
    }
  }

  // Compute stats
  const stats = {};
  for (const [name, m] of Object.entries(metrics)) {
    const vals = m.values.sort((a, b) => a - b);
    const n = vals.length;
    if (n === 0) continue;

    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const min = vals[0];
    const max = vals[n - 1];
    const p50 = vals[Math.floor(n * 0.5)];
    const p90 = vals[Math.floor(n * 0.9)];
    const p95 = vals[Math.floor(n * 0.95)];
    const p99 = vals[Math.floor(n * 0.99)];

    // For rate metrics (0/1 values)
    const isRate = vals.every((v) => v === 0 || v === 1);
    const rate = isRate ? sum / n : null;

    stats[name] = { n, avg, min, max, p50, p90, p95, p99, rate };
  }

  return stats;
}

// ─── Report ─────────────────────────────────────────────────
function printReport(stats) {
  const sep = "─".repeat(72);

  console.log(`\n${header(sep)}`);
  console.log(
    header("  EduSync Baseline Load Test — Results Report")
  );
  console.log(`${header(sep)}\n`);

  // ── Throughput ───────────────────────────────────────────
  const totalReqs = stats["http_reqs"]?.n ?? stats["requests_total"]?.n ?? 0;
  const duration = 60; // seconds
  const rps = (totalReqs / duration).toFixed(1);

  console.log(header("📊  THROUGHPUT"));
  console.log(`   Total Requests : ${C.bold}${totalReqs}${C.reset}`);
  console.log(`   Duration       : ~${duration}s`);
  console.log(`   RPS (approx)   : ${C.bold}${C.cyan}${rps} req/sec${C.reset}\n`);

  // ── Overall Response Times ───────────────────────────────
  const dur = stats["http_req_duration"];
  if (dur) {
    console.log(header("⏱️   RESPONSE TIMES  (http_req_duration)"));
    console.log(`   Average : ${C.bold}${fmt(dur.avg)}${C.reset}`);
    console.log(`   Min     : ${fmt(dur.min)}`);
    console.log(`   Max     : ${fmt(dur.max)}`);
    console.log(`   p50     : ${fmt(dur.p50)}`);
    console.log(`   p90     : ${fmt(dur.p90)}`);
    console.log(
      `   p95     : ${dur.p95 < 500 ? C.green : C.red}${fmt(dur.p95)}${C.reset}   ${sub("(threshold: < 500ms)")}`
    );
    console.log(
      `   p99     : ${dur.p99 < 1500 ? C.green : C.red}${fmt(dur.p99)}${C.reset}   ${sub("(threshold: < 1500ms)")}\n`
    );
  }

  // ── Error Rate ───────────────────────────────────────────
  const errRate = stats["http_req_failed"];
  if (errRate) {
    const rate = errRate.rate ?? errRate.avg;
    const ok = rate < 0.01;
    console.log(header("🚨  ERROR RATE  (http_req_failed)"));
    console.log(
      `   Error Rate : ${ok ? C.green : C.red}${fmtRate(rate)}${C.reset}   ${sub("(threshold: < 1%)")}\n`
    );
  }

  // ── Per-Endpoint Response Times ──────────────────────────
  const endpoints = [
    { key: "login_duration",           label: "POST /auth/login",       threshold: 800 },
    { key: "profile_duration",         label: "GET  /auth/profile",      threshold: 300 },
    { key: "survey_duration",          label: "GET  /survey/status",     threshold: 300 },
    { key: "recommendations_duration", label: "GET  /recommendations",   threshold: 500 },
    { key: "health_duration",          label: "GET  /health/health",     threshold: 100 },
  ];

  console.log(header("🔍  PER-ENDPOINT RESPONSE TIMES  (p95)"));
  console.log(
    `   ${"Endpoint".padEnd(30)} ${"avg".padStart(10)} ${"p95".padStart(10)} ${"Threshold".padStart(12)} Status`
  );
  console.log(`   ${"─".repeat(68)}`);

  for (const ep of endpoints) {
    const m = stats[ep.key];
    if (!m) {
      console.log(`   ${ep.label.padEnd(30)} ${sub("no data")}`);
      continue;
    }
    const p95ok = m.p95 <= ep.threshold;
    const status = p95ok
      ? `${C.green}✅ PASS${C.reset}`
      : `${C.red}❌ FAIL${C.reset}`;
    console.log(
      `   ${ep.label.padEnd(30)} ${fmt(m.avg).padStart(10)} ` +
        `${(p95ok ? C.green : C.red) + fmt(m.p95) + C.reset}   ` +
        `< ${String(ep.threshold).padStart(4)}ms   ${status}`
    );
  }

  // ── Per-Endpoint Fail Rates ──────────────────────────────
  const failRates = [
    { key: "login_fail_rate",           label: "POST /auth/login" },
    { key: "profile_fail_rate",         label: "GET  /auth/profile" },
    { key: "survey_fail_rate",          label: "GET  /survey/status" },
    { key: "recommendations_fail_rate", label: "GET  /recommendations" },
    { key: "health_fail_rate",          label: "GET  /health/health" },
  ];

  console.log(`\n${header("🚨  PER-ENDPOINT FAIL RATES  (threshold: < 1%)")}`);
  console.log(
    `   ${"Endpoint".padEnd(30)} ${"Fail Rate".padStart(12)} Status`
  );
  console.log(`   ${"─".repeat(52)}`);

  for (const fr of failRates) {
    const m = stats[fr.key];
    const rate = m ? (m.rate ?? m.avg ?? null) : null;
    if (rate === null) {
      console.log(`   ${fr.label.padEnd(30)} ${sub("no data")}`);
      continue;
    }
    const ok = rate < 0.01;
    const status = ok
      ? `${C.green}✅ PASS${C.reset}`
      : `${C.red}❌ FAIL${C.reset}`;
    console.log(
      `   ${fr.label.padEnd(30)} ${fmtRate(rate).padStart(10)}   ${status}`
    );
  }

  // ── Overall Verdict ──────────────────────────────────────
  const p95ok = dur ? dur.p95 < 500 : true;
  const p99ok = dur ? dur.p99 < 1500 : true;
  const errOk  = errRate ? (errRate.rate ?? errRate.avg ?? 0) < 0.01 : true;
  const allPassed = p95ok && p99ok && errOk;

  console.log(`\n${header(sep)}`);
  if (allPassed) {
    console.log(
      `  ${C.green}${C.bold}✅  ALL THRESHOLDS PASSED — System handled 100 VUs successfully!${C.reset}`
    );
  } else {
    console.log(
      `  ${C.red}${C.bold}❌  SOME THRESHOLDS FAILED — Review failing endpoints above.${C.reset}`
    );
  }
  console.log(`${header(sep)}\n`);
}

// ─── Entry ──────────────────────────────────────────────────
if (!fs.existsSync(resultsFile)) {
  console.error(`\n❌  Results file not found: ${resultsFile}`);
  console.error(
    `   Run the test first:\n   k6 run --out json=${resultsFile} load-tests/baseline/baseline_load_test.js\n`
  );
  process.exit(1);
}

console.log(`\nParsing results from: ${resultsFile}`);
const stats = parseK6Json(resultsFile);
printReport(stats);
