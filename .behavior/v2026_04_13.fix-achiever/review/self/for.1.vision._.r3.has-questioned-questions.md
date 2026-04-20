# self-review r3: has-questioned-questions

## what i found

i triaged all questions in the vision — explicit and implicit.

the vision had 8 questions total:
- 3 explicit in "questions to validate"
- 1 explicit "question for wisher" buried in another section
- 3 implicit from the assumptions
- 1 meta-question about external research

---

## issues found and fixed

### issue 1: assumptions lacked triage markers

**what was wrong:** the assumptions section listed 3 items without triage markers. these are implicit questions that need [answered], [research], or [wisher] status.

**how i fixed it:** added triage markers to each assumption:
- assumption 1: [answered] — route.drive validates empirically
- assumption 2: [wisher] — tradeoff needs wisher confirmation
- assumption 3: [answered] — logic is deterministic, edge case accepted

### issue 2: "question for wisher" was scattered

**what was wrong:** line 211 had a "question for wisher" that wasn't in the questions section. duplicated question 2.

**how i fixed it:** consolidated by reference:
- changed line 211 to "(see question 2 in 'questions to validate' section)"

### issue 3: assumption 2 was not in questions list

**what was wrong:** "are structured goals worth the overhead?" was only an assumption, not a question.

**how i fixed it:** added as question 4:
> 4. **are structured goals worth the overhead?** [wisher] — requires wisher to confirm tradeoff is acceptable.

---

## non-issues: why they hold

### question 1: is hook escalation effective?

**why it holds as [answered]:** route.drive uses this exact pattern. it's empirical proof. if we find it insufficient later, we can revisit — but we don't need research now.

### question 2: should --scope be fully removed?

**why it holds as [wisher]:** the wisher said "discourage" but gave no guidance on how. this is a backward compatibility decision that requires stakeholder input.

### question 3: what's the right escalation cadence?

**why it holds as [answered]:** the wisher explicitly said "after 5 repeated blocks" in item 4 of the wish. the answer was in the wish all along.

### question 4: are structured goals worth the overhead?

**why it holds as [wisher]:** this is a value judgment. the wisher implicitly said "yes" by want goals to work, but explicit confirmation is wise.

### assumption 1: brains will respond to hooks

**why it holds as [answered]:** route.drive is empirical proof. hooks work when combined with escalation.

### assumption 3: automatic scope is always correct

**why it holds as [answered]:** `getRouteBindByBranch()` is deterministic. the only edge case (user wants repo scope while bound to route) is rare enough that we can accept the constraint.

### external research needed?

**why it holds as [answered] (none needed):** the wish is clear. route.drive provides the pattern. no external research required.

---

## summary

| item | status | action |
|------|--------|--------|
| assumptions lacked markers | issue | fixed — added markers |
| scattered question for wisher | issue | fixed — consolidated |
| assumption 2 not in questions | issue | fixed — added as question 4 |
| question 1 triage | holds | [answered] via route.drive |
| question 2 triage | holds | [wisher] — product decision |
| question 3 triage | holds | [answered] via wish |
| question 4 triage | holds | [wisher] — value judgment |
| assumption 1 | holds | [answered] via route.drive |
| assumption 3 | holds | [answered] — deterministic |
| external research | holds | [answered] — none needed |

3 issues found and fixed. 7 non-issues explained why they hold.
