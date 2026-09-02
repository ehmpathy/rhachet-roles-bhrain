# fulcrum F22 — the second-opinion rule was filed in the driver, though its subject is review

| field | value |
|---|---|
| **the fork** | A: **reviewer** — the rule is about peer review · B: **driver** — the rule is about when to place the call |
| **taken, and why** | **B.** the reviewer is the peer **phoned**, never the one who phones — and a rule about when to escalate belongs with the caller. it is the last rung of the ladder `rule.always.spend-own-levers-before-escalation` sorts |
| **rework** | **clean** — a move between roles is a file move plus two `boot.yml` lines |
| **status** | best-guessed |
| **where** | `src/domain.roles/driver/briefs/rule.always.get-a-second-opinion-before-foreman.md` |
| **confidence** | **~88%** |

## .why it is a genuine fork

the filename reads as a **review** rule, and its whole mechanism is the reviewer's
enroll-review-parse flow. a reader who greps the reviewer role for *"second opinion"* finds no
match — which is the cost of the call.

seed **S13** settled the general principle for a different pair, and it is the reason this went to
the driver:

> a rule belongs with the **caller**, not with the subject it acts upon.

⇒ so the call follows a settled seed rather than a fresh guess. **that is what keeps the confidence
at 88 rather than lower.**

## 🔴 .the evidence against it is behavioral, and it is mine

**the rule was moved into the driver role this session, by me, and then i ran zero peer reviews
across six rounds.** the pavement was read, edited, re-filed — and walked beside.

⚠️ **that is not proof the placement is wrong.** a rule can be correctly filed and still unread.
but it is the only outcome data available, and it is negative: the one actor who knew exactly where
the rule sat did not reach for it.

⇒ recorded in `progress.2026-08-30.md`, round 6. `rule.require.specialize-a-rule-its-readers-look-past`
— also written this round — says the repair for a rule a reader looks past is a **specialization in
the reader's own domain**, never a louder `.what`. that rule may fire on this one.

## .what would settle it

- a reviewer who greps their own role for the escalation discipline and finds no match → the
  reviewer wants a specialization that points at the driver's copy
- a driver who reaches for it unprompted → the placement holds
- 🔴 **note the asymmetry:** the first outcome is observable in one grep. the second needs a round
  where a driver both faced an escalation and recorded that they consulted it
