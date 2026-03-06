/**
 * Detects hardcoded API keys, tokens, passwords, and secrets.
 * AI tools often generate placeholder or real-looking secrets inline.
 */
module.exports = {
  id: "no-hardcoded-secrets",
  name: "Hardcoded secrets detected",
  severity: "error",

  check(lines, filePath) {
    const issues = [];

    // Skip common false-positive files
    const basename = filePath.split("/").pop();
    if ([".env.example", ".env.sample", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"].includes(basename)) return [];
    if (filePath.includes("node_modules")) return [];

    const patterns = [
      { regex: /(['"`])(?:sk-[a-zA-Z0-9]{20,})\1/, msg: "OpenAI API key" },
      { regex: /(['"`])(?:ghp_[a-zA-Z0-9]{36,})\1/, msg: "GitHub personal access token" },
      { regex: /(['"`])(?:ghu_[a-zA-Z0-9]{36,})\1/, msg: "GitHub user token" },
      { regex: /(['"`])(?:AIza[a-zA-Z0-9_-]{35})\1/, msg: "Google API key" },
      { regex: /(['"`])(?:xox[bpas]-[a-zA-Z0-9-]+)\1/, msg: "Slack token" },
      { regex: /(['"`])(?:AKIA[A-Z0-9]{16})\1/, msg: "AWS access key" },
      { regex: /(['"`])(?:eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\1/, msg: "JWT token" },
      { regex: /(?:password|passwd|pwd|secret|api_key|apikey|api_secret|token|auth_token|access_token|private_key)\s*[:=]\s*(['"`])(?!process\.env|env\.|os\.environ|ENV\[|getenv|<|{{|\$\{)[a-zA-Z0-9!@#$%^&*()_+\-=]{8,}\1/i, msg: "Hardcoded credential" },
      { regex: /(?:mongodb(\+srv)?:\/\/)[^/\s'"]+:[^/\s'"]+@/, msg: "Database connection string with credentials" },
      { regex: /(?:postgres|mysql|redis):\/\/[^/\s'"]+:[^/\s'"]+@/, msg: "Database URL with password" },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*") || trimmed.startsWith("<!--")) continue;

      for (const p of patterns) {
        if (p.regex.test(line)) {
          issues.push({
            rule: this.id,
            line: i + 1,
            column: line.search(p.regex) + 1,
            message: `${p.msg} — move to environment variable`,
            severity: this.severity,
            fix: `Use process.env.YOUR_KEY or .env file`,
          });
          break; // One issue per line
        }
      }
    }
    return issues;
  },
};
