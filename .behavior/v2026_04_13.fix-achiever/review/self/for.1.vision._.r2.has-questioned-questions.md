# self-review: has-questioned-questions

## triage of open questions

### question 1: is hook escalation effective?

> should we test with real brains to see if escalate messages work?

**can this be answered via logic now?** partially. research.selfreview-effectiveness.md says messages alone have weak effect (d = 0.05). but route.drive uses escalation successfully — empirical evidence it works well enough.

**can this be answered via extant docs/code?** route.drive exists and works. we can examine its pattern.

**should this be research?** real-brain tests are empirical work. could be done later.

**verdict:** [answered] — follow route.drive's pattern. if insufficient, revisit.

**action:** update vision to mark as answered.

---

### question 2: should --scope be fully removed?

> or just deprecated with a warn?

**can this be answered via logic now?** no. this is a product decision about backward compatibility.

**does only wisher know?** yes. wisher said "discourage" but didn't specify how.

**verdict:** [wisher] — requires wisher input.

**action:** keep flagged in vision.

---

### question 3: what's the right escalation cadence?

> after how many reminders should the hook get "louder"?

**can this be answered via extant docs?** yes! the wisher said in item 4:
> "after 5 repeated blocks it makes it clearer and clearer to the brain"

the wisher specified: **5 repeated blocks**.

**verdict:** [answered] — use 5 as the cadence, per wisher's explicit statement.

**action:** update vision with answer.

---

### question 4: is deprecation the right approach? (added in previous review)

> should we remove --scope immediately?

**verdict:** [wisher] — same as question 2. requires wisher input.

**action:** already flagged in vision.

---

## updates to vision

the "questions to validate" section needs updates:

1. question 1: mark as [answered] — follow route.drive pattern
2. question 2: mark as [wisher] — keep for wisher input
3. question 3: mark as [answered] — use cadence of 5 per wisher's wish

---

## summary

| question | can answer now? | verdict |
|----------|-----------------|---------|
| is escalation effective? | yes (follow route.drive) | [answered] |
| remove or deprecate --scope? | no (wisher decision) | [wisher] |
| escalation cadence? | yes (wisher said 5) | [answered] |
| deprecation approach? | no (wisher decision) | [wisher] |

two questions answered. two require wisher input.
