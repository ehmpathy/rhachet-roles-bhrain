# self-review r2: has-questioned-assumptions

## what i found

i was question the wisher's requirements instead of question my own assumptions.

the guide asks: "are there any hidden assumptions the junior took as requirements?"

i (the junior) added several design decisions to the vision that the wisher never asked for.

---

## issue 1: "quick goals" mitigation (found and fixed)

**the assumption:** simple asks need simplified goals.

**what i wrote in vision:** "mitigation: allow 'quick goals' that auto-fill some fields?"

**did wisher say this?** no. wisher asked for clearer messages, not simpler goals.

**what evidence supports this?** none. i assumed structure was "heavy".

**what if opposite were true?** even trivial asks deserve structured thought. "fix the typo" can have:
- why.ask: fix the typo
- why.purpose: code quality
- why.benefit: fewer reader confusions
- what.outcome: typo is gone
- how.task: find and fix
- how.gate: no typo remains

**how i fixed it:** removed the "quick goals" suggestion. changed to:
> **resolution**: accept the overhead as the cost of accountability. even trivial asks deserve structured thought.

---

## issue 2: "one inflight goal at a time" (found and fixed)

**the assumption:** brains should focus on one goal.

**what i wrote:** "brain does the work (one inflight goal at a time)"

**did wisher say this?** no.

**what evidence supports this?** none. i assumed focus requires single-task.

**what if opposite were true?** brains may legitimately context-switch between multiple inflight goals.

**how i fixed it:** removed the constraint. now says:
> 3. **work** (t+1m to t+Nm): brain does the work

---

## issue 3: "batch triage" (found and fixed)

**the assumption:** rapid-fire asks need batch triage.

**what i wrote:** "batch triage is acceptable when multiple asks arrive in quick succession"

**did wisher say this?** no.

**what evidence supports this?** none. i assumed immediate triage might overwhelm.

**what if opposite were true?** immediate triage per ask is simpler and clearer.

**how i fixed it:** removed the note entirely.

---

## issue 4: "force articulation" requirement (found and fixed)

**the assumption:** escalation alone won't work; need behavioral scaffold.

**what i wrote:** "escalation must include behavioral scaffold"

**did wisher say this?** no. wisher asked for escalation "like route.drive" (item 4).

**what evidence supports this?** research.selfreview-effectiveness.md says messages have weak effect.

**what if opposite were true?** maybe route.drive's pattern is sufficient. research may not apply here.

**how i fixed it:** softened to "future consideration":
> **future consideration**: research shows that messages alone have weak effect (d = 0.05). if escalation proves insufficient, consider behavioral scaffold...
> for now: match route.drive's pattern first, then evaluate if more is needed.

---

## issue 5: deprecation strategy (found and flagged)

**the assumption:** deprecate before remove is the right approach.

**what i wrote:** "deprecate first, remove in next major"

**did wisher say this?** wisher said "discourage --scope repo" but didn't specify how.

**what evidence supports this?** semver convention. but wisher may prefer immediate removal.

**how i fixed it:** flagged as question for wisher:
> **question for wisher**: is deprecation the right approach, or should we remove --scope immediately?

---

## non-issues: why they hold

### `.blockers.latest.json` path

**the assumption:** escalation needs a blockers file like route.drive.

**did wisher say this?** yes. wisher explicitly referenced "like route.drive has a blockers.json" (item 4).

**verdict:** holds. directly requested.

---

## summary

| assumption | source | verdict | action |
|------------|--------|---------|--------|
| quick goals | me | issue | removed |
| one inflight | me | issue | removed |
| batch triage | me | issue | removed |
| force articulation | me + research | issue | softened |
| deprecation | me | uncertain | flagged for wisher |
| blockers.json | wisher | holds | kept |

five issues found. four fixed. one flagged for wisher input.

---

## what i learned

the review is the work. when i rush to pass the gate, i add scope creep that undermines the vision. simpler is better. match the wish first.
