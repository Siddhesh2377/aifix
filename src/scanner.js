const fs = require("fs");
const path = require("path");

// Load all rules
const rulesDir = path.join(__dirname, "rules");
const rules = fs.readdirSync(rulesDir)
  .filter(f => f.endsWith(".js"))
  .map(f => require(path.join(rulesDir, f)));

const DEFAULT_EXTENSIONS = new Set([
  "js", "ts", "jsx", "tsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java", "kt", "swift",
  "php", "c", "cpp", "h", "hpp", "cs",
  "vue", "svelte",
]);

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", "dist", "build", "out",
  ".output", "coverage", "__pycache__", ".venv", "venv", "vendor",
  ".idea", ".vscode", "target", ".gradle",
]);

function getFiles(dir, extensions) {
  const exts = extensions || DEFAULT_EXTENSIONS;
  const results = [];

  // Check for .aifixignore
  const ignorePath = path.join(dir, ".aifixignore");
  let ignorePatterns = [];
  if (fs.existsSync(ignorePath)) {
    ignorePatterns = fs.readFileSync(ignorePath, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"));
  }

  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".")) continue;

      const full = path.join(d, entry.name);
      const rel = path.relative(dir, full);

      // Check ignore patterns
      if (ignorePatterns.some(p => rel.includes(p))) continue;

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = entry.name.split(".").pop();
        if (exts.has(ext)) {
          results.push(full);
        }
      }
    }
  }

  walk(dir);
  return results;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const issues = [];

  for (const rule of rules) {
    // Check language filter if rule has one
    if (rule.languages) {
      const ext = filePath.split(".").pop();
      if (!rule.languages.includes(ext)) continue;
    }

    try {
      const ruleIssues = rule.check(lines, filePath);
      issues.push(...ruleIssues);
    } catch (err) {
      // Don't let one rule crash the whole scan
    }
  }

  // Sort by line number
  issues.sort((a, b) => a.line - b.line);
  return issues;
}

function scan(targetPath, options = {}) {
  const stat = fs.statSync(targetPath);
  const files = stat.isDirectory()
    ? getFiles(targetPath, options.extensions)
    : [targetPath];

  const results = { files: 0, issues: [], summary: { error: 0, warning: 0, info: 0 } };

  for (const file of files) {
    const fileIssues = scanFile(file);
    if (fileIssues.length > 0) {
      results.files++;
      for (const issue of fileIssues) {
        issue.file = path.relative(options.cwd || process.cwd(), file);
        results.issues.push(issue);
        results.summary[issue.severity] = (results.summary[issue.severity] || 0) + 1;
      }
    }
  }

  results.totalFiles = files.length;
  return results;
}

module.exports = { scan, scanFile, getFiles, rules };
