/**
 * Detects empty catch blocks and swallowed errors.
 * AI tools often generate try/catch with empty or pass-only handlers.
 */
module.exports = {
  id: "no-empty-catch",
  name: "Empty catch block swallows errors",
  severity: "error",

  check(lines, filePath) {
    const issues = [];
    const ext = filePath.split(".").pop();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // JS/TS: catch (e) {} or catch { }
      if (["js", "ts", "jsx", "tsx", "mjs", "cjs"].includes(ext)) {
        if (/\bcatch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
          issues.push(this._issue(i, lines[i], "Empty catch block — errors will be silently swallowed"));
        }
        // Multi-line: catch (...) {\n}
        if (/\bcatch\s*\([^)]*\)\s*\{?\s*$/.test(line)) {
          const next = (lines[i + 1] || "").trim();
          if (next === "}" || next === "") {
            issues.push(this._issue(i, lines[i], "Empty catch block — errors will be silently swallowed"));
          }
        }
      }

      // Python: except:\n    pass
      if (["py"].includes(ext)) {
        if (/\bexcept(\s+\w+)?(\s+as\s+\w+)?\s*:\s*$/.test(line)) {
          const next = (lines[i + 1] || "").trim();
          if (next === "pass" || next === "...") {
            issues.push(this._issue(i, lines[i], "Bare except with pass — errors will be silently swallowed"));
          }
        }
      }
    }
    return issues;
  },

  _issue(i, line, message) {
    return {
      rule: this.id,
      line: i + 1,
      column: line.search(/catch|except/) + 1,
      message,
      severity: this.severity,
      fix: "Log the error or handle it appropriately",
    };
  },
};
