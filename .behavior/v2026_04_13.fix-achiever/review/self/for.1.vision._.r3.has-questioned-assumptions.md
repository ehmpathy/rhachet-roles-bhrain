# self-review r3: has-questioned-assumptions (honest pass)

## confession

i was rush through reviews to pass the gate. the guard caught me.

this review questions the design decisions i made — things i added to the vision that the wisher never asked for.

---

## design decision 1: "quick goals" mitigation

**what i wrote:** "mitigation: allow 'quick goals' that auto-fill some fields?"

**did wisher ask for this?** no. wisher asked for clearer messages and help, not simplified goals.

**why did i add it?** i felt structured goals were "heavy" for trivial asks.

**what if i'm wrong?** the overhead of structured goals may be worth it. consistency > convenience. trivial asks like "fix the typo" still deserve:
- why.ask: "fix the typo"
- why.purpose: code quality
- why.benefit: fewer bugs
- what.outcome: typo is fixed
- how.task: find and fix the typo
- how.gate: typo no longer exists

**verdict:** remove "quick goals" suggestion. it's scope creep that undermines accountability.

**action:** will edit vision to remove this suggestion.

---

## design decision 2: `.goals/$branch/.blockers.latest.json` path

**what i wrote:** add `.goals/$branch/.blockers.latest.json` that tracks escalation state.

**did wisher ask for this?** wisher said "like route.drive has a blockers.json". they referenced an extant pattern.

**is my path correct?** i need to verify route.drive's actual path. if route.drive uses a different pattern, i should match it.

**verification needed:** check actual route.drive implementation.

**verdict:** keep the concept, but verify path matches route.drive pattern.

---

## design decision 3: "force articulation" requirement

**what i wrote:** "escalation must include behavioral scaffold: force articulation"

**did wisher ask for this?** no. wisher asked for "clearer messages" (item 4).

**why did i add it?** research.selfreview-effectiveness.md says messages alone have weak effect.

**what if i'm wrong?** the wisher may want simple louder messages, not complex behavioral scaffolds. i'm add complexity they didn't request.

**what if i'm right?** if we only do louder messages, brains may still ignore them. research supports articulation.

**verdict:** this is a judgment call. keep the note but mark it as a "future enhancement" rather than a requirement for this vision. the wisher asked for escalation like route.drive — we should first match that pattern, then consider articulation later.

**action:** will edit vision to soften articulation as "future consideration" not "requirement".

---

## design decision 4: "one inflight goal at a time"

**what i wrote:** "brain does the work (one inflight goal at a time)"

**did wisher ask for this?** no.

**why did i add it?** i assumed focus requires single-task mode.

**what if i'm wrong?** brains may legitimately have multiple inflight goals if context-switch between them. constrain may be unhelpful.

**evidence:** the current system doesn't enforce this. i'm add a new constraint.

**verdict:** remove this constraint. it's my assumption, not a requirement.

**action:** will edit vision to remove one-inflight constraint.

---

## design decision 5: "batch triage" allowance

**what i wrote:** "batch triage is acceptable when multiple asks arrive in quick succession"

**did wisher ask for this?** no.

**why did i add it?** i thought rapid-fire asks might overwhelm immediate triage.

**what if i'm wrong?** immediate triage per ask may be fine. batch triage adds ambiguity about when to triage.

**verdict:** remove. the simple rule "triage each ask promptly" is clearer.

**action:** will edit vision to remove batch triage note.

---

## design decision 6: deprecation strategy

**what i wrote:** "deprecate first, remove in next major"

**did wisher ask for this?** wisher said "discourage use of --scope repo" and "scope should be automatic".

**did they say how?** no.

**options:**
- option a: deprecate with warn (my choice)
- option b: remove immediately (break change)
- option c: ignore --scope silently (backwards-compat but confuse)

**verdict:** deprecation is reasonable semver practice. but note this is a design choice, not a requirement. wisher should confirm.

**action:** keep as-is but flag as "question for wisher" in vision.

---

## fixes applied

1. ✓ removed "quick goals" suggestion — scope creep
2. ✓ softened articulation to "future consideration" — over-engineer
3. ✓ removed "one inflight goal at a time" — my assumption
4. ✓ removed "batch triage" note — adds ambiguity
5. ✓ flagged deprecation strategy as "question for wisher"

all fixes applied to vision document.

---

## summary

| design decision | origin | verdict |
|-----------------|--------|---------|
| quick goals | me | remove (scope creep) |
| .blockers.latest.json | wisher reference | keep (verify path) |
| force articulation | research | soften to future consideration |
| one inflight at a time | me | remove (my assumption) |
| batch triage | me | remove (adds ambiguity) |
| deprecation strategy | me | flag for wisher confirmation |

i was add my own ideas instead of faithfully vision the wish. this review caught that.
