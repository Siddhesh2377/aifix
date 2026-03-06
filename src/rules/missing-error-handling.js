/**
 * Detects async functions and promises without error handling.
 * AI tools often generate happy-path-only code.
 */
module.exports = {
  id: "missing-error-handling",
  name: "Missing error handling",
  severity: "warning",
  languages: ["js", "ts", "jsx", "tsx", "mjs", "cjs"],

  check(lines, filePath) {
    const issues = [];
    const ext = filePath.split(".").pop();
    if (!this.languages.includes(ext)) return [];

    const fullText = lines.join("\n");

    // Detect fetch() without .catch or try/catch
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // fetch() or axios() without surrounding try
      if (/\b(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(/.test(line)) {
        if (!this._isInTryCatch(lines, i) && !this._hasCatchChain(lines, i)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: line.search(/fetch|axios/) + 1,
            message: "Network call without error handling — will crash on failure",
            severity: "error",
            fix: "Wrap in try/catch or add .catch()",
          });
        }
      }

      // JSON.parse without try/catch
      if (/\bJSON\.parse\s*\(/.test(line)) {
        if (!this._isInTryCatch(lines, i)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: line.search(/JSON\.parse/) + 1,
            message: "JSON.parse without try/catch — will throw on invalid JSON",
            severity: this.severity,
            fix: "Wrap in try/catch",
          });
        }
      }

      // .then() without .catch()
      if (/\.then\s*\(/.test(line) && !this._hasCatchChain(lines, i)) {
        issues.push({
          rule: this.id,
          line: i + 1,
          column: line.search(/\.then/) + 1,
          message: "Promise .then() without .catch() — unhandled rejection",
          severity: this.severity,
          fix: "Add .catch() handler",
        });
      }
    }

    return issues;
  },

  _isInTryCatch(lines, lineIndex) {
    // Look backwards for a try { before this line
    let braceDepth = 0;
    for (let i = lineIndex; i >= 0 && i >= lineIndex - 20; i--) {
      const line = lines[i].trim();
      for (const ch of line) {
        if (ch === "}") braceDepth++;
        if (ch === "{") braceDepth--;
      }
      if (/\btry\s*\{?/.test(line) && braceDepth <= 0) return true;
    }
    return false;
  },

  _hasCatchChain(lines, lineIndex) {
    // Look forward for .catch within next 5 lines
    for (let i = lineIndex; i < lines.length && i <= lineIndex + 5; i++) {
      if (/\.catch\s*\(/.test(lines[i])) return true;
    }
    return false;
  },
};
