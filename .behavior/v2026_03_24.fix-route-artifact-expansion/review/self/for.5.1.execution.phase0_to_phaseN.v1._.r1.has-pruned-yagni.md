# self-review: has-pruned-yagni

## question

did we add extras not explicitly requested?

---

## review

### 1. quote-stripping in parseStoneGuard.ts

**what**: added `value.replace(/^["'](.*)["']$/, '$1')` to strip quotes from artifact values

**was it requested?** no, not in the blueprint

**is it YAGNI?** no — necessary for tests to pass

**why it holds**: YAML allows quoted strings (`- "foo"`). users expect quotes to be string delimiters, not part of the value. without this fix, `"$route/..."` would become `".$route/..."` after expansion, breaking glob matching.

---

### 2. prefixing custom patterns without $route

**what**: patterns without `$route` are prefixed with `input.route/`

**was it requested?** partially — the blueprint shows only `$route` expansion

**is it YAGNI?** no — maintains backwards compatibility

**why it holds**: the original code used `cwd: input.route`, so `*.md` looked in the route directory. changing to `cwd: process.cwd()` would break that. prefixing preserves expected behavior.

---

### 3. acceptance test infrastructure

**what**: created `blackbox/.test/assets/route-artifact-expansion/` and test file

**was it requested?** yes — wish mentions bhuild acceptance tests

**is it YAGNI?** no — verifies the fix works

---

## conclusion

no YAGNI found. all additions serve the core requirement:

1. quote-stripping: enables yaml patterns with quotes
2. pattern prefixing: maintains backwards compatibility
3. tests: verify the fix

no extras added "for future flexibility" or "while we're here".
