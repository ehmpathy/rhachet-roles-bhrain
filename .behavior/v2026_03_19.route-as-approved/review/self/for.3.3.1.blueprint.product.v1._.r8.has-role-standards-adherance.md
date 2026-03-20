# self-review: has-role-standards-adherance (round 8)

## role standards adherance review

the guide asks: "does the blueprint follow mechanic standards correctly? are there violations of required patterns? did the junior introduce anti-patterns, bad practices, or deviations from our conventions?"

---

## step 1: enumerate relevant rule directories

the blueprint modifies:
1. **setStoneAsApproved.ts** — domain operation
2. **formatRouteStoneEmit.ts** — domain operation (formatter)
3. **howto.drive-routes.[guide].md** — brief file
4. **boot.yml** — configuration
5. **test files** — test code

relevant rule categories from mechanic briefs:

| category | applies to | relevant? |
|----------|------------|-----------|
| evolvable.domain.operations | setStoneAsApproved.ts, formatRouteStoneEmit.ts | yes |
| evolvable.procedures | all code changes | yes |
| readable.comments | code changes | yes |
| readable.narrative | code changes | yes |
| pitofsuccess.procedures | operations | yes |
| lang.terms | all names | yes |
| lang.tones | brief content | yes |
| code.test/frames.behavior | test changes | yes |

---

## step 2: rule-by-rule adherance check

### rule: require-get-set-gen-verbs

**rule summary:** all domain operations use exactly one of: get, set, or gen.

**blueprint elements:**
- `setStoneAsApproved` — uses `set` prefix. ADHERES.
- `formatRouteStoneEmit` — uses `format` prefix.

**potential issue?** `format` is not get/set/gen.

**examination:** the rule applies to operations that retrieve, mutate, or create. `format` is a pure transformation — it takes input and returns formatted output. it does not access external state.

the rule exempts contract/cli entry points and pure transforms. `formatRouteStoneEmit` is a pure formatter.

**verdict:** ADHERES. formatter is exempt from get/set/gen rule.

---

### rule: require-sync-filename-opname

**rule summary:** filename === operationname.

**blueprint files:**
- `setStoneAsApproved.ts` contains `setStoneAsApproved`. MATCHES.
- `formatRouteStoneEmit.ts` contains `formatRouteStoneEmit`. MATCHES.
- `howto.drive-routes.[guide].md` — markdown, not operation. N/A.

**verdict:** ADHERES.

---

### rule: require-input-context-pattern

**rule summary:** procedures accept (input, context?).

**blueprint does not show function signatures directly.** it shows codepath trees.

**examination:** the blueprint marks changes to guidance string content, not function signatures. the extant signatures already follow (input, context) pattern (verified in prior reviews).

**verdict:** ADHERES. no signature changes proposed.

---

### rule: require-what-why-headers

**rule summary:** require .what and .why comments for procedures.

**blueprint elements:**
- changes to guidance string — string value change, not new procedure
- changes to header — inline string change, not new procedure
- new brief file — markdown content, not code

**examination:** the blueprint does not add new procedures. it modifies extant procedures by value changes. no new .what/.why headers needed.

**verdict:** ADHERES. no new procedures require headers.

---

### rule: require-narrative-flow

**rule summary:** structure logic as flat linear code paragraphs.

**blueprint elements:**
- setStoneAsApproved.ts codepath shows `!isHuman` branch with linear flow:
  1. approved: false
  2. emit.stdout = formatRouteStoneEmit

**examination:** the extant code already has flat linear flow. the blueprint change updates a VALUE (guidance string), not control flow.

**verdict:** ADHERES. no control flow changes.

---

### rule: forbid-gerunds

**rule summary:** gerunds (-ing as nouns) forbidden.

**blueprint text scan:**

| text | contains gerund? |
|------|-----------------|
| "signal work complete" | no |
| "proceed" | no |
| "escalate if stuck" | no |
| "as a driver, you should:" | no |
| "the human will run" | no |

**brief file name:** `howto.drive-routes.[guide].md`
- "drive" is a verb, not gerund
- "routes" is a noun
- no gerunds

**verdict:** ADHERES. no gerunds in blueprint content.

---

### rule: require-given-when-then (test structure)

**rule summary:** use jest with test-fns for given/when/then tests.

**blueprint test trees:**
```
when '[t0] isTTY is false'
├─ [○] then 'approval fails with clear message'
├─ [○] then 'output contains "only humans can approve"'
```

**examination:** the test tree shows when/then structure. the blueprint extends extant tests that already use given/when/then.

**verdict:** ADHERES. tests follow BDD structure.

---

### rule: prefer-lowercase (lang.tones)

**rule summary:** enforce lowercase for words unless required by code or name convention.

**blueprint output format:**
```
🦉 patience, friend.

🗿 route.stone.set
   ├─ stone = 1.vision
   ├─ ✗ only humans can approve
   │
   └─ as a driver, you should:
      ├─ `--as passed` = signal work complete, proceed
      ├─ `--as arrived` = signal work complete, request review
      └─ `--as blocked` = escalate if stuck

   the human will run `--as approved` when ready.
```

**scan for capitals:**
- "patience, friend." — lowercase ✓
- "route.stone.set" — code literal, lowercase ✓
- "stone = 1.vision" — lowercase ✓
- "only humans can approve" — lowercase ✓
- "as a driver, you should:" — lowercase ✓
- "signal work complete, proceed" — lowercase ✓
- "the human will run" — lowercase ✓

**verdict:** ADHERES. all content is lowercase.

---

### rule: im_an.ehmpathy_seaturtle (tone)

**rule summary:** mechanic uses seaturtle tone and phrases.

**examination:** this blueprint is for bhrain owl driver role, not mechanic seaturtle role. the output uses owl tone (`🦉 patience, friend.`), not seaturtle tone.

**is this a violation?**

**no.** the blueprint is FOR the driver role, not FROM the mechanic. the mechanic writes the blueprint but the output is consumed by drivers. the owl tone is correct for driver-faced output.

**verdict:** ADHERES. tone matches target audience (drivers).

---

### rule: forbid-term-* (vague terms)

**rule summary:** avoid vague overloaded terms.

**blueprint content scan:**
- no use of vague terms
- all terms are precise and domain-specific

**verdict:** ADHERES. no forbidden terms.

---

## step 3: brief content standards

the blueprint declares a new brief: `howto.drive-routes.[guide].md`

**brief name convention check:**

extant briefs in `driver/briefs/`:
- `define.routes-are-gardened.[philosophy].md`
- `howto.create-routes.[ref].md`
- `im_a.bhrain_owl.md`
- `research.importance-of-focus.[philosophy].md`

**pattern:** `{prefix}.{topic}.[{type}].md`

**blueprint:** `howto.drive-routes.[guide].md`
- prefix: `howto` ✓ (matches `howto.create-routes`)
- topic: `drive-routes` ✓ (kebab-case)
- type: `[guide]` ✓ (bracket syntax)

**verdict:** ADHERES. brief name follows convention.

---

## step 4: test extension standards

### rule: forbid-redundant-expensive-operations

**rule summary:** avoid same expensive call in multiple then blocks.

**blueprint test extensions:**
```
├─ [+] expect stdout to contain '--as passed'
├─ [+] expect stdout to contain '--as arrived'
└─ [+] expect stdout to contain '--as blocked'
```

**examination:** these assertions share a single operation result. the extant test calls the operation once and asserts on the result multiple times. no redundant calls.

**verdict:** ADHERES.

---

### rule: require-useThen-useWhen-for-shared-results

**rule summary:** use useThen to share async results.

**examination:** the blueprint extends extant test assertions. the extant test structure already uses appropriate patterns. the extensions add assertions, not new operations.

**verdict:** ADHERES.

---

## deviation summary

| rule | applies to | adheres? |
|------|------------|----------|
| require-get-set-gen-verbs | operations | yes (formatter exempt) |
| require-sync-filename-opname | files | yes |
| require-input-context-pattern | signatures | yes (no changes) |
| require-what-why-headers | procedures | yes (no new procedures) |
| require-narrative-flow | control flow | yes (no changes) |
| forbid-gerunds | all text | yes |
| require-given-when-then | tests | yes |
| prefer-lowercase | output | yes |
| tone (owl vs seaturtle) | output | yes (correct for audience) |
| forbid-term-* | all text | yes |
| brief name convention | brief | yes |
| test extension rules | tests | yes |

**total violations: 0**

---

## the owl reflects 🦉

> i enumerated the rule directories.
> i checked each rule against the blueprint.
> i found no violations.
>
> the formatter is exempt from get/set/gen.
> the tone is correct for the audience.
> the names follow conventions.
> the tests follow BDD patterns.
>
> the mechanic standards are honored.
> the junior did not introduce anti-patterns.
>
> the way is sound. 🪷

