# fulcrum F16 — the `get` that writes keeps its name

- **case** = F16
- **title** = the `get` that writes keeps its name
- **rework** = clean
- **status** = OPEN
- **confidence** = 80%
- **raised** = 2026-09-18, by the `arch-hazards-behavior` peer review (nitpick.2) on
  `5.1.execution.from_vision`

## .the fork, stated fairly

`getSelfReviewChallengeDecision` is named as a query and performs three writes:
`findsertReviewSelfGitignore`, then `setSelfReviewTriggeredReport`, which mints the `.since` ask
marker and claims `.uptil` with an atomic `wx` create.

`rule.require.get-set-gen-verbs` gives `get` exactly one guarantee — *"get guarantees no side effects
(the one pure axis)"* — and this breaks it three ways. 🔴 **the third write carries the gate**: the
`.uptil` claim is what decides whether the haste cue fires, so a caller who reads the name as a query
and calls it twice burns the claim and retires a driver's confrontation in silence.

🟡 **the shape is EXTANT.** `git show HEAD:` on the file shows both writes already imported before
this round opened; `c27ff1b` introduced it. what this round did was **add** the `.uptil` claim, which
makes the misnomer costlier than it was.

| | A — rename to `genSelfReviewChallengeVerdict` | B — split pure read from write | ✅ C — keep the name, catch a dream |
|---|---|---|---|
| satisfies the rule | ✅ `gen` is findsert, which is what it does | ✅ fully — a caller may choose the pure form | 🔴 no. the misnomer stands |
| code call sites touched | 4, plus a test, plus a `git mv` | 4, plus a test, plus a contract split | naught |
| 🔴 **prose cites left stale** | **84**, across a dozen historical routes | 84 | naught |
| reintroduces this round's race? | no | 🔴 **it can.** a verdict computed BEFORE the write is back to the racy count — a split must hand the claim from writer to reader | no |
| this round's deliverable count | 4 → 5 | 4 → 5 | 4 |
| the deferral on the record | — | — | ✅ a dream, symlinked at the route |

## .taken, and why AT THE TIME

**C — keep the name, catch the rename as a dream, and record this fulcrum.**

the SAFE/CLEAN test of `rule.always.fix-forward-under-scouts-honor` splits:

- **SAFE ✅** — a rename moves no behavior, and four call sites is a mechanical change
- 🔴 **CLEAN — no.** `grep getSelfReviewChallengeDecision` returns **88 files**. four are code; the
  other **84 are behavior-route prose** across a dozen historical routes, each an immutable record of
  what a past round found. a rename leaves 84 stale cites, or rewrites 84 archaeological documents —
  and `rule.require.archaeology-in-notes` forbids the second outright

⇒ **that 84 is the whole reason.** the rule's own CLEAN question is *"does it land in the diff you
already have, or does it ripple into files this change never intended to open?"* — and a dozen
closed routes is the clearest *yes* this round has met.

🟡 **what is conceded inside the refusal.** the lane is right on the rule, right on the mechanism, and
right that the round raised the stakes: the `.uptil` claim is new, and it is the write a mis-read of
the name most endangers. ⇒ this is not a defence of the name. **it is a claim about which round should
carry its repair**, and the dream holds the full recipe plus the one constraint a split must honor.

## .rework, and why

**clean.** naught is built on the deferral: the rename is additive whenever it is taken, the four
call sites do not move, and the dream carries the target name, the split alternative, and the race
constraint that bounds it.

## .confidence, and why it is 80% rather than higher

1. 🔴 **the 84 cites are prose, and a council may rule that prose cites simply go stale.** an
   archaeological document already names a world that moved on; if a stale operation name is
   acceptable archaeology, option A is nearly free and my whole case evaporates
2. **the rule's severity is blocker**, and I defer it on a reviewer's nitpick grade. two graders, two
   answers — `rule.forbid.overzealous-blockers` says severity measures harm rather than correctness,
   and the lane applied that correctly, but a council that reads the rule's own header sees a blocker
3. the drive both wrote the new `.uptil` claim into this operation and graded its own deferral of the
   rename it made costlier

what holds it at 80%: **84 files across a dozen closed routes** is not a judgment call about ripple
cost — it is a count, and it is on the far side of any reasonable line.

## .where

- the operation: `src/domain.operations/route/guard/review/self/getSelfReviewChallengeDecision.ts`
- the rule: `rule.require.get-set-gen-verbs` (ehmpathy/mechanic)
- the dream: `.dream/v2026_09_18.fix.a-get-named-operation-adjudicates-and-writes.md`, symlinked at
  `$route/dreams/`
- the concern: `…r007._.given.by_peer.arch-hazards-behavior.report.md` nitpick.2
- the answer: `…r007._.taken.by_self.arch-hazards-behavior.md`

## .the verdict, once ruled

_unruled._

⇒ if the council rules **C**, record that an extant misnomer with a large prose footprint is deferred
by default, and consider whether `rule.require.get-set-gen-verbs` owes a note on how a misnamed
extant operation is repaired.
⇒ if the council rules **A**, the dream holds the target name and the four call sites; decide
explicitly what becomes of the 84 prose cites.
⇒ if the council rules **B**, the dream holds the split and the one constraint it must honor — the
first-adjudication claim must pass from the writer to the reader, or the race this round removed
comes back.
