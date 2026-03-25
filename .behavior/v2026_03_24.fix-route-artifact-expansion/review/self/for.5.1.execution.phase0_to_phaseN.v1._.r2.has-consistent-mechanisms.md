# self-review: has-consistent-mechanisms

## question

did we duplicate extant functionality or deviate from extant patterns?

---

## review

### $route expansion pattern

**extant mechanisms**:
- `runStoneGuardReviews.ts:212` — `cmd.replace(/\$route/g, vars.route)`
- `runStoneGuardJudges.ts:298` — `cmd.replace(/\$route/g, vars.route)`

**new mechanism**:
- `getAllStoneArtifacts.ts:25` — `glob.replace(/\$route/g, input.route)`

### why it holds

the new mechanism uses the exact same pattern:
- same regex: `/\$route/g`
- same operation: `.replace()`
- same variable name: `route`

no duplication. no deviation. consistent with extant mechanisms.

### variable scope

reviews and judges expand additional variables (`$stone`, `$hash`, `$output`) because they execute shell commands. artifact globs only need `$route` since they're file patterns, not commands.

### quote strip in yaml parser

**new mechanism**:
- `parseStoneGuard.ts:148` — `value.replace(/^["'](.*)["']$/, '$1')`

**is there an extant pattern?**

searched for quote strip patterns in the codebase. the yaml parser is custom (no external yaml lib). this is the first place quotes needed to be stripped from list items.

no extant pattern to reuse. the new mechanism is appropriate.

---

## conclusion

no duplicated functionality. all mechanisms are consistent with extant patterns.
