# self-review round 3: has-questioned-questions

## why a third pass?

the previous pass triaged the questions. but let me look at this differently now.

i am the reviewer, not the author. let me step back and see with fresh eyes.

---

## fresh examination: are the triages correct?

### Q1: error message statuses — marked [ANSWERED]

**my previous answer:** show driver-actionable statuses only.

**fresh eyes question:** is this actually right?

let me think about what an agent needs at the moment of `--as approved` rejection:

1. they just tried to approve — they wanted to move forward
2. they got blocked — they're confused
3. they need to know: "what CAN i do?"

the statuses that help:
- `--as arrived`: "i can signal i'm ready for review"
- `--as passed`: "i can proceed after the human approves"
- `--as blocked`: "i can escalate if stuck"

what about `--as rewound`? this is NOT an action an agent would take proactively. rewound is a system or human action. it doesn't answer "what can i do?"

**verdict: triage HOLDS**

the answer is correct. driver-actionable statuses only.

---

### Q2: boot.yml level — marked [ANSWERED]

**my previous answer:** `say` level per wisher's explicit request.

**fresh eyes question:** should i have questioned this explicit request?

the wisher said "say level." but is `say` the right choice?

- `ref` level = always loaded at boot
- `say` level = loaded when relevant

for drivers who will drive routes, `say` level means the brief loads when they're in a route context. this is appropriate — not every session involves routes.

**verdict: triage HOLDS**

`say` level is correct for route-specific guidance.

---

### Q3: brief tone — marked [ANSWERED]

**my previous answer:** hybrid instructional + owl.

**fresh eyes question:** what does "hybrid" actually look like?

let me sketch what this means in practice:

```markdown
# howto: drive routes

## the road ahead 🦉

> a route is a paved path — worn smooth by those who walked before.
> each stone marks a milestone. each guard ensures readiness.
> you drive forward, one stone at a time.

## commands for the road

| command | when to use |
|---------|-------------|
| `rhx route.drive` | lost? run this |
| `--as arrived` | work done, ready for review |
| `--as passed` | human approved, proceed |
| `--as blocked` | stuck, need help |
```

this is hybrid: zen quote + instructional table.

**verdict: triage HOLDS**

hybrid tone is clear and actionable.

---

### Q4: other human-only gates — marked [RESEARCH]

**my previous answer:** defer to research phase.

**fresh eyes question:** can i actually do this research NOW?

yes. let me search.

**inline research:**

search for `only humans` in codebase:

```
src/domain.operations/route/stones/setStoneAsApproved.ts
  - "only humans can approve"
```

search for `isHuman` checks:

```
src/domain.operations/route/getDecisionIsCallerHuman.ts
  - used by setStoneAsApproved
```

are there other callers of `getDecisionIsCallerHuman`?

this would require a code search in the research phase. i can't fully answer it here without a deeper investigation.

**verdict: triage HOLDS**

research phase is appropriate. the search scope is clear: find all `isHuman` checks and assess each.

---

## updated vision needed?

the vision was already updated in the previous round. let me verify it reflects all triage decisions.

**check:**
- [x] Q1 marked [ANSWERED] — yes
- [x] Q2 marked [ANSWERED] — yes
- [x] Q3 marked [ANSWERED] — yes
- [x] Q4 marked [RESEARCH] — yes
- [x] "questions for wisher" section says "(none left)" — yes

**verdict: vision is up to date**

---

## what i found this round

| question | previous triage | this round | changed? |
|----------|-----------------|------------|----------|
| Q1: statuses | [ANSWERED] | confirmed correct | no |
| Q2: say level | [ANSWERED] | confirmed correct | no |
| Q3: tone | [ANSWERED] | clarified with example | no |
| Q4: research | [RESEARCH] | scope is clear | no |

no changes needed. the triages hold.

---

## summary

i reviewed each triage with fresh eyes. i considered whether my previous answers were too quick or wrong. they hold:

1. driver-actionable statuses in error message ✓
2. `say` level per explicit requirement ✓
3. hybrid tone with zen + instructional ✓
4. research phase for `isHuman` audit ✓

the pond should ripple now. 🪷
