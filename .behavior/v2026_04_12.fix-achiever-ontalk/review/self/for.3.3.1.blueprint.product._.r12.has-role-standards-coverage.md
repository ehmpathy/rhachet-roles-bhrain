# self-review: has-role-standards-coverage (r12)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I enumerated rule directories relevant to this blueprint and checked whether each applicable standard is present in the implementation. coverage means: are all required patterns included?

---

## rule directories relevant to blueprint

| directory | relevance | standards to verify present |
|-----------|-----------|---------------------------|
| `code.prod/evolvable.procedures` | new functions added | input-context, arrow-only, what-why headers |
| `code.prod/pitofsuccess.errors` | error conditions | failfast guards |
| `code.prod/readable.narrative` | function bodies | early returns, no else |
| `code.test/scope.coverage` | test plan | coverage by grain |
| `code.test/frames.behavior` | test structure | given-when-then labels |
| `lang.terms` | identifiers | no gerunds, proper name order |

---

## coverage check: evolvable.procedures

### rule.require.what-why-headers

**question:** do all new procedures have .what/.why headers?

| procedure | line | has header? |
|-----------|------|-------------|
| extractPromptFromStdin | 85-88 | yes |
| emitOnTalkReminder | 107-110 | yes |

**verdict:** covered.

### rule.require.arrow-only

**question:** are all functions declared with arrow syntax?

| procedure | line | arrow syntax? |
|-----------|------|---------------|
| extractPromptFromStdin | 89 | yes: `const ... = (): ... => {` |
| emitOnTalkReminder | 111 | yes: `const ... = (content): ... => {` |

**verdict:** covered.

### rule.require.input-context-pattern

**question:** do functions follow (input, context?) pattern?

| procedure | signature | compliant? |
|-----------|-----------|------------|
| extractPromptFromStdin | `(): string \| null` | yes (side-effect reader, no input) |
| emitOnTalkReminder | `(content: string): void` | yes (single logical input) |

**verdict:** covered.

---

## coverage check: pitofsuccess.errors

### rule.require.failfast

**question:** do error conditions exit early?

| condition | blueprint location | fails fast? |
|-----------|-------------------|-------------|
| empty stdin | line 91: `if (!raw.trim()) return null` | yes |
| malformed JSON | line 98-100: `catch { return null }` | yes |
| invalid prompt | line 96: `if (typeof prompt !== 'string'...) return null` | yes |
| empty prompt | line 50: `if empty → exit 0 silently` | yes |

**verdict:** covered.

### rule.require.helpful-error-wrap

**question:** are errors wrapped with context?

this blueprint intentionally does not throw errors. per the criteria (line 81):
> `malformed stdin → exits 0 silently`

silent skip is the specified behavior, not error throw. error wrap not applicable.

**verdict:** not applicable (intentional silent skip per spec).

---

## coverage check: readable.narrative

### rule.require.narrative-flow

**question:** is the code structured as flat paragraphs?

**extractPromptFromStdin (lines 89-101):**

| line | content | structure |
|------|---------|-----------|
| 90 | `const raw = readStdin()` | paragraph 1: read |
| 91 | `if (!raw.trim()) return null` | paragraph 2: guard |
| 93-100 | try/catch block | paragraph 3: parse and validate |

each paragraph is flat. no deep nests.

**verdict:** covered.

### rule.forbid.else-branches

**question:** are else branches absent?

searched blueprint code blocks for `else`:

```
line 89-101: no else
line 111-128: no else
```

**verdict:** covered.

---

## coverage check: test scope

### rule.require.test-coverage-by-grain

**question:** does test plan match grain requirements?

| grain | operation | required test | planned test |
|-------|-----------|---------------|--------------|
| transformer | extractPromptFromStdin | unit | line 139: unit |
| orchestrator | goalTriageInfer (onTalk) | integration | line 140: integration |
| contract | CLI invocation | acceptance + snapshot | lines 141, 206-212 |

**verdict:** covered.

### rule.require.snapshots

**question:** are contract outputs snapshot tested?

from blueprint lines 206-212:

| snapshot case | declared? |
|---------------|-----------|
| normal message reminder | yes |
| multiline message reminder | yes |
| long message reminder | yes |

**verdict:** covered.

---

## coverage check: test frames

### rule.require.given-when-then

**question:** does test tree use given/when/then structure?

from blueprint lines 157-203:

```
[+] extractPromptFromStdin
├── [case1] valid JSON with prompt     ← given block
│   └─ [t0] → returns prompt content   ← when/then block
```

| label | maps to |
|-------|---------|
| [caseN] | given |
| [tN] | when/then |

**verdict:** covered.

---

## coverage check: lang.terms

### rule.forbid.gerunds

**question:** are all identifiers free of gerunds?

| identifier type | examples from blueprint | gerund-free? |
|-----------------|------------------------|--------------|
| function names | extractPromptFromStdin, emitOnTalkReminder | yes |
| variables | raw, json, prompt, content, line | yes |

**verdict:** covered.

---

## gap analysis

| rule category | applicable? | covered? |
|---------------|-------------|----------|
| what-why headers | yes | yes |
| arrow-only | yes | yes |
| input-context | yes | yes |
| failfast | yes | yes |
| narrative-flow | yes | yes |
| forbid-else | yes | yes |
| test-coverage-by-grain | yes | yes |
| snapshots | yes | yes |
| given-when-then | yes | yes |
| forbid-gerunds | yes | yes |

**no gaps found.** all applicable standards are present in the blueprint.

---

## reflection

I checked whether all mechanic role standards relevant to this blueprint are present:

1. **procedure standards** — headers, arrow syntax, input pattern: all present
2. **error standards** — failfast guards: present where applicable
3. **narrative standards** — flat flow, no else: present
4. **test standards** — coverage by grain, snapshots, bdd labels: all present
5. **term standards** — no gerunds: verified

the blueprint covers all applicable mechanic role standards. no omissions detected.

---

## questions I asked about potential omissions

### q1: should there be type annotations on all parameters?

**standard context:** typescript best practices

**investigation:** the blueprint shows:
- `extractPromptFromStdin = (): string | null =>`
- `emitOnTalkReminder = (content: string): void =>`

both have return type annotations. emitOnTalkReminder has parameter type. extractPromptFromStdin has no parameters.

**verdict:** no omission. types are present where applicable.

### q2: should there be a separate dao for asks.inventory.jsonl?

**standard context:** evolvable.repo.structure suggests separation

**investigation:** setAsk already exists and handles the jsonl persistence. the blueprint reuses it (line 51). no new dao needed.

**verdict:** no omission. extant dao reused.

### q3: should extractPromptFromStdin have validation tests?

**standard context:** test coverage expects edge cases

**investigation:** the blueprint test tree (lines 157-167) declares:

- [case1] valid JSON with prompt → returns prompt content
- [case2] empty stdin → returns null
- [case3] malformed JSON → returns null
- [case4] absent prompt field → returns null
- [case5] empty prompt field → returns null

5 cases cover: happy path + 4 invalid input variations.

**verdict:** no omission. all validation paths tested.

### q4: should the hook.onTalk branch have a logger?

**standard context:** observability patterns

**investigation:** this is a UserPromptSubmit hook that runs on every user message. log output on every message would be noisy. the hook outputs to stderr as its observable signal (the reminder itself).

**verdict:** no omission. stderr output serves as observable signal.

### q5: are all error paths tested?

**standard context:** coverage requires negative cases

**investigation:** error paths in blueprint:

| error path | test coverage |
|------------|---------------|
| empty stdin | case2 (unit) |
| malformed JSON | case3 (unit) |
| absent .prompt | case4 (unit) |
| empty .prompt | case5 (unit) |
| empty message in hook | case2 (integration) |

all error paths have explicit test cases.

**verdict:** no omission. error paths covered.

---

## why this holds

1. **6 rule directories enumerated** — all relevant to this blueprint

2. **10 specific standards checked** — with explicit present/absent status

3. **gap analysis table completed** — all 10 rows show "covered"

4. **potential omissions investigated** — types, dao, validation, log output, error paths

5. **no absent practices found** — blueprint includes all required standards

