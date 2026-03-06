const COLORS = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
};

const SEVERITY_COLORS = {
  error: COLORS.red,
  warning: COLORS.yellow,
  info: COLORS.blue,
};

const SEVERITY_ICONS = {
  error: "\u2716",   // ✖
  warning: "\u26A0", // ⚠
  info: "\u2139",    // ℹ
};

function formatText(results, options = {}) {
  const lines = [];

  if (results.issues.length === 0) {
    lines.push("");
    lines.push(`  ${COLORS.green}\u2714 No AI code issues found!${COLORS.reset}`);
    lines.push(`  ${COLORS.dim}Scanned ${results.totalFiles} files${COLORS.reset}`);
    lines.push("");
    return lines.join("\n");
  }

  // Group by file
  const byFile = {};
  for (const issue of results.issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }

  lines.push("");
  for (const [file, issues] of Object.entries(byFile)) {
    lines.push(`  ${COLORS.bold}${file}${COLORS.reset}`);
    for (const issue of issues) {
      const color = SEVERITY_COLORS[issue.severity] || COLORS.dim;
      const icon = SEVERITY_ICONS[issue.severity] || " ";
      const loc = `${COLORS.dim}${String(issue.line).padStart(4)}:${String(issue.column).padEnd(3)}${COLORS.reset}`;
      const rule = `${COLORS.dim}${issue.rule}${COLORS.reset}`;
      lines.push(`  ${loc}  ${color}${icon} ${issue.message}${COLORS.reset}  ${rule}`);
      if (options.fix && issue.fix) {
        lines.push(`  ${COLORS.dim}       \u21B3 Fix: ${issue.fix}${COLORS.reset}`);
      }
    }
    lines.push("");
  }

  // Summary
  const { error = 0, warning = 0, info = 0 } = results.summary;
  const parts = [];
  if (error) parts.push(`${COLORS.red}${error} error${error > 1 ? "s" : ""}${COLORS.reset}`);
  if (warning) parts.push(`${COLORS.yellow}${warning} warning${warning > 1 ? "s" : ""}${COLORS.reset}`);
  if (info) parts.push(`${COLORS.blue}${info} info${COLORS.reset}`);

  lines.push(`  ${COLORS.bold}${results.totalFiles} files scanned${COLORS.reset} \u2022 ${results.files} with issues \u2022 ${parts.join(" \u2022 ")}`);
  lines.push("");

  return lines.join("\n");
}

function formatJSON(results) {
  return JSON.stringify(results, null, 2);
}

module.exports = { formatText, formatJSON };
