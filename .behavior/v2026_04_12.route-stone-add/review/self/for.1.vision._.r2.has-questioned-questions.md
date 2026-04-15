# self-review r2: has-questioned-questions

stone: 1.vision
reviewer: mechanic
round: 2 (post-wisher-feedback)
date: 2026-04-12

---

## pause and breathe

i re-read the vision's open questions section. the wisher has now answered all questions. let me verify the triage is correct.

---

## questions triaged

### 1. should `--route` be auto-detected only, or also accept explicit path?

**status:** [answered]

**wisher feedback:** "auto detect just like the other route.stone operations do"

**answer:** follow extant pattern via `resolveRouteFromBind()`, accept explicit `--route` override.

**vision updated:** yes, question marked [answered] with implementation details.

---

### 2. should guards be addable too?

**status:** [answered]

**wisher feedback:** "no guards for now too"

**answer:** no, stones only for now.

**vision updated:** yes, question marked [answered].

---

### 3. should we validate stone position relative to current stone?

**status:** [answered]

**wisher feedback:** "yep, no validation" and "no validation, no guards"

**answer:** no validation — let driver pick position.

**vision updated:** yes, question marked [answered].

---

## research items triaged

### 1. enumerate available templates

**old status:** [research]

**new status:** [answered]

**why:** wisher specified path-based templates via `template($behavior/refs/...)`. no enumeration needed.

**vision updated:** yes, marked [answered].

---

### 2. understand stone order semantics

**status:** [research]

**still needed?** yes, for implementation. but not a blocker for vision.

**vision status:** remains as [research] for blueprint phase.

---

### 3. review how route.drive auto-detects bound route

**status:** [answered]

**answer:** uses `getRouteBindByBranch({ branch: null })` pattern.

**vision updated:** yes, marked [answered].

---

## verification

i re-read the vision's "questions for wisher" section:

```markdown
### questions for wisher

1. [answered] should `--route` be auto-detected only, or also accept explicit path?
2. [answered] should guards be addable too?
3. [answered] should we validate stone position relative to current stone?
```

all questions are now [answered]. **correct.**

i re-read the "research needed" section:

```markdown
### research needed

- [x] [answered] templates are path-based, no enumeration needed
- [ ] [research] understand stone order semantics (can you add before current?)
- [x] [answered] review how `route.drive` auto-detects bound route
```

triage is correct. one research item remains for implementation phase.

---

## summary

all wisher questions are now [answered]. one research item remains for blueprint phase (stone order semantics). triage is complete and correct.

| question | status |
|----------|--------|
| --route auto-detect | [answered] |
| guards addable | [answered] |
| position validation | [answered] |
| template enumeration | [answered] |
| stone order semantics | [research] |
| route auto-detect pattern | [answered] |

no issues found.
