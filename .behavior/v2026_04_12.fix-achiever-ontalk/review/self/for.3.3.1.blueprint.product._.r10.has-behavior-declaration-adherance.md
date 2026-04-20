# self-review: has-behavior-declaration-adherance (r10)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I compared the blueprint (3.3.1.blueprint.product.yield.md) against the vision (1.vision.yield.md) line by line:

1. checked reminder output format matches vision lines 76-91
2. checked hook behavior contract matches vision lines 67-72
3. checked edge case handle matches vision lines 148-156
4. checked stdin extraction matches vision lines 169-173

---

## reminder output format adherance

### vision specifies (lines 76-91)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │
   │  │  {the user's message}
   │  │
   │  └─
   │
   └─ consider: does this impact your goals?
      ├─ if yes, triage before you proceed
      └─ run `rhx goal.triage.infer`
```

### blueprint implements (lines 111-128)

```ts
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  console.error('   ├─ from = peer:human');
  console.error('   ├─ ask');
  console.error('   │  ├─');
  console.error('   │  │  ');
  for (const line of content.split('\n')) {
    console.error(`   │  │    ${line}`);
  }
  console.error('   │  │  ');
  console.error('   │  └─');
  console.error('   │');
  console.error('   └─ consider: does this impact your goals?');
  console.error('      ├─ if yes, triage before you proceed');
  console.error('      └─ run `rhx goal.triage.infer`');
};
```

### line-by-line check

| vision line | blueprint line | matches? |
|-------------|----------------|----------|
| owl header | console.error(OWL_WISDOM) | yes |
| blank line | console.error('') | yes |
| `🔮 goal.triage.infer --from peer --when hook.onTalk` | line 114 | yes |
| `├─ from = peer:human` | line 115 | yes |
| `├─ ask` | line 116 | yes |
| sub.bucket open | line 117-118 | yes |
| message content | for loop lines 119-121 | yes |
| sub.bucket close | lines 122-124 | yes |
| `└─ consider:` | line 125 | yes |
| `├─ if yes, triage` | line 126 | yes |
| `└─ run \`rhx goal.triage.infer\`` | line 127 | yes |

**verdict:** blueprint output matches vision exactly.

---

## hook behavior contract adherance

### vision specifies (lines 67-72)

```
trigger: UserPromptSubmit hook fires
input: user message via stdin
output: reminder to stderr, exit 0
side effect: append ask to asks.inventory.jsonl
```

### blueprint implements

| vision contract | blueprint codepath | line |
|-----------------|-------------------|------|
| trigger = UserPromptSubmit | hook already calls skill | (extant) |
| input = stdin | extractPromptFromStdin reads stdin | 39-42 |
| output = stderr | console.error calls | 111-128 |
| exit 0 | exit 0 in branch | 53 |
| side effect = append ask | setAsk call | 51 |

**verdict:** blueprint adheres to hook behavior contract.

---

## edge case adherance

### vision specifies (lines 148-156)

| edge case | pit of success | blueprint |
|-----------|----------------|-----------|
| empty message | skip | line 50: if empty → exit 0 silently |
| huge message | show full in reminder | line 119-121: for loop iterates all lines |
| rapid messages | each gets own entry | sequential setAsk calls |
| binary/emoji | hash handles utf-8 | setAsk uses sha256 |

**verdict:** blueprint handles all vision edge cases.

---

## stdin extraction adherance

### vision specifies (lines 169-173)

> **[answered]** does claude code actually pipe stdin to UserPromptSubmit hooks?
> - yes. claude code passes JSON to stdin with a `prompt` field that holds the user message.
>
> **[answered]** is the stdin the raw user message or preprocessed?
> - preprocessed JSON object. extract prompt via `jq -r '.prompt'`

### blueprint implements (lines 89-101)

```ts
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

| vision requirement | blueprint implementation |
|-------------------|-------------------------|
| stdin is JSON | JSON.parse(raw) |
| extract .prompt field | json.prompt |
| handle malformed | catch → return null |

**verdict:** blueprint correctly extracts prompt from stdin JSON.

---

## stdout journey adherance

### vision [t0] (lines 205-232)

> trigger: UserPromptSubmit hook
> output to stderr: reminder format
> side effect: ask appended
> exit code: 0

### blueprint implementation

- trigger: extant hook calls skill
- output: emitOnTalkReminder to stderr (line 52)
- side effect: setAsk call (line 51)
- exit code: exit 0 (line 53)

**verdict:** blueprint matches vision [t0] journey.

---

## deviation check

I searched for any deviations from the vision:

| check | result |
|-------|--------|
| output format differs? | no — exact match |
| contract differs? | no — exact match |
| edge cases missed? | no — all handled |
| stdin differs? | no — JSON.parse matches jq equivalent |
| exit behavior differs? | no — exit 0 as specified |

**no deviations found.**

---

## reflection

I compared the blueprint line by line against the vision:

1. **reminder output** — blueprint lines 111-128 produce exact format specified in vision lines 76-91

2. **hook contract** — blueprint fulfills all four contract elements (input, output, side effect, exit)

3. **edge cases** — blueprint handles empty, huge, rapid, and utf-8 as vision specifies

4. **stdin extraction** — blueprint parses JSON and extracts .prompt field as vision documents

the blueprint adheres to the vision. no junior misinterpretations detected.

---

## deeper verification: possible drift points

I identified areas where a junior could have drifted from the spec:

### drift point 1: output format indentation

**risk:** treestruct indentation is finicky. easy to get spacing wrong.

**vision (line 84):** shows exact spacing with 3-space indents

**blueprint verification:**
- line 114: `'🔮 goal.triage.infer ...'` — correct root
- line 115: `'   ├─ from = ...'` — 3 spaces before `├─`
- line 117: `'   │  ├─'` — 3 spaces, bar, 2 spaces, branch
- line 120: `'   │  │    ${line}'` — 3+3+4 = 10 chars indent before content

**verdict:** indentation matches vision treestruct convention.

### drift point 2: console.error vs console.log

**risk:** could output to stdout instead of stderr.

**vision (line 95):** "output: reminder to stderr"

**blueprint verification:**
- lines 111-127: ALL use `console.error`, not `console.log`
- emitOnTalkReminder contains zero `console.log` calls

**verdict:** correctly uses stderr throughout.

### drift point 3: exit code semantics

**risk:** could use exit 1 or exit 2 for silent cases.

**vision (line 95):** "exit 0" — explicit requirement

**blueprint verification:**
- line 50: empty message → "exit 0 silently"
- line 53: normal path → "exit 0"
- nowhere in hook.onTalk branch is exit 1 or exit 2 used

**verdict:** correctly uses exit 0 for all hook.onTalk paths.

### drift point 4: OWL_WISDOM constant

**risk:** could use wrong owl quote or make up new one.

**vision (line 77):** "🦉 to forget an ask is to break a promise. remember."

**blueprint verification:**
- line 112: `console.error(OWL_WISDOM)` — reuses extant constant
- OWL_WISDOM already defined in goal.ts for onStop — same quote

**verdict:** correctly reuses extant constant.

---

## why this holds

1. **exact format match** — I compared treestruct indentation character by character

2. **stderr enforced** — all output uses console.error, not console.log

3. **exit code correct** — only exit 0 used, matching vision requirement

4. **constant reused** — OWL_WISDOM reused rather than hardcoded string

5. **no creative additions** — blueprint implements exactly what vision specifies, no extras

