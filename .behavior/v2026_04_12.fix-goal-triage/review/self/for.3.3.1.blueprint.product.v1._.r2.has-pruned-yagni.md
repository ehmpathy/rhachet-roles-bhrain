# self-review r2: has-pruned-yagni

## YAGNI review

for each component in the blueprint, ask: was this requested? is this the minimum viable way?

---

## component 1: actionable command per incomplete goal

**requested?** yes. wisher said: "it should tell them how to complete the goals"

**minimum viable?** yes. shows first absent field only. could show all fields but wisher confirmed one-at-a-time approach.

**verdict**: keep.

---

## component 2: rename `--mode` → `--when`

**requested?** yes. wisher said: "its a new convention we've adopted"

**minimum viable?** yes. hard break is simpler than alias maintenance.

**verdict**: keep.

---

## component 3: skill rename `goal.infer.triage` → `goal.triage.infer`

**requested?** yes. wisher said: "they should be symmetric"

**minimum viable?** yes. rename shell file + function. no abstraction added.

**verdict**: keep.

---

## component 4: fix status.choice partition

**requested?** yes. wisher asked: "how is it possible that goal.triage.infer can consider a goal with status=incomplete as complete?"

**minimum viable?** yes. two-line change in getTriageState.ts. no abstraction added.

**verdict**: keep.

---

## component 5: per-goal tip in goal.triage.next

**requested?** yes. wisher said: "just have a subbranch under each (1), (2) under status that says `tip: run ...`"

**minimum viable?** yes. add one line per goal in output.

**verdict**: keep.

---

## component 6: test coverage tables

**requested?** yes. wisher said: "ensure thorough positive and negative test coverage on all of these edgecases"

**minimum viable?** yes. tests enumerate expected scenarios. no extra abstraction.

**verdict**: keep.

---

## component 7: implementation order section

**requested?** not explicitly, but standard blueprint practice.

**minimum viable?** yes. simple numbered list. helps execution avoid broken intermediate states.

**verdict**: keep. standard practice, no extra complexity.

---

## extras check

**did we add abstraction "for future flexibility"?** no.

**did we add features "while we're here"?** no.

**did we optimize before it was needed?** no.

---

## summary

all components trace to wisher requirements. no YAGNI violations found.

