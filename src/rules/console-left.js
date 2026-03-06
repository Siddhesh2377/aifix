/**
 * Detects console.log/debug/warn statements left in code.
 * AI tools frequently leave these in generated code.
 */
module.exports = {
  id: "no-console-left",
  name: "Console statements left in code",
  severity: "warning",
  languages: ["js", "ts", "jsx", "tsx", "mjs", "cjs"],

  check(lines, filePath) {
    const issues = [];
    const patterns = [
      { regex: /\bconsole\.(log|debug|info|dir|table|trace|time|timeEnd|count|group|groupEnd)\s*\(/, type: "console" },
      { regex: /\bprint\s*\((?!.*\bfile\s*=)/, type: "print", langs: ["py"] },
    ];

    const ext = filePath.split(".").pop();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

      for (const p of patterns) {
        if (p.langs && !p.langs.includes(ext)) continue;
        if (p.regex.test(line)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: line.search(p.regex) + 1,
            message: `${p.type} statement left in code — likely debugging artifact`,
            severity: this.severity,
            fix: `Remove or replace with proper logging`,
          });
        }
      }
    }
    return issues;
  },
};
