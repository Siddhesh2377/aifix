#!/usr/bin/env node

const path = require("path");
const { scan } = require("../src/scanner");
const { formatText, formatJSON } = require("../src/reporter");

const args = process.argv.slice(2);

// Parse flags
const flags = {
  help: args.includes("--help") || args.includes("-h"),
  json: args.includes("--json"),
  fix: args.includes("--fix-hints") || args.includes("-f"),
  quiet: args.includes("--quiet") || args.includes("-q"),
  version: args.includes("--version") || args.includes("-v"),
};

const targets = args.filter(a => !a.startsWith("-"));

if (flags.version) {
  const pkg = require("../package.json");
  console.log(`aifix v${pkg.version}`);
  process.exit(0);
}

if (flags.help || targets.length === 0) {
  console.log(`
  ${"\x1b[1m"}aifix${"\x1b[0m"} — Detect AI-generated code mistakes

  ${"\x1b[33m"}Usage:${"\x1b[0m"}
    aifix <path>          Scan a file or directory
    aifix .               Scan current project
    npx aifix ./src       Scan without installing

  ${"\x1b[33m"}Options:${"\x1b[0m"}
    -f, --fix-hints       Show fix suggestions
    --json                Output as JSON (for CI/CD)
    -q, --quiet           Only show errors (no warnings/info)
    -v, --version         Show version
    -h, --help            Show this help

  ${"\x1b[33m"}Rules:${"\x1b[0m"}
    no-console-left       Console.log left in code
    no-hardcoded-secrets  API keys, tokens, passwords
    no-empty-catch        Empty catch blocks
    no-todo-left          TODO/FIXME and AI placeholders
    missing-error-handling Unhandled async/fetch/JSON.parse
    no-hallucinated-imports Packages not in package.json
    no-dead-code          Commented-out code, unreachable code
    ai-code-patterns      AI disclosure, generic names, redundant code

  ${"\x1b[33m"}Config:${"\x1b[0m"}
    Add .aifixignore to skip files (like .gitignore)

  ${"\x1b[33m"}Examples:${"\x1b[0m"}
    aifix .                        Scan entire project
    aifix src/api --fix-hints      Scan with fix suggestions
    aifix . --json > report.json   JSON output for CI
    aifix src/index.js             Scan single file
`);
  process.exit(0);
}

// Run scan
const targetPath = path.resolve(targets[0]);

try {
  const results = scan(targetPath, { cwd: process.cwd() });

  // Filter if quiet mode
  if (flags.quiet) {
    results.issues = results.issues.filter(i => i.severity === "error");
    results.summary = { error: results.summary.error || 0 };
  }

  if (flags.json) {
    console.log(formatJSON(results));
  } else {
    console.log(formatText(results, { fix: flags.fix }));
  }

  // Exit with error code if there are errors (useful for CI)
  process.exit(results.summary.error > 0 ? 1 : 0);
} catch (err) {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(2);
}
