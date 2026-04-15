# self-review r4: has-questioned-assumptions

stone: 3.3.1.blueprint.product
reviewer: mechanic
round: 4 (deeper dive)
date: 2026-04-12

---

## pause and breathe

let me look for assumptions i may have missed in round 3.

---

## additional assumptions to question

### assumption 7: template() syntax is correct

**what we assume:** `template($behavior/refs/...)` is the right syntax

**evidence:**
- vision shows: `--from template($behavior/refs/.research.adhoc.template.stone)`
- parentheses wrap the path

**what if opposite?** could use different syntax: `@template:$behavior/refs/...`

**verdict:** vision mandates this syntax. cannot change.

---

### assumption 8: mode defaults to 'plan'

**what we assume:** default mode is 'plan' (preview, no changes)

**evidence:**
- vision states: "plan = preview (default)"
- consistent with route.stone.del which also defaults to plan
- safer default (preview before modify)

**what if opposite?** default to 'apply'

**verdict:** assumption is valid. plan-first is safer and follows extant pattern.

---

### assumption 9: error messages are the right text

**what we assume:** error message text is correct

**evidence:**
- vision edgecases section shows exact error messages
- "stone already exists; use different name or `route.stone.del` first"
- "no route bound; use `rhx route.bind.set` first"

**what if opposite?** different phrasing

**verdict:** vision mandates these messages. cannot deviate.

---

### assumption 10: .stone extension is correct

**what we assume:** stone files have `.stone` extension

**evidence:**
- all extant stones use `.stone` extension
- vision shows: "stone file is created at $route/3.1.6.research.custom.stone"

**what if opposite?** different extension

**verdict:** assumption follows extant pattern and vision. valid.

---

### assumption 11: content is written as-is

**what we assume:** content from source is written to stone file without modification

**evidence:**
- vision shows stdin content piped directly to stone
- no mention of content transformation

**what if opposite?** transform content (e.g., add header)

**verdict:** vision shows direct write. no transformation mentioned. valid.

---

## cross-check with extant code

re-read stepRouteStoneDel to verify pattern alignment:

| aspect | stepRouteStoneDel | stepRouteStoneAdd (blueprint) |
|--------|------------------|------------------------------|
| mode branch | plan vs apply | same |
| route validation | fs.access | same |
| error type | BadRequestError | same |
| output format | formatRouteStoneEmit | same |
| return shape | { stones, emit } | similar (adapted for add) |

**all patterns align with extant code.**

---

## summary

| assumption | round 3 | round 4 |
|------------|---------|---------|
| numeric prefix | ✓ valid | — |
| $behavior expansion | ✓ valid | — |
| fs.writeFile | ✓ valid | — |
| getAllStones | ✓ valid | — |
| stdin at cli | ✓ valid | — |
| separate files | ✓ valid | — |
| template() syntax | — | ✓ valid |
| mode default | — | ✓ valid |
| error messages | — | ✓ valid |
| .stone extension | — | ✓ valid |
| content as-is | — | ✓ valid |

**11 assumptions questioned across two rounds. all valid.**

---

## what held

round 4 confirms: no hidden assumptions conflict with evidence. the blueprint follows extant patterns and vision mandates.
