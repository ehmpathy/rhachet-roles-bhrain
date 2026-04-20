# self-review: has-role-standards-coverage (r14)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

fresh review. I walked through the blueprint code line by line and asked: "what standard should be present here?"

---

## blueprint code walkthrough

### lines 85-101: extractPromptFromStdin

```ts
/**
 * .what = extract prompt from Claude Code stdin JSON
 * .why = UserPromptSubmit hook receives JSON with prompt field
 */
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();
  if (!raw.trim()) return null;

  try {
    const json = JSON.parse(raw);
    const prompt = json.prompt;
    if (typeof prompt !== 'string' || !prompt.trim()) return null;
    return prompt;
  } catch {
    return null;
  }
};
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| .what header | yes | line 86 |
| .why header | yes | line 87 |
| arrow function | yes | `const ... = () =>` line 89 |
| explicit return type | yes | `: string \| null` line 89 |
| early return on invalid | yes | lines 91, 96 |
| no else branches | yes | none present |
| no gerunds in name | yes | "extractPromptFromStdin" |

**what I looked for but did not expect:**

| standard | expected? | reason |
|----------|-----------|--------|
| (input, context) pattern | no | reads side-effect (stdin), no input object |
| dependency injection | no | pure transformer, no deps |

**verdict:** all expected standards present.

---

### lines 107-128: emitOnTalkReminder

```ts
/**
 * .what = emit onTalk reminder to stderr
 * .why = vision specifies this exact format
 */
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  // ... treestruct output
};
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| .what header | yes | line 108 |
| .why header | yes | line 109 |
| arrow function | yes | `const ... = () =>` line 111 |
| explicit return type | yes | `: void` line 111 |
| treestruct output | yes | box-draw chars `├─ └─ │` |
| no gerunds in name | yes | "emitOnTalkReminder" |

**verdict:** all expected standards present.

---

### lines 48-54: hook.onTalk branch

```
├── [+] hook.onTalk mode branch (NEW)
│   ├─ extractPromptFromStdin()
│   ├─ if empty → exit 0 silently
│   ├─ setAsk({ content, scopeDir })
│   ├─ emitOnTalkReminder(content) → stderr
│   └─ exit 0
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| failfast on empty | yes | "if empty → exit 0 silently" |
| domain operation verb | yes | `setAsk` uses `set` verb |
| output to stderr | yes | "→ stderr" |

**verdict:** all expected standards present.

---

### lines 157-171: unit tests for extractPromptFromStdin

```
[+] extractPromptFromStdin
├── [case1] valid JSON with prompt
│   └─ [t0] → returns prompt content
├── [case2] empty stdin
│   └─ [t0] → returns null
├── [case3] malformed JSON
│   └─ [t0] → returns null
├── [case4] JSON without prompt field
│   └─ [t0] → returns null
├── [case5] JSON with empty prompt
│   └─ [t0] → returns null
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| given-when-then structure | yes | [caseN] for given, [tN] for then |
| unit test for transformer | yes | pure function tested |
| covers positive case | yes | case1 |
| covers negative cases | yes | case2-5 |

**verdict:** all expected standards present.

---

### lines 173-191: integration tests for ask accumulation

```
[+] hook.onTalk ask accumulation
├── [case1] normal message via stdin
│   ├─ [t0] → ask appended to inventory
│   ├─ [t1] → reminder emitted to stderr
│   └─ [t2] → exits 0
├── [case2] empty message via stdin
│   ├─ [t0] → no ask appended
│   └─ [t1] → exits 0 silently
...
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| integration test for orchestrator | yes | tests full CLI flow |
| given-when-then structure | yes | [caseN] and [tN] labels |
| covers positive case | yes | case1 |
| covers negative cases | yes | case2, case5 |
| covers edge cases | yes | case3 (multiple), case4 (duplicate) |

**verdict:** all expected standards present.

---

### lines 253-265: snapshot coverage

```
snapshot coverage:
- onTalk: normal message reminder
- onTalk: multiline message reminder
- onTalk: long message reminder
- onStop: halt with 1 ask
- onStop: halt with 3 asks
- onStop: halt with mixed coverage
- onStop: incomplete goals enumerated
- journey: single ask accumulated then verified
- journey: multiple asks accumulated then verified
- journey: mixed coverage with some asks covered
```

**standards I expect to find:**

| standard | present? | evidence |
|----------|----------|----------|
| snapshots for contract outputs | yes | 10 snapshots |
| covers positive outputs | yes | normal, halt outputs |
| covers edge outputs | yes | multiline, long message |

**verdict:** all expected standards present.

---

## gap check

I asked: "what might be absent?"

| potential gap | check | result |
|---------------|-------|--------|
| any function without .what? | checked all | none |
| any function without .why? | checked all | none |
| any function with `function` keyword? | checked all | none |
| any else branch? | searched | none |
| any gerund in identifier? | checked all | none |
| any test without [caseN]/[tN]? | checked test tree | none |
| any contract output without snapshot? | checked coverage | none |
| any error path without early return? | checked code | none |

**no gaps found.**

---

## reflection

I walked through each code block in the blueprint and asked "what standard should be present here?"

for each function: .what, .why, arrow syntax, return type
for each branch: failfast on invalid, no else
for each test file: given-when-then structure, [caseN]/[tN] labels
for each contract output: snapshot

all expected standards are present. 10 snapshots cover all contract outputs. 5 unit tests cover the transformer. 12 integration tests cover the orchestrator. 7 journey tests cover the multi-hook flow.

the blueprint has complete mechanic standards coverage.

