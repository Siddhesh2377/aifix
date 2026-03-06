/**
 * Detects TODO, FIXME, HACK, XXX, and placeholder comments.
 * AI tools leave these as "I'll implement this later" markers.
 */
module.exports = {
  id: "no-todo-left",
  name: "Unresolved TODO/FIXME comments",
  severity: "warning",

  check(lines) {
    const issues = [];
    const pattern = /\b(TODO|FIXME|HACK|XXX|PLACEHOLDER|IMPLEMENT|STUB)\b/i;

    // AI-specific placeholder patterns (only match in comments)
    const aiCommentPatterns = [
      /(?:\/\/|#)\s*\.\.\..*(?:rest|more|other|remaining|additional)/i,
      /(?:\/\/|#)\s*(?:add|implement|replace|update|change)\s+(?:your|this|the|actual)/i,
    ];
    // These match anywhere (strings, variable names)
    const aiValuePatterns = [
      /['"`](?:your[_-]?(?:api[_-]?key|token|secret|password|url|endpoint))['"` ]/i,
      /(?:=|:)\s*['"`](?:placeholder|dummy|example|sample|fake|mock)[_-](?:api|key|token|url|data)['"` ]/i,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (pattern.test(line)) {
        const match = line.match(pattern);
        issues.push({
          rule: this.id,
          line: i + 1,
          column: line.search(pattern) + 1,
          message: `${match[1]} comment — resolve before shipping`,
          severity: this.severity,
        });
      }

      const allAiPatterns = [...aiCommentPatterns, ...aiValuePatterns];
      for (const p of allAiPatterns) {
        if (p.test(line)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: 1,
            message: "AI placeholder — needs real implementation",
            severity: "error",
          });
          break;
        }
      }
    }
    return issues;
  },
};
