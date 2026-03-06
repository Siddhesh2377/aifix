#!/usr/bin/env node
const path = require("path");
const { scan } = require("../src/scanner");

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`  \x1b[32m\u2714\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m\u2716\x1b[0m ${name}`);
    failed++;
  }
}

console.log("\n  aifix tests\n");

// Test bad-ai-code.js fixture
const fixture = path.join(__dirname, "fixtures", "bad-ai-code.js");
const results = scan(fixture, { cwd: __dirname });

const hasRule = (id) => results.issues.some(i => i.rule === id);
const countRule = (id) => results.issues.filter(i => i.rule === id).length;

assert("detects hallucinated imports", hasRule("no-hallucinated-imports"));
assert("detects console.log", hasRule("no-console-left"));
assert("detects empty catch", hasRule("no-empty-catch"));
assert("detects hardcoded secrets", hasRule("no-hardcoded-secrets"));
assert("detects TODO comments", results.issues.some(i => i.rule === "no-todo-left" && /TODO/.test(i.message)));
assert("detects AI placeholders", results.issues.some(i => i.rule === "no-todo-left" && /placeholder/i.test(i.message)));
assert("detects missing error handling on fetch", hasRule("missing-error-handling"));
assert("detects dead code after return", results.issues.some(i => i.rule === "no-dead-code" && /Unreachable/.test(i.message)));
assert("detects commented-out code blocks", results.issues.some(i => i.rule === "no-dead-code" && /commented/.test(i.message)));
assert("detects AI disclosure in comments", results.issues.some(i => i.rule === "ai-code-patterns" && /AI disclosure/.test(i.message)));
assert("detects unhandled .then()", results.issues.some(i => i.rule === "missing-error-handling" && /\.then/.test(i.message)));
assert("finds 10+ errors total", results.summary.error >= 10);
assert("exit code 1 when errors", results.summary.error > 0);

// Test clean file
const cleanResults = scan(path.join(__dirname, "run.js"), { cwd: __dirname });
assert("no false positives on test file itself", cleanResults.issues.filter(i => i.severity === "error").length === 0);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
