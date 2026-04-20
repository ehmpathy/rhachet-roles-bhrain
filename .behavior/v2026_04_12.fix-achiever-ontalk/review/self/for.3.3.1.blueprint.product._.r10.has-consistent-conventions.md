# self-review: has-consistent-conventions (r10)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read the blueprint, then searched for extant patterns:

1. grep for `emit*` functions in goal.ts
2. grep for `*From*` functions across src/
3. grep for `hook.on*` mode values
4. read code to verify private function style

---

## names in blueprint

| name | type | location |
|------|------|----------|
| extractPromptFromStdin | function | goal.ts (new) |
| emitOnTalkReminder | function | goal.ts (new) |
| 'hook.onTalk' | mode value | parseArgsForTriage type union |

---

## analysis: extractPromptFromStdin

### extant pattern search

| extant function | file:line | pattern |
|-----------------|-----------|---------|
| `readToolInputFromStdin` | route.ts:955 | read + ToolInput + From + Stdin |
| `buildGoalFromFlags` | goal.ts:497 | build + Goal + From + Flags |

**pattern:** `[verb][Subject]From[Source]`

### blueprint match

`extractPromptFromStdin` = extract + Prompt + From + Stdin

| element | extant | blueprint | match |
|---------|--------|-----------|-------|
| verb | read/build | extract | yes (verb first) |
| subject | ToolInput/Goal | Prompt | yes |
| connector | From | From | yes |
| source | Stdin/Flags | Stdin | yes |

**semantic check:** "extract" indicates field selection from structure. correct for `.prompt` field access.

**verdict:** follows `verb+Subject+From+Source` convention.

---

## analysis: emitOnTalkReminder

### extant pattern search

| extant function | file:line | pattern |
|-----------------|-----------|---------|
| `emitOwlHeader` | goal.ts:32 | emit + OwlHeader |
| `emitSubBucket` | goal.ts:46 | emit + SubBucket |
| `emitGoalFull` | goal.ts:61 | emit + Goal + Full |
| `emitGoalCondensed` | goal.ts:128 | emit + Goal + Condensed |

**pattern:** `emit[Subject][Modifier?]`

### blueprint match

`emitOnTalkReminder` = emit + OnTalkReminder

| element | extant | blueprint | match |
|---------|--------|-----------|-------|
| prefix | emit | emit | yes |
| subject | OwlHeader/SubBucket/Goal | OnTalkReminder | yes |
| style | camelCase | camelCase | yes |

**verdict:** follows `emit*` prefix convention.

---

## analysis: 'hook.onTalk'

### extant pattern search

| extant value | file:line | pattern |
|--------------|-----------|---------|
| `'hook.onStop'` | goal.ts:439 | hook.on + Stop |

**pattern:** `hook.on[Event]`

### blueprint match

`'hook.onTalk'` = hook.on + Talk

| element | extant | blueprint | match |
|---------|--------|-----------|-------|
| prefix | hook.on | hook.on | yes |
| event | Stop | Talk | yes (different event, same pattern) |

**semantic check:** onStop = session ends, onTalk = peer sends message. both are Claude Code hook events.

**verdict:** follows `hook.on*` convention.

---

## private function style

### extant convention in goal.ts

```
const emitOwlHeader = (): void => { ... };
const emitSubBucket = (content: string, indent: string): void => { ... };
const readStdin = (): string => { ... };
```

**pattern:** `const [name] = ([params]): [returnType] => { ... };`

### blueprint functions

| function | declaration | style |
|----------|-------------|-------|
| extractPromptFromStdin | const | arrow function |
| emitOnTalkReminder | const | arrow function |

**verdict:** follows private function style.

---

## term consistency

### "extract" term

| term | extant usage | semantic |
|------|--------------|----------|
| read* | readStdin | get raw content |
| parse* | parseArgsForTriage | transform to structure |
| build* | buildGoalFromFlags | compose from inputs |
| **extract*** | (new) extractPromptFromStdin | select field from structure |

"extract" is distinct from extant terms. it correctly indicates field selection.

### "emit" term

| term | extant usage | semantic |
|------|--------------|----------|
| emit* | emitOwlHeader, emitSubBucket | output formatted content |
| console.* | inline calls | direct log |

"emit" prefix is the extant convention for output functions.

---

## summary

| name | extant pattern | blueprint | consistent? |
|------|----------------|-----------|-------------|
| extractPromptFromStdin | verb+Subject+From+Source | extract+Prompt+From+Stdin | yes |
| emitOnTalkReminder | emit+Subject | emit+OnTalkReminder | yes |
| 'hook.onTalk' | hook.on+Event | hook.on+Talk | yes |

---

## reflection

I verified each blueprint name against extant patterns:

1. **extractPromptFromStdin** matches `verb+Subject+From+Source` pattern from `readToolInputFromStdin` and `buildGoalFromFlags`

2. **emitOnTalkReminder** matches `emit+Subject` pattern from `emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, `emitGoalCondensed`

3. **'hook.onTalk'** matches `hook.on+Event` pattern from `'hook.onStop'`

4. **private function style** uses const + arrow syntax consistent with goal.ts

no divergence from extant conventions. no new terms that conflict with extant semantics.

