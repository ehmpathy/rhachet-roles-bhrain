# self-review: has-consistent-conventions (r8)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I searched the codebase for name patterns:
1. grep for `emit*` function names
2. grep for `*FromStdin` function names
3. grep for `hook.*` mode values

for each blueprint name, I verified consistency with extant conventions.

---

## name analysis: extractPromptFromStdin

### extant patterns (grep for *FromStdin and *From*)

| function | location | pattern |
|----------|----------|---------|
| `readToolInputFromStdin` | route.ts:955 | verb + subject + From + source |
| `buildGoalFromFlags` | goal.ts:497 | verb + subject + From + source |
| `enumFilesFromGlob` | utils/ | verb + subject + From + source |

### blueprint name

`extractPromptFromStdin` = verb + subject + From + source

### consistency check

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| pattern | verb+subject+From+source | verb+subject+From+source | yes |
| verb choice | read, build, enum | extract | valid |
| camelCase | yes | yes | yes |

**why "extract" is correct:**
- `readToolInputFromStdin` returns whole parsed object
- `extractPromptFromStdin` returns just the `.prompt` field
- "extract" semantically indicates field selection, not full read

**verdict:** consistent.

---

## name analysis: emitOnTalkReminder

### extant patterns (grep for emit*)

| function | location | pattern |
|----------|----------|---------|
| `emitOwlHeader` | goal.ts:36 | emit + subject |
| `emitSubBucket` | goal.ts:46 | emit + subject |
| `emitGoalFull` | goal.ts:61 | emit + subject + modifier |
| `emitGoalCondensed` | goal.ts:128 | emit + subject + modifier |

### blueprint name

`emitOnTalkReminder` = emit + subject

### consistency check

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| pattern | emit + subject | emit + subject | yes |
| prefix | emit | emit | yes |
| camelCase | yes | yes | yes |

**verdict:** consistent.

---

## name analysis: 'hook.onTalk' mode value

### extant patterns (grep for hook.*)

| value | location | pattern |
|-------|----------|---------|
| `'hook.onStop'` | goal.ts:439 | hook.on + Event |

### blueprint value

`'hook.onTalk'` = hook.on + Event

### consistency check

| aspect | extant | blueprint | match? |
|--------|--------|-----------|--------|
| pattern | hook.on + Event | hook.on + Event | yes |
| prefix | hook.on | hook.on | yes |
| event name | Stop | Talk | valid |

**verdict:** consistent.

---

## namespace and prefix verification

### functions added to goal.ts

| function | follows file convention? |
|----------|-------------------------|
| extractPromptFromStdin | yes (private, camelCase) |
| emitOnTalkReminder | yes (private, emit* prefix) |

### mode value added to parseArgsForTriage

| change | follows convention? |
|--------|---------------------|
| extend type union | yes (additive) |
| new value 'hook.onTalk' | yes (hook.on* pattern) |

---

## no convention divergence found

all blueprint names follow extant patterns:

| name | extant pattern | blueprint usage |
|------|----------------|-----------------|
| extractPromptFromStdin | verb+subject+From+source | consistent |
| emitOnTalkReminder | emit+subject | consistent |
| 'hook.onTalk' | hook.on+Event | consistent |

---

## reflection

I verified each new name against extant patterns in goal.ts and route.ts:
- function names follow established verb prefixes (emit*, extract*)
- the "FromStdin" suffix matches extant pattern
- mode value follows hook.on* convention

no convention divergence. the blueprint names are consistent with the codebase.

**why this holds:**

1. `extractPromptFromStdin` uses "extract" (not "read" or "get") because it selects a single field from a parsed object — semantically distinct from `readToolInputFromStdin` which returns the whole object.

2. `emitOnTalkReminder` follows the `emit*` pattern established by `emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, etc.

3. `'hook.onTalk'` follows the `hook.on*` pattern established by `'hook.onStop'` — both are Claude Code hook event names with the same prefix.

