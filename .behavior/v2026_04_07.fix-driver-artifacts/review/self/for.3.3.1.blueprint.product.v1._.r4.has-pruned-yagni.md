# self-review r4: has-pruned-yagni

## verdict: pass

## YAGNI audit

### component: glob patterns

**requested?** yes. vision: "recognize `.yield.md`, `.yield.*`, `.yield`"
**minimum viable?** yes. 2 globs (simplified from 3 in r2)
**YAGNI?** no

### component: priority resolution

**requested?** yes. criteria usecase.2: "prefers .yield.md over .v1.i1.md"
**minimum viable?** yes. single transformer with priority array
**YAGNI?** no

### component: `.i1.md` priority (level 5)

**requested?** not in vision or criteria
**why included?** research found tests use `.i1.md`

**analysis**: this is not new functionality. current glob `${stone.name}*.md` already matches `.i1.md`. the blueprint just makes implicit behavior explicit in the priority order.

**YAGNI?** no (documents extant behavior, doesn't add new)

### component: snapshot tests

**requested?** not explicitly
**why included?** standard practice for visual regression

**analysis**: snapshots verify output format stability. they don't add features to the product - they verify features work.

**YAGNI?** no (verification, not feature)

### component: fallback in transformer

code:
```typescript
return input.artifacts.find(a => a.endsWith('.md')) ?? null;
```

**requested?** not explicitly
**why included?** handles unexpected patterns gracefully

**analysis**: if no priority pattern matches, returns first `.md` or null. this is defensive code, not speculation about future needs. graceful degradation is not YAGNI.

**YAGNI?** no (defensive, not speculative)

### component: regex complexity

regex: `/\.yield\.[^.]+$/`

**requested?** vision says "recognize `.yield.*`"
**why complex?** prevents false matches like `.yield.tar.gz`

**analysis**: the regex is precise, not over-engineered. `[^.]+` is minimal to exclude multi-dot extensions.

**YAGNI?** no (correct boundary, not speculative)

## conclusion

no YAGNI violations found. every component traces to requirements or documents extant behavior. no "future flexibility" abstractions. no "while we're here" features.
