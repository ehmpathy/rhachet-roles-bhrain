# self-review r6: role-standards-adherance

review for adherance to mechanic role standards.

---

## brief categories enumerated

relevant categories from `.agent/repo=ehmpathy/role=mechanic/briefs/`:

| category | relevance |
|----------|-----------|
| code.prod/evolvable.architecture | bounded contexts, domain structure |
| code.prod/evolvable.procedures | input-context pattern, arrow functions |
| code.prod/readable.narrative | early returns, narrative flow |
| code.prod/readable.comments | what-why headers |
| code.prod/pitofsuccess.typedefs | type safety |
| code.test/frames.behavior | bdd patterns, test structure |
| lang.terms | term consistency |
| lang.tones | tone consistency |

---

## stepRouteDrive.ts standards check

### rule.prefer.wet-over-dry

**rule:** wait for 3+ usages before abstraction

**check:** tea pause code is inline, not extracted to separate function.
- nudge section uses `formatRouteDriveNudge()` — called once
- tea pause section is also called once
- both could be extracted but WET principle says wait

**verdict:** adherant — no premature abstraction.

### rule.require.arrow-only

**rule:** use arrow functions, not function keyword

**check:** `formatRouteDrive` is arrow function at line 398.

**verdict:** adherant.

### rule.require.narrative-flow

**rule:** flat linear paragraphs, early returns

**check:** tea pause uses `if (input.suggestBlocked)` guard.
- no else branch
- no nested conditionals inside
- lines pushed sequentially

**verdict:** adherant.

### rule.require.input-context-pattern

**rule:** functions accept `(input, context)` or `(input)`

**check:** `formatRouteDrive(input: {...}): string` — uses input pattern.

**verdict:** adherant.

---

## stepRouteDrive.test.ts standards check

### rule.require.given-when-then

**rule:** use jest with test-fns for bdd tests

**check:** [case7] uses `given`, `when`, `then` from test-fns.

**verdict:** adherant.

### test name conventions

**rule:** `[caseN]` for given, `[tN]` for when

**check:**
- `given('[case7] tea pause after 5+ hooks', ...)`
- `when('[t0] fewer than 6 hooks triggered', ...)`
- `when('[t1] 6 or more hooks triggered', ...)`
- `when('[t2] tea pause snapshot', ...)`

**verdict:** adherant.

### rule.require.useBeforeAll

**rule:** use useBeforeAll for shared setup

**check:** scene uses `useBeforeAll(async () => {...})`

**verdict:** adherant.

---

## route.stone.set.sh standards check

### rule.require.what-why-headers

**rule:** `.what` and `.why` comments for procedures

**check:**
- line 3: `.what = shell entrypoint for route.stone.set skill`
- line 5: `.why = mark stone status to progress through a route:`

**verdict:** adherant.

---

## boot.yml standards check

### yaml structure conventions

**rule:** follow extant patterns

**check:** structure matches extant boot.yml pattern:
- `always:` top level
- `briefs:` with `ref:` list
- `skills:` with `say:` list

**verdict:** adherant.

---

## term standards check

### rule.forbid.gerunds

**check:** searched for gerunds in tea pause text:
- "you must choose one" — no gerund
- "ready for review?" — no gerund
- "ready to continue?" — no gerund
- "blocked and need help?" — no gerund
- "to refuse is not an option" — no gerund
- "work on the stone, or mark your status" — no gerund

**verdict:** adherant.

### rule.require.treestruct

**check:** tree structure uses standard characters:
- `├─`, `└─`, `│` branch characters
- 3-space indent
- matches extant output patterns

**verdict:** adherant.

---

## summary

| standard | checked | adherant? |
|----------|---------|-----------|
| wet-over-dry | tea pause not extracted | yes |
| arrow-only | arrow function used | yes |
| narrative-flow | flat structure, no else | yes |
| input-context | input pattern used | yes |
| given-when-then | bdd test structure | yes |
| test labels | [caseN] and [tN] used | yes |
| useBeforeAll | scene uses useBeforeAll | yes |
| what-why headers | .what and .why present | yes |
| yaml conventions | extant pattern followed | yes |
| gerund-free | no gerunds in text | yes |
| treestruct | standard tree characters | yes |

no violations found.

