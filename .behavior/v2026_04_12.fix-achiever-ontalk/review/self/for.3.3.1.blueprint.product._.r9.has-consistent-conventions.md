# self-review: has-consistent-conventions (r9)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I searched the codebase for extant name patterns via grep:

1. `emit*` function names in goal.ts
2. `*FromStdin` and `*From*` function names across src/
3. `hook.on*` mode values in goal.ts
4. private function conventions in goal.ts

for each blueprint name, I compared against the pattern and verified consistency.

---

## name analysis: extractPromptFromStdin

### codebase search

```
grep -n "From" src/contract/cli/goal.ts
```

results:
- line 497: `buildGoalFromFlags` — verb + subject + From + source
- line 474: `readStdin` — verb + subject (no From, different pattern)

```
grep -rn "FromStdin" src/
```

results:
- route.ts:955: `readToolInputFromStdin` — verb + subject + From + source

### pattern analysis

| function | file | pattern |
|----------|------|---------|
| `readToolInputFromStdin` | route.ts:955 | read + ToolInput + From + Stdin |
| `buildGoalFromFlags` | goal.ts:497 | build + Goal + From + Flags |

**pattern:** `[verb][Subject]From[Source]`

### blueprint name check

`extractPromptFromStdin` = extract + Prompt + From + Stdin

| aspect | extant pattern | blueprint | matches? |
|--------|----------------|-----------|----------|
| verb position | first | first (extract) | yes |
| subject position | second | second (Prompt) | yes |
| "From" connector | yes | yes | yes |
| source position | last | last (Stdin) | yes |
| camelCase | yes | yes | yes |

### semantic verification

- `readToolInputFromStdin` returns whole parsed object
- `extractPromptFromStdin` returns just the `.prompt` field from parsed JSON

"extract" is semantically correct: it indicates field selection from a larger structure.

**verdict:** consistent with `verb+Subject+From+Source` pattern.

---

## name analysis: emitOnTalkReminder

### codebase search

```
grep -n "const emit" src/contract/cli/goal.ts
```

results:
- line 32: `const emitOwlHeader = (): void => {`
- line 46: `const emitSubBucket = (content: string, indent: string): void => {`
- line 61: `const emitGoalFull = (goal: Goal): void => {`
- line 128: `const emitGoalCondensed = (goal: Goal): void => {`

### pattern analysis

| function | line | pattern |
|----------|------|---------|
| `emitOwlHeader` | 32 | emit + Subject |
| `emitSubBucket` | 46 | emit + Subject |
| `emitGoalFull` | 61 | emit + Subject + Modifier |
| `emitGoalCondensed` | 128 | emit + Subject + Modifier |

**pattern:** `emit[Subject][Modifier?]`

### blueprint name check

`emitOnTalkReminder` = emit + OnTalkReminder

| aspect | extant pattern | blueprint | matches? |
|--------|----------------|-----------|----------|
| prefix | emit | emit | yes |
| subject follows | yes | yes (OnTalkReminder) | yes |
| camelCase | yes | yes | yes |
| scope | private (const) | private (const) | yes |

**verdict:** consistent with `emit*` prefix pattern.

---

## name analysis: 'hook.onTalk' mode value

### codebase search

```
grep -n "hook\." src/contract/cli/goal.ts
```

results:
- line 439: `| 'hook.onStop'` in parseArgsForTriage type

### pattern analysis

| value | line | pattern |
|-------|------|---------|
| `'hook.onStop'` | 439 | hook.on + Event |

**pattern:** `hook.on[Event]`

### blueprint value check

`'hook.onTalk'` = hook.on + Talk

| aspect | extant pattern | blueprint | matches? |
|--------|----------------|-----------|----------|
| prefix | hook.on | hook.on | yes |
| event follows | yes (Stop) | yes (Talk) | yes |
| string literal | yes | yes | yes |

### semantic verification

- `hook.onStop` fires when agent stops
- `hook.onTalk` fires when peer sends message

both are Claude Code hook events that follow `on[Event]` convention.

**verdict:** consistent with `hook.on*` pattern.

---

## private function conventions in goal.ts

### codebase search

```
grep -n "^const " src/contract/cli/goal.ts | head -20
```

all private functions in goal.ts use:
- `const` declaration (not `function`)
- camelCase names
- arrow function syntax

### blueprint functions

| function | declaration | name style | syntax |
|----------|-------------|------------|--------|
| extractPromptFromStdin | const | camelCase | arrow |
| emitOnTalkReminder | const | camelCase | arrow |

**verdict:** consistent with private function conventions in goal.ts.

---

## term consistency check

### "extract" vs "parse" vs "read"

I searched for how the codebase distinguishes these:

| term | usage | semantic |
|------|-------|----------|
| `read*` | readStdin, readToolInputFromStdin | get raw content or full object |
| `parse*` | parseArgsForTriage | transform string to structured |
| `extract*` | (new) extractPromptFromStdin | select field from structure |

blueprint uses "extract" correctly: it takes a parsed object and returns one field.

### "emit" vs "log" vs "output"

| term | usage | semantic |
|------|-------|----------|
| `emit*` | emitOwlHeader, emitSubBucket | write to stdout/stderr |
| `console.*` | inline console.error calls | direct log calls |

blueprint uses "emit" consistently: emitOnTalkReminder writes formatted output.

---

## no convention divergence found

all blueprint names follow extant patterns:

| name | extant pattern | blueprint usage | consistent? |
|------|----------------|-----------------|-------------|
| extractPromptFromStdin | verb+Subject+From+Source | extract+Prompt+From+Stdin | yes |
| emitOnTalkReminder | emit+Subject | emit+OnTalkReminder | yes |
| 'hook.onTalk' | hook.on+Event | hook.on+Talk | yes |

---

## reflection

I verified each blueprint name against extant patterns in goal.ts and route.ts:

1. **extractPromptFromStdin** follows `verb+Subject+From+Source` pattern seen in `readToolInputFromStdin` and `buildGoalFromFlags`

2. **emitOnTalkReminder** follows `emit+Subject` pattern seen in `emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, `emitGoalCondensed`

3. **'hook.onTalk'** follows `hook.on+Event` pattern seen in `'hook.onStop'`

4. **private function style** follows const + camelCase + arrow syntax used throughout goal.ts

no new terms introduced. no namespace divergence. no prefix/suffix inconsistency.

the blueprint names are consistent with codebase conventions.

**why this holds:**

the codebase has established conventions that the blueprint follows exactly:

1. **verb+Subject+From+Source** — `readToolInputFromStdin` (route.ts:955) and `buildGoalFromFlags` (goal.ts:497) establish this pattern. `extractPromptFromStdin` follows it.

2. **emit+Subject** — four extant functions (`emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, `emitGoalCondensed`) establish this pattern. `emitOnTalkReminder` follows it.

3. **hook.on+Event** — `'hook.onStop'` establishes this pattern for Claude Code hook events. `'hook.onTalk'` follows it.

4. **const+camelCase+arrow** — all private functions in goal.ts use this style. both new functions follow it.

---

## deeper questions asked

### q1: should it be "parsePromptFromStdin" instead of "extract"?

**analysis:** I searched for `parse*` patterns in goal.ts:
- `parseArgsForTriage` transforms raw argv to structured object

"parse" implies full transformation. "extract" implies field selection from already-parsed structure. since `extractPromptFromStdin` calls JSON.parse first then returns just `.prompt`, the name could be either.

**verdict:** "extract" is slightly more precise because the function's purpose is to get one field, not to parse. the JSON.parse call is incidental to extraction.

### q2: should emitOnTalkReminder be emitHookOnTalkReminder for symmetry with hook.onTalk?

**analysis:** I checked extant `emit*` names:
- `emitOwlHeader` — no prefix beyond emit
- `emitGoalFull` — subject is Goal, not context
- `emitSubBucket` — subject is format type

**verdict:** `emitOnTalkReminder` is consistent. the "Hook" is redundant because "OnTalk" already implies hook context. `emitGoalFull` doesn't say `emitCliGoalFull`.

### q3: why "Talk" and not "Message" or "Prompt"?

**analysis:** Claude Code hook names:
- `UserPromptSubmit` — the actual hook type
- but wish uses "onTalk" (wish line 1: "hook.onTalk")

**verdict:** "Talk" aligns with wish terminology. the wish says "onTalk" not "onMessage" or "onPrompt". follow wish language.

