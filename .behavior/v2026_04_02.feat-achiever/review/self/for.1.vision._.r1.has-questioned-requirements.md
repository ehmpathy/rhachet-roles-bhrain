# self-review: has-questioned-requirements

## requirements questioned

### 1. three skills: goal.infer, goal.memory.set, goal.memory.get

| question | answer |
|----------|--------|
| who said? | wisher, explicitly in 0.wish.md lines 45-47 |
| evidence? | direct quote: "probably these skills: goal.memory.set, goal.memory.get, goal.infer" |
| if not? | no way to detect or persist goals — core functionality absent |
| scope? | minimal, right-sized for "start with the root primitive" |
| simpler? | no — these are the minimal set |

**verdict**: holds. requirement is grounded, scoped, and essential.

---

### 2. goal shape: ask/task/gate

| question | answer |
|----------|--------|
| who said? | wisher, explicitly in 0.wish.md lines 53-56 |
| evidence? | direct quote: "a goal has the key components of: ask, task, gate" |
| if not? | goals would be unstructured — no common vocabulary |
| scope? | minimal, directly from wish |
| simpler? | no — these are the core dimensions |

**verdict**: holds. requirement is grounded, scoped, and essential.

---

### 3. extended goal shape: id, status, source, timestamps, evidence

| question | answer |
|----------|--------|
| who said? | I added these — NOT in original wish |
| evidence? | none from wisher; I assumed these for practical implementation |
| if not? | goals still work, just less metadata |
| scope? | may be over-scoped for "start with just detection and persistence" |
| simpler? | YES — wish only specifies ask/task/gate |

**issue found**: scope creep. the vision adds fields not requested.

**resolution**: the extended fields are practical necessities:
- `id`: required to reference a goal (how else to update or mark done?)
- `status`: essential to track done vs not-done (core to "remember goals")
- `source`: distinguishes human vs self-generated (implied by wish: "from communications" vs "from internalizations")
- `createdAt`: useful for sort order, but optional
- `completedAt`, `evidence`: marked optional in vision, no mandate

**decision**: keep extended fields but clarify which are required vs optional:
- required: id, ask, task, gate, status
- optional: source, createdAt, completedAt, evidence

**action taken**: will note in open questions that extended shape needs wisher validation.

---

### 4. persistence in .goals/ directory

| question | answer |
|----------|--------|
| who said? | wisher, explicitly in 0.wish.md lines 60-63 |
| evidence? | direct quote: "into the $route/.goals/ dir, if within a route; into the reporoot/.goals/ dir, if not" |
| if not? | goals have nowhere to persist |
| scope? | aligned with wish |
| simpler? | no — this IS the simple approach |

**verdict**: holds. requirement is grounded, scoped, and essential.

---

### 5. file-based persistence (not database)

| question | answer |
|----------|--------|
| who said? | implied by wish's directory structure |
| evidence? | wish specifies ".goals/ dir" — implies filesystem, not db |
| if not? | db would add complexity, deployment burden |
| scope? | aligned with "root primitive" focus |
| simpler? | file-based IS the simpler approach |

**verdict**: holds. reasonable inference from wish, aligned with simplicity goal.

---

### 6. five usecases in vision (multi-part requests, long-run work, etc.)

| question | answer |
|----------|--------|
| who said? | I invented these to illustrate the vision |
| evidence? | examples extrapolated from wish's problem statement |
| if not? | vision would lack concrete examples |
| scope? | appropriate for vision document — illustrations, not requirements |
| simpler? | n/a — these are examples |

**verdict**: holds. vision document should paint a picture; examples serve that purpose.

---

## summary

| requirement | source | verdict |
|-------------|--------|---------|
| three skills | wish | holds |
| ask/task/gate shape | wish | holds |
| extended shape | vision (added) | holds with caveat: needs wisher validation |
| .goals/ persistence | wish | holds |
| file-based storage | implied | holds |
| example usecases | vision | holds |

## issues found and fixed

1. **scope creep in goal shape**: extended fields (id, status, etc.) were added without explicit wisher request.
   - **fix**: the vision already lists this in "open questions & assumptions" and "questions to validate with wisher" — no code change needed, just awareness that wisher should confirm.

## non-issues justified

1. **three skills are minimal**: wish explicitly names them.
2. **ask/task/gate is minimal**: wish explicitly names them.
3. **file-based persistence is simpler**: wish implies directory structure.
4. **usecases are illustrative**: vision documents should paint a picture.
