# blocker.1

**location**: src/roles/reviewer/skills/review/review.ts:73

uses `let` instead of `const` - violates vars:require-immutable tactic. the mutable counter `i` could be avoided by using a different pattern or accepting mutation is scoped to this spinner block

---

# nitpick.1

**location**: src/roles/reviewer/skills/review/review.ts:71

missing code paragraph comment before `const frames = [...]` - should explain why these specific spinner frames were chosen

---

# nitpick.2

**location**: src/roles/reviewer/skills/review/review.ts:119

missing code paragraph comment before the validation block `const hasRules = ...` - should have a comment like `// validate at least one scope input is provided`

---

# nitpick.3

**location**: src/roles/reviewer/skills/review/review.ts:218

missing code paragraph comment before `const readFileContent = async (file: string) => ...` - internal helper should have a one-liner explaining its purpose

---

# nitpick.4

**location**: src/roles/reviewer/skills/review/review.ts:221

error handling in catch block re-throws generic Error - consider wrapping with HelpfulError.wrap for better observability

---

# nitpick.5

**location**: src/roles/reviewer/skills/review/review.ts:483

CLI argument parsing uses positional iteration pattern - could be clearer with explicit named argument handling

---

# nitpick.6

**location**: src/domain.operations/review/invokeClaudeCode.ts:27

missing code paragraph comment before `let stdout = ''` block - should explain accumulator purpose

---

# nitpick.7

**location**: src/domain.operations/review/invokeClaudeCode.ts:27

uses `let` for stdout and stderr accumulators - while scoped to promise callback, could consider using array.push + join pattern to stay immutable

---

# nitpick.8

**location**: src/domain.operations/review/invokeClaudeCode.ts:71

IIFE pattern for `response`, `review`, and `usage` extraction could use named helper functions for better readability and testability

---

# nitpick.9

**location**: src/domain.operations/review/enumFilesFromDiffs.ts:10

missing `.note` in header comment explaining that this uses execSync (blocking) which could freeze the process on large diffs
