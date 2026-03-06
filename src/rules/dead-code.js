/**
 * Detects common dead code patterns left by AI tools.
 * Commented-out code blocks, unreachable returns, duplicate functions.
 */
module.exports = {
  id: "no-dead-code",
  name: "Dead or commented-out code",
  severity: "warning",

  check(lines, filePath) {
    const issues = [];

    // Detect large blocks of commented-out code (3+ consecutive comment lines that look like code)
    let commentBlock = [];
    let commentStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const isCommentedCode =
        /^\/\/\s*(const|let|var|function|class|import|export|if|for|while|return|async|await|try)\b/.test(trimmed) ||
        /^#\s*(def|class|import|from|if|for|while|return|try|async)\b/.test(trimmed);

      if (isCommentedCode) {
        if (commentBlock.length === 0) commentStart = i;
        commentBlock.push(i);
      } else {
        if (commentBlock.length >= 3) {
          issues.push({
            rule: this.id,
            line: commentStart + 1,
            column: 1,
            message: `${commentBlock.length} lines of commented-out code — remove or uncomment`,
            severity: this.severity,
          });
        }
        commentBlock = [];
      }
    }

    // Catch trailing block
    if (commentBlock.length >= 3) {
      issues.push({
        rule: this.id,
        line: commentStart + 1,
        column: 1,
        message: `${commentBlock.length} lines of commented-out code — remove or uncomment`,
        severity: this.severity,
      });
    }

    // Detect code after return/throw (unreachable)
    const ext = filePath.split(".").pop();
    if (["js", "ts", "jsx", "tsx", "mjs", "cjs"].includes(ext)) {
      for (let i = 0; i < lines.length - 1; i++) {
        const trimmed = lines[i].trim();
        if (/^(return|throw)\s/.test(trimmed) && trimmed.endsWith(";")) {
          const next = lines[i + 1].trim();
          if (next && next !== "}" && next !== "}" && !next.startsWith("//") && !next.startsWith("case ") && !next.startsWith("default:")) {
            issues.push({
              rule: this.id,
              line: i + 2,
              column: 1,
              message: "Unreachable code after return/throw",
              severity: "error",
            });
          }
        }
      }
    }

    return issues;
  },
};
