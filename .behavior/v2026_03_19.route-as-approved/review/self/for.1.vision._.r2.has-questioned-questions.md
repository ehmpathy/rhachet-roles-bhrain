# self-review: has-questioned-questions

## open questions from the vision

### questions to validate with wisher

#### Q1: should the error message include ALL statuses or just the most relevant ones?

**triage:**
- can this be answered via logic now?

yes. the error should include only the statuses a driver can USE to make progress:
- `--as arrived` (signal ready for review)
- `--as passed` (proceed after approval)
- `--as blocked` (escalate)

statuses like `--as rewound` are typically system/human-initiated, not driver actions. include them in boot.yml brief for completeness, not in the error message.

**verdict: [ANSWERED]**

the error message shows driver-actionable statuses. the boot.yml brief can be comprehensive.

---

#### Q2: should the boot.yml brief be `say` level or `ref` level?

**triage:**
- does only the wisher know the answer?

the wisher explicitly said "create a **say** level boot.yml brief" in the wish.

**verdict: [ANSWERED]**

`say` level. this is an explicit requirement, not a question.

---

#### Q3: what tone should the brief use — instructional or zen philosophical?

**triage:**
- does only the wisher know the answer?

the wisher said: "craft the brief from the perspective of 'as a driver' and 'when on the road'" and "don't forget to drop your iam owl zen wisdom, too"

this suggests BOTH: instructional (clear commands) WITH zen philosophical overlay (owl wisdom).

**verdict: [ANSWERED]**

hybrid tone: instructional content, owl vibe. this matches the wisher's explicit guidance.

---

### questions to research

#### Q4: are there other places where similar "human-only" blocks could benefit from driver guidance?

**triage:**
- can this be answered via extant docs or code now?

yes, i can search the codebase for other "only humans" patterns.

let me check the code now...

**research (answered inline):**

from my earlier search, I found `setStoneAsApproved.ts` has this pattern:
```typescript
reason: 'only humans can approve',
guidance: 'please ask a human to run this command',
```

the question is: are there OTHER human-only gates?

possibilities:
- `--as approved` (confirmed)
- route bind? (unknown — would need to check)
- other guard-related actions? (unknown)

**verdict: [RESEARCH]**

this should be answered in the research phase. search for other places with similar patterns:
- search for `only humans` in codebase
- search for `isHuman` checks
- identify if any need similar guidance improvements

---

## updated vision section

the vision's "open questions & assumptions" section should be updated to reflect this triage:

```markdown
### questions resolved

1. **error message statuses**: show driver-actionable statuses only (`arrived`, `passed`, `blocked`). boot.yml can be comprehensive.

2. **boot.yml level**: `say` level (explicit requirement from wisher).

3. **brief tone**: hybrid — instructional content with owl wisdom overlay.

### questions for research phase

1. **other human-only gates**: search codebase for other `only humans` or `isHuman` patterns that could benefit from similar guidance improvements.

### questions for wisher

(none left — all triaged)
```

---

## action: update the vision

i will update the vision to reflect this triage.

---

## summary

| question | triage | resolution |
|----------|--------|------------|
| Q1: which statuses in error | [ANSWERED] | driver-actionable only |
| Q2: say vs ref level | [ANSWERED] | say (explicit requirement) |
| Q3: tone | [ANSWERED] | hybrid instructional + owl |
| Q4: other human-only gates | [RESEARCH] | search in research phase |

three questions answered via logic and explicit requirements. one question deferred to research phase.
