# seed S23 — a gate that fires on a clock charges every session

## .said

> also, lets eliminate the term learn hook from the learner for now. lets just remove that

> and remove the achiever onStop hook too

> if not already done

## .settled

> **a stophook must fire on a CONDITION the session created, never on a clock.**

two `onStop` gates were withdrawn together, and they share one shape:

| the gate | what it fired on |
|---|---|
| learner — `learn.domain.terms --when hook.onStop` | **wall-clock staleness** (> 1 hour since the last distillation) |
| achiever — `goal.triage.infer` / `goal.triage.next` | every stop, per its own triage state |

⇒ **a clock is a property of the calendar, not of the round.** a session that declared no domain
term still met the learner's gate, because an hour had passed somewhere else. the gate could not
tell *"this round owes a distillation"* from *"an hour elapsed"*, so it charged the second and
claimed the first.

**the cost compounds where the obligation is rare.** a gate that halts every stop, to catch the
one stop in ten that owes work, spends nine interruptions to buy one.

## ⚠️ .the obligation is unchanged — only the enforcement is gone

this is a withdrawal of a **gate**, never of a **duty**. `im_an.obsessive_learner.for.domain.terms`
still holds, and a settled term is still not deferrable. what changed is that the learner reaches
for `rhx learn.domain.terms` on its own cues rather than under a halt.

⇒ 🔴 **and that is a real trade, stated rather than papered over.** a brief is rung 1 of the
entoolment ladder; a stophook is a mechanism, and a mechanism outscores a brief on a driver who
recites a rule while they break it. **the gate was withdrawn for its trigger, not for its
strength** — a condition-fired successor would be a strict improvement over both.

## 🔴 .the withdrawal has two sides, and one half is invisible

`.claude/settings.json` is what Claude Code actually fires; the role declaration is what authors
it. no boot step syncs them, so the drift runs **both ways**:

| the drift | the symptom |
|---|---|
| declared, absent from settings | the hook never fires — a dead declaration |
| 🔴 **withdrawn, still in settings** | the hook fires with no role behind it |

⇒ the second is the one a withdrawal creates, and it is silent. `getLearnerRoleHookRegistration`
already pinned the first direction; it was inverted to pin **both**, so a future withdrawal cannot
leave a live entry behind.

## .landed

- `src/domain.roles/learner/getLearnerRole.ts` — `onStop` block removed
- `src/domain.roles/achiever/getAchieverRole.ts` — `onStop` block removed
- `.claude/settings.json` — the `learn.domain.terms` Stop entry removed
- `src/domain.roles/learner/getLearnerRole.test.ts` — `[t1]` inverted to a withdrawal clamp
- `src/domain.roles/learner/getLearnerRoleHookRegistration.integration.test.ts` — pins both
  directions of the drift
- `src/domain.roles/learner/briefs/im_an.obsessive_learner.for.domain.terms.md` (+ `.min`)
