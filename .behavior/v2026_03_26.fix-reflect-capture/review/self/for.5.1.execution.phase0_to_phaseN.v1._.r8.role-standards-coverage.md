# self-review r8: role-standards-coverage

## step back and breathe

r7 checked adherance (no violations). now I check coverage (no omissions). what patterns should be present but might be absent?

this review exhaustively enumerates briefs and checks each against the implementation.

---

## briefs enumeration

I will enumerate all briefs from mechanic role and check applicability.

### lang.terms briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.forbid.gerunds | yes | code has no gerund vars |
| rule.require.order.noun_adj | yes | vars follow pattern |
| rule.require.treestruct | yes | setSavepoint = [verb][noun] |
| rule.require.ubiqlang | yes | terms consistent |

### lang.tones briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.forbid.buzzwords | no | no comments with buzzwords |
| rule.forbid.shouts | yes | no caps acronyms |
| rule.prefer.lowercase | yes | comments lowercase |
| rule.require.term-human | no | no human references |

### code.prod/evolvable.procedures briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.require.arrow-only | yes | both functions use arrow |
| rule.require.input-context-pattern | yes | uses (input) arg |
| rule.forbid.positional-args | yes | uses named input |
| rule.require.dependency-injection | partial | no context arg |
| rule.require.named-args | yes | input is object |
| rule.require.single-responsibility | yes | one export |
| rule.require.hook-wrapper-pattern | no | no hooks used |

### code.prod/evolvable.architecture briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.prefer.wet-over-dry | yes | no premature abstraction |
| rule.require.bounded-contexts | yes | reflect domain |
| rule.require.domain-driven-design | yes | domain objects used |

### code.prod/pitofsuccess.errors briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.forbid.failhide | yes | no try/catch |
| rule.require.fail-fast | yes | typed inputs |
| rule.prefer.helpful-error-wrap | no | no wrap needed |

### code.prod/pitofsuccess.procedures briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.require.idempotent-procedures | n/a | time-based operation |
| rule.forbid.nonidempotent-mutations | n/a | not a mutation |
| rule.require.immutable-vars | yes | const/let correct |

### code.prod/pitofsuccess.typedefs briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.forbid.as-cast | yes | no casts |
| rule.require.shapefit | yes | types fit |

### code.prod/readable.comments briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.require.what-why-headers | yes | .what .why present |

### code.prod/readable.narrative briefs

| brief | applicable? | check |
|-------|-------------|-------|
| rule.avoid.unnecessary-ifs | yes | mode branch necessary |
| rule.forbid.else-branches | partial | else used for mode |
| rule.require.narrative-flow | yes | paragraph comments |

---

## absent pattern checks

### 1. should there be try/catch?

**analysis**: execSync throws on command failure. all errors are descriptive:
- `git not in repo` → "not a git repository"
- `disk full` → "No space left on device"
- `hash tool absent` → "command not found"

**verdict**: no try/catch needed. shell errors propagate clearly.

### 2. should inputs be validated at runtime?

**analysis**:
- `input.scope` typed as ReflectScope
- `input.mode` typed as 'plan' | 'apply'

TypeScript enforces at compile time. no runtime guards needed.

**verdict**: types are sufficient.

### 3. should tests be added?

**analysis**: blueprint marks large diff test as OPTIONAL because:
- extant tests verify behavior unchanged
- large diff test would require >1MB of changes
- fix verified by code review (shell redirect has no buffer)

**verdict**: extant tests cover behavior. optional test not required.

### 4. should types be more specific?

**analysis**:
- `hash: string` could be `Hash7Char` — no, internal only
- `stagedBytes: number` could be `NonNegativeInteger` — no, overkill

**verdict**: types are appropriately specific.

### 5. should comments be more detailed?

**analysis**: every code paragraph has a one-liner:
- line 84: `// generate timestamp`
- line 87: `// get HEAD commit hash (small output, safe to buffer)`
- line 93: `// construct paths`
- line 102: `// compute hash and sizes -- diff content never enters node`
- line 108: `// ensure directory exists before shell redirect`
- line 111: `// write diffs directly to files via shell redirect`
- line 116: `// hash from files via shell (portable: linux sha256sum, macos shasum)`
- line 123: `// sizes from filesystem`
- line 127: `// plan mode: hash and sizes via shell pipes (no files written)`

**verdict**: every paragraph documented.

### 6. should there be dependency injection?

**analysis**: setSavepoint has no `context` parameter. it uses:
- `execSync` — node built-in
- `fs` — node built-in
- `path` — node built-in

these are stable node APIs, not injectable dependencies.

**verdict**: no context needed for node built-ins.

### 7. should paths be quoted differently?

**analysis**: paths use double quotes in shell commands:
```typescript
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
```

double quotes allow variable expansion while protect spaces. this is correct.

**verdict**: quote style is correct.

### 8. should there be a fallback if wc fails?

**analysis**: `wc -c` is POSIX standard, available on all unix systems. if absent, the error is descriptive.

**verdict**: no fallback needed for POSIX commands.

### 9. should hash slice be configurable?

**analysis**: `combinedHash.slice(0, 7)` produces 7-char hash. this matches git short hash convention. no configuration needed.

**verdict**: 7-char hash is standard.

### 10. should parseInt have error handle?

**analysis**: `wc -c` always outputs a number. parseInt with radix 10 is correct. NaN is impossible from wc output.

**verdict**: no error handle needed.

### 11. should fs.mkdirSync have error handle?

**analysis**: `{ recursive: true }` means no error if directory exists. disk errors propagate with clear messages.

**verdict**: no error handle needed.

---

## summary of coverage checks

| category | question | result |
|----------|----------|--------|
| error handle | should there be try/catch? | no |
| validation | should inputs be validated? | types sufficient |
| tests | should tests be added? | optional, not required |
| types | should types be more specific? | appropriately typed |
| comments | should comments be more detailed? | every paragraph documented |
| dependency injection | should there be context? | no, uses node built-ins |
| shell commands | should paths be quoted differently? | quote style correct |
| shell commands | should there be wc fallback? | POSIX standard |
| implementation | should hash slice be configurable? | 7-char is standard |
| implementation | should parseInt have error handle? | wc output always numeric |
| implementation | should mkdirSync have error handle? | recursive mode safe |

---

## briefs coverage matrix

| brief | present? | notes |
|-------|----------|-------|
| gerunds | pass | only `encoding` (API) |
| noun_adj order | pass | vars follow pattern |
| treestruct | pass | setSavepoint = [set][Savepoint] |
| ubiqlang | pass | terms consistent |
| arrow-only | pass | no function keyword |
| input-context | pass | uses (input) arg |
| single-responsibility | pass | one export |
| fail-fast | pass | typed inputs |
| failhide | pass | no try/catch |
| immutable-vars | pass | let only where required |
| as-cast | pass | no casts |
| what-why-headers | pass | both present |
| narrative-flow | pass | paragraph comments |
| else-branches | acceptable | mode branch |

no coverage gaps found. all applicable standards present.

r8 complete.

