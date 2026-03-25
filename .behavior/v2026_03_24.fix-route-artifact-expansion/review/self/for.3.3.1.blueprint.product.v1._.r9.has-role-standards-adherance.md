# self-review r9: has-role-standards-adherance

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/3.3.1.blueprint.product.v1.i1.md`
- `.agent/repo=ehmpathy/role=mechanic/briefs/` (relevant subdirectories)

---

## the question

does the blueprint adhere to mechanic role standards? any violations of required patterns?

---

## rule directories enumerated

relevant briefs subdirectories for this blueprint:

| directory | relevance |
|-----------|-----------|
| `practices/code.prod/evolvable.procedures/` | function signature patterns |
| `practices/code.prod/pitofsuccess.procedures/` | idempotency requirements |
| `practices/code.test/` | test patterns |
| `practices/lang.terms/` | name conventions |

---

## standard: input-context pattern

**rule:** `rule.require.input-context-pattern`

**blueprint code:**
```ts
const expandedGlob = glob.replace(/\$route/g, input.route);
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

**check:**
- `getAllStoneArtifacts` signature retains `(input: { stone, route })`
- code changes occur within the function body
- no modification to function signature

**verdict: compliant. no violation.**

---

## standard: dependency injection

**rule:** `rule.require.dependency-injection`

**blueprint code:** no context dependencies added or changed

**check:**
- `enumFilesFromGlob` is called with inline parameters
- no new dependencies introduced
- extant pattern preserved

**verdict: compliant. no new dependencies.**

---

## standard: idempotent procedures

**rule:** `rule.require.idempotent-procedures`

**check:**
- `getAllStoneArtifacts` is a read operation (enumeration)
- read operations are naturally idempotent
- same input produces same output

**verdict: compliant. read operation is idempotent.**

---

## standard: name conventions

**rule:** `rule.require.treestruct` (verb-first for mechanisms)

**check:**
- function name `getAllStoneArtifacts` follows `getAll[noun]` pattern
- matches verb-first name convention
- no name changes in blueprint

**verdict: compliant. name unchanged and correct.**

---

## standard: gerund prohibition

**rule:** `rule.forbid.gerunds`

**blueprint text scan:**

| term found | gerund? | location |
|------------|---------|----------|
| "expand" | no | verb |
| "expanded" | no | past participle |
| "remove" | no | verb |
| "prefix" | no | verb |

**verdict: compliant. no gerunds in code changes.**

---

## standard: cwd outside gitroot

**rule:** `rule.forbid.cwd-outside-gitroot`

**blueprint code:**
```ts
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

**check:**
- `cwd: input.route` is removed
- enumFilesFromGlob runs from repo root by default
- invariant #1 explicitly forbids cwd parameter

**verdict: compliant. rule explicitly followed.**

---

## standard: test patterns

**rule:** `rule.require.given-when-then`

**blueprint test coverage:**

| case | pattern |
|------|---------|
| [case4] | $route in guard artifacts |
| [case5] | no guard artifacts (default) |

**check:**
- test cases are described in terms of scenario and assertion
- tests follow behavior-driven pattern
- no explicit given/when/then in table but pattern is implied

**verdict: compliant. test structure follows conventions.**

---

## standard: single responsibility

**rule:** `rule.require.single-responsibility`

**check:**
- `getAllStoneArtifacts.ts` has one exported function
- function does one task: enumerate stone artifacts
- no additional responsibilities introduced

**verdict: compliant. single responsibility maintained.**

---

## anti-pattern scan

### anti-pattern: barrel exports

**rule:** `rule.forbid.barrel-exports`

**check:** blueprint does not introduce any index.ts changes

**verdict: not applicable.**

---

### anti-pattern: positional args

**rule:** `rule.forbid.positional-args`

**check:**
- `enumFilesFromGlob({ glob: expandedGlob })` uses named arg
- no positional arguments in code changes

**verdict: compliant.**

---

### anti-pattern: else branches

**rule:** `rule.forbid.else-branches`

**check:**
- blueprint uses ternary for glob selection (not if/else)
- ternary is allowed per narrative flow rules

**verdict: compliant.**

---

## summary

| standard | status |
|----------|--------|
| input-context pattern | compliant |
| dependency injection | compliant |
| idempotent procedures | compliant |
| name conventions | compliant |
| gerund prohibition | compliant |
| cwd outside gitroot | compliant |
| test patterns | compliant |
| single responsibility | compliant |
| barrel exports | not applicable |
| positional args | compliant |
| else branches | compliant |

**conclusion:** the blueprint adheres to all relevant mechanic role standards. no violations found.

---

## what i learned from this review

### lesson 1: rule.forbid.cwd-outside-gitroot directly applies

this blueprint's primary change (remove cwd parameter) is explicitly mandated by a mechanic brief. the rule and the fix align perfectly.

**remember for next time:** check if extant rules directly mandate the proposed change.

### lesson 2: read operations are naturally idempotent

`getAllStoneArtifacts` enumerates files. enumeration is a pure read operation — same input, same output. idempotency review is trivial for read operations.

**remember for next time:** categorize operations as read vs write before idempotency review.

### lesson 3: ternary vs if/else

the blueprint uses ternary for glob selection:
```ts
const globs = condition ? customGlobs : [defaultGlob];
```

ternaries are allowed and preferred over if/else for simple branches. this is compliant with narrative flow rules.

**remember for next time:** ternary is not the same as if/else — it's allowed for simple value selection.
