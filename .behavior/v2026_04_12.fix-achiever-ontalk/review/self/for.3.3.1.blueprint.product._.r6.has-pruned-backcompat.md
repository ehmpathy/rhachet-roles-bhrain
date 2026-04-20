# self-review: has-pruned-backcompat (r6)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I paused. I re-read:
1. the wish document line by line
2. the blueprint line by line
3. the original vision document from `v2026_04_02.feat-achiever`

for each element in the blueprint, I asked:
- does this preserve any backward compatibility?
- if yes, was that preservation explicitly requested?
- or was it assumed "to be safe"?

---

## deep scan for backcompat concerns

### scan 1: blueprint acceptance criteria map (lines 229-237)

| criterion | implementation |
|-----------|----------------|
| reads stdin and calls setAsk | extractPromptFromStdin + setAsk call |
| ask appended with content hash | setAsk already does this |
| output is short reminder | emitOnTalkReminder |
| exits 0 | explicit return after reminder |
| **onStop behavior unchanged** | **no changes to onStop branch** |

**found:** one backcompat concern: "onStop behavior unchanged"

**trace to wish:** wish line 88:
> - [ ] extant `hook.onStop` behavior unchanged

**verdict:** explicitly requested.

---

### scan 2: blueprint filediff tree (lines 16-27)

```
src/
├── contract/
│   └── cli/
│       └── [~] goal.ts                    # add hook.onTalk mode
│
└── domain.operations/
    └── goal/
        └── [○] setAsk.ts                  # retain: already works, just needs to be called
```

**symbols:**
- `[~]` = modify
- `[○]` = retain (no change)

**found:** `setAsk.ts` marked as "retain: already works, just needs to be called"

**is this backcompat?** no. this is reuse of extant functionality, not preservation for compatibility. the function works and we call it. no compatibility concern here.

---

### scan 3: blueprint codepath tree (lines 31-76)

```
├── [○] goalTriageInfer
│   ├── [○] parse args
│   ├── [○] get scopeDir
│   │
│   ├── [+] hook.onTalk mode branch (NEW)
│   │   ...
│   │
│   ├── [○] hook.onStop mode branch (retain)
│   └── [○] triage mode branch (retain)
```

**found:** two branches marked `[○] retain`:
- `hook.onStop mode branch`
- `triage mode branch`

**is hook.onStop retention explicitly requested?** yes. wish line 88.

**is triage retention explicitly requested?** no explicit mention.

**but is triage retention actually backcompat?**

analysis:
- we add a new branch for `hook.onTalk`
- the mode union changes from `'triage' | 'hook.onStop'` to `'triage' | 'hook.onStop' | 'hook.onTalk'`
- the triage and onStop branches are untouched
- this is not "backwards compatibility" — this is simply not touched code that doesn't need to be touched

**verdict:** triage branch is not preserved for compatibility. it's simply not part of this change. no backcompat concern.

---

### scan 4: mode type union change (line 36)

> mode type union: 'triage' | 'hook.onStop' → 'triage' | 'hook.onStop' | 'hook.onTalk'

**analysis:**
- extant modes remain valid
- new mode is added
- this is a union extension, not a modification

**is this backcompat?** no. union extension is additive. callers who pass `'triage'` or `'hook.onStop'` continue to work. no special preservation needed.

---

### scan 5: stdin format handle (lines 82-102)

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
    return null; // malformed JSON → silent skip
  }
};
```

**is this backcompat?**

analysis:
- this function is NEW
- it handles the specific stdin format from Claude Code UserPromptSubmit hooks
- it's not compatible with any old format because there is no old format
- the graceful degradation (return null on error) is for robustness, not backwards compatibility

**verdict:** no backcompat concern. graceful error handle is not the same as backwards compatibility.

---

## explicit vs implicit backcompat

| type | description | in blueprint? |
|------|-------------|---------------|
| explicit | wisher requested it | yes (onStop) |
| implicit | assumed "to be safe" | no |
| assumed | added without request | no |

the only backcompat concern is explicit and requested.

---

## what if triage behavior changed?

hypothetically, if the blueprint modified triage mode, would that require explicit backcompat request?

- triage mode is used by `rhx goal.triage.infer` (no --when flag)
- if we changed its behavior, that would break user workflows
- but we are NOT making changes to it
- the blueprint correctly leaves it alone

this is not backcompat preservation — this is simply scope discipline. we only change what the wish asks us to change.

---

## reflection

I scanned every line of the blueprint for backcompat concerns. I found exactly one: "onStop behavior unchanged."

I traced it to wish line 88: "extant `hook.onStop` behavior unchanged."

this concern is explicitly requested by the wisher. it is not assumed "to be safe."

all other retention in the blueprint is scope discipline (not touched what doesn't need to be touched), not backwards compatibility preservation.

no backcompat concerns require removal.

