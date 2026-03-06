# aifix

Detect and fix common AI-generated code mistakes. Like ESLint, but for AI slop.

**45% of developers** say their biggest frustration is AI code that's "almost right, but not quite." aifix catches those mistakes before they ship.

## Install

```bash
# Run without installing
npx aifix ./src

# Or install globally
npm install -g aifix
```

## Usage

```bash
# Scan your project
aifix .

# Scan with fix suggestions
aifix ./src --fix-hints

# JSON output for CI/CD
aifix . --json > report.json

# Only show errors (skip warnings)
aifix . --quiet
```

## What It Catches

| Rule | What it detects |
|------|----------------|
| `no-hallucinated-imports` | Packages AI confidently imports but aren't installed |
| `no-hardcoded-secrets` | API keys, tokens, passwords left in code |
| `no-empty-catch` | Empty catch blocks that swallow errors |
| `no-console-left` | console.log/debug left in code |
| `no-todo-left` | TODO/FIXME and AI placeholder comments |
| `missing-error-handling` | fetch/JSON.parse/promises without error handling |
| `no-dead-code` | Commented-out code blocks, unreachable code |
| `ai-code-patterns` | AI disclosures, generic names, redundant conversions |

## Example Output

```
  src/api/users.js
     4:38  ✖ "hallucinated-ai-lib" is not in package.json    no-hallucinated-imports
     8:1   ⚠ console statement left in code                  no-console-left
    20:3   ✖ Empty catch block — errors silently swallowed    no-empty-catch
    27:15  ✖ OpenAI API key — move to environment variable    no-hardcoded-secrets
    32:1   ✖ Unreachable code after return/throw              no-dead-code

  5 files scanned • 1 with issues • 5 errors • 2 warnings
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Check for AI code issues
  run: npx aifix . --quiet
```

Exit code 1 when errors are found, 0 when clean.

## Configuration

Create `.aifixignore` in your project root to skip files:

```
dist/
generated/
*.min.js
```

## Zero Dependencies

aifix has **no dependencies**. It's a single package with pure Node.js static analysis. Fast, lightweight, works offline.

## Supported Languages

- **Full support:** JavaScript, TypeScript, JSX, TSX
- **Partial support:** Python, Ruby, Go, Rust, Java, Kotlin, PHP, C/C++

## License

MIT
