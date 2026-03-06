/**
 * Detects potentially hallucinated imports — packages that AI tools
 * confidently import but don't actually exist or aren't installed.
 */
const fs = require("fs");
const path = require("path");

let _installedPackagesCache = null;

function getInstalledPackages(filePath) {
  if (_installedPackagesCache) return _installedPackagesCache;

  // Walk up to find package.json
  let dir = path.dirname(filePath);
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        };
        _installedPackagesCache = new Set(Object.keys(deps));
        return _installedPackagesCache;
      } catch { break; }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// Node.js built-in modules
const BUILTINS = new Set([
  "assert", "buffer", "child_process", "cluster", "console", "constants",
  "crypto", "dgram", "dns", "domain", "events", "fs", "http", "http2",
  "https", "module", "net", "os", "path", "perf_hooks", "process",
  "punycode", "querystring", "readline", "repl", "stream", "string_decoder",
  "sys", "timers", "tls", "tty", "url", "util", "v8", "vm", "worker_threads",
  "zlib", "node:test", "node:assert",
]);

module.exports = {
  id: "no-hallucinated-imports",
  name: "Potentially hallucinated import",
  severity: "error",
  languages: ["js", "ts", "jsx", "tsx", "mjs", "cjs"],

  check(lines, filePath) {
    const issues = [];
    const ext = filePath.split(".").pop();
    if (!this.languages.includes(ext)) return [];

    const installed = getInstalledPackages(filePath);
    if (!installed) return []; // Can't check without package.json

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // import ... from "package"
      let match = line.match(/(?:import|export)\s+.*\s+from\s+['"]([^'"./][^'"]*)['"]/);
      if (!match) {
        // const x = require("package")
        match = line.match(/require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/);
      }

      if (match) {
        const pkg = match[1].split("/")[0]; // Handle @scope/pkg → @scope
        const fullPkg = match[1].startsWith("@") ? match[1].split("/").slice(0, 2).join("/") : pkg;

        // Skip node builtins
        if (BUILTINS.has(pkg) || BUILTINS.has(`node:${pkg}`) || pkg.startsWith("node:")) continue;

        if (!installed.has(fullPkg)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: line.indexOf(match[1]) + 1,
            message: `"${fullPkg}" is not in package.json — possibly hallucinated by AI`,
            severity: this.severity,
            fix: `Run: npm install ${fullPkg}  (or remove if it doesn't exist)`,
          });
        }
      }
    }
    return issues;
  },
};
