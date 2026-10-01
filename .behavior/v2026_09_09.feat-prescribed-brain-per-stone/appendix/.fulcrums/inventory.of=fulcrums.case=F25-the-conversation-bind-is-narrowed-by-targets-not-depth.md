# fulcrum F25 — the conversation bind is narrowed by TARGETS, not by DEPTH

**raised** 2026-09-17, on i035 — three lanes returned `unreadable` at the context gate
**rework** = 🔴 dirty · **status** = open · **confidence** = 70%

## .the fork, stated fairly

three l1 lanes blew the 75% context gate at i035 and returned no verdict at all: `repo-rules`
(75.4%), `arch-opport-decomposition` (75.2%), `arch-smell-scopeleaks` (75.2%). the prompt decomposes
into three terms, and only one of them grows:

| term | tokens | grows per round? |
|---|---|---|
| rules | 0.5k – 14.8k | no |
| targets | 339.6k | only with the diff |
| 🔴 **conversation** | **≈436.2k** | 🔴 **20–40k, without bound** |

| | the choice |
|---|---|
| **taken** | cut the **targets** — `--paths-wout '**/*.test.ts*'` on the lanes whose rubric does not grade tests, plus a split of `repo-rules` so its 2 test-bound rules keep a lane |
| **rejected** | cut the **conversation** — drop `--conversation` from the three lanes, as `behavior-intent-coverage` already does |

## .what was taken, and why

**cut the targets.** the decisive argument is that the two cuts are not the same KIND of cut:

- a targets cut removes **files a rubric does not grade** — so no rule loses its subject
- a conversation cut removes **every argument ever made back to that lane** — so the lane re-raises
  points it was answered on, forever

⇒ and this guard already states that asymmetry in its own i033 note: *"every other lane grades a
JUDGMENT, so it must read what was argued back or it re-raises a settled point … which is why no
peer lane may copy this line."* `behavior-intent-coverage` earns the exception because it grades
COVERAGE against a fixed contract, and a coverage objection is closed by coverage rather than by a
`.taken` (`rule.always.raise-a-blocker-a-taken-cannot-close`). **none of the three overflowed lanes
has that property.**

**the second argument is that the targets cut costs no coverage where it was applied**, and that was
checked per lane rather than assumed:

| lane | rubric subject | narrowed? |
|---|---|---|
| `arch-opport-decomposition` | how the implementation decomposes | ✅ yes |
| `arch-smell-scopeleaks` | whether the implementation reached past its bound | ✅ yes |
| `repo-rules` | 19 rules on implementation, **2 on tests** | ✅ narrowed **and split** — the 2 moved to `repo-rules-tests` |
| `mech-failhides` | binds `code.test/pitofsuccess.errors/` outright | ❌ left whole |
| `behavior-intent-coverage` | a test is what covers intent | ❌ left whole |
| `ergo-friction-hazards` | snapshots are its stdout evidence | ❌ left whole |

## 🔴 .the counter-case, and it is the stronger half

**the targets cut buys a fixed sum, once, against a term that grows without bound.**

- it frees ≈194k of headroom, one time
- the conversation grows 20–40k a round, forever
- ⇒ **it buys roughly 7–10 rounds and then this recurs**, on whichever lane sits nearest the cliff

and the recurrence is not hypothetical — **it has already happened once.** at i032
`behavior-intent-coverage` blew the same gate (758.1k vs 750k, 398.9k of it conversation across 504
files) and the repair was to drop its conversation. **eleven rounds later the identical failure took
three different lanes.** a repair that must be re-performed on a new lane every ~10 rounds is a
treatment rather than a cure.

⚠️ **and the honest bound on the taken option: after this narrow, the residual targets are 145.2k
against a conversation of 436.2k.** there is no second targets cut of comparable size. **the lever is
spent.**

## .why it is dirty

the *right* fix is a **depth bound** on the conversation bind — thread the last n generations rather
than all of them. that is dirty in the precise sense the rule means:

| | cost |
|---|---|
| surface | a new public flag on `rhx review`, or a new `$conversation` expansion form |
| files | `parseReviewArgs`, `stepReview`, `enumRouteGuardReviewPeerConversationFiles`, the `$conversation` expansion in `runStoneGuardReviews` |
| blast radius | **every extant `.guard` in every tree that adopts these roles**, plus the `rhachet-roles-bhuild` template that stamps them |
| a reversal | a flag removal from a published CLI surface |

⇒ so it is deferred, and per `rule.always.fix-forward-under-scouts-honor` a deferral for **dirt**
owes both a dream and a fulcrum. the dream is
`.dream/v2026_09_17.reseed.a-conversation-bind-has-no-depth-bound.md`; this is the fulcrum.

🟡 **and the depth bound has a real cost on its own arm, which is why it is a fork rather than an
obvious answer.** a truncated conversation can lose a settled argument, and a reviewer that cannot
see the `.taken` that settled it will re-raise it — the exact failure
`rule.always.converge-with-reviewers.via-a-taken-per-point` describes. **n is a judgment, and it must
be per-lane**: a judgment lane wants depth, a coverage lane wants none.

## .where

- `$route/5.1.execution.from_vision.guard` — the i036 bind edit, and its measured note
- `src/contract/cli/review.ts:158` — `pathsWout` is a single string, so the exclude is ONE glob
- `src/domain.operations/review/stepReview.ts:379-387` — where the negatives are applied
- `.dream/v2026_09_17.reseed.a-conversation-bind-has-no-depth-bound.md` — the work

## .confidence, and why

**70%.** what is measured: the three overflow percentages, the token split, the 20–40k growth rate,
the i032 precedent, the per-lane rubric audit. what is a judgment is whether a repair that is
**correct and temporary** was the right call against one that is **durable and out of scope**.

⚠️ **the residual 30% is one specific risk: the taken option spends the last large targets lever.**
when this recurs at ~i045, the only moves left are a conversation drop (coverage loss) or an engine
change (this route cannot make it). ⇒ **a wisher who expects this stone to run long may fairly rule
that the engine ask be dispatched now rather than caught.**

## 🔴 .amended 2026-09-18, i036 — the projection was WRONG by an order of magnitude

this entry projected the recurrence at **7–10 rounds**. **it recurred in ONE.**

| | projected | measured |
|---|---|---|
| rounds until the next overflow | 7–10 | 🔴 **1** |
| lanes taken | *"whichever lane sits nearest the cliff"* — one | 🔴 **four, at once** |

at i036 the four lanes this entry's own audit table marks **`❌ left whole`** all returned
`✋ constraint` with no verdict: `mech-failhides`, `ergo-friction-hazards`, plus
`arch-hazards-maintenance` and `arch-hazards-behavior` — the two the audit table never listed.

```
✋ prompt exceeds 75% of context window
   ├─ 76.4% of 1048576 tokens
   └─ targets: 80 files, 346.3k   (against a narrowed lane's 50 files, 58.5%)
```

### 🔴 .why the projection was wrong — it modelled the WRONG growth term

the entry priced the growth as the **conversation** alone, at 20–40k a round. it left out the
term that actually moved:

| term | i035 | i036 | the delta |
|---|---|---|---|
| the diff | 79 files | 🔴 **214 files** | ⚠️ **+171%, in one round** |

⇒ **the convergence loop feeds the diff.** every `.taken`, every term cluster, every dream, every
guard note written to ANSWER a reviewer enlarges the corpus the next round must read. that loop is
named in `rule.always.raise-a-blocker-a-taken-cannot-close`, and this entry did not price it.

🟡 **so the two growth terms compound rather than alternate**, and a projection built on one of
them is not merely imprecise — it is the wrong shape.

### ✅ .what still held, and it is the part that mattered

- **the TARGETS cut works.** eight l1 lanes at i036, sorted by one flag, zero exceptions: every
  lane with `--paths-wout` rendered; every lane without it went dark
- **the per-lane rubric audit was right to leave those lanes whole.** a narrow would have deleted
  `mech-failhides`'s `code.test/` half and `ergo-friction-hazards`'s `.snap` evidence

⇒ **what the audit lacked was a THIRD option.** it offered narrow-or-leave-whole, and the answer
for a lane whose rubric spans both halves is a **SPLIT** — the move `repo-rules` →
`repo-rules-tests` had already proven in the very same round, with both halves green.

🔴 **the i037 repair applies that third option**: `mech-failhides` → `+ mech-failhides-tests`,
`ergo-friction-hazards` → `+ ergo-friction-hazards-snaps`, and a plain narrow for the two
`arch-hazards-*` lanes whose rubrics never graded tests at all.

### ⚠️ .what this does to the counter-case, and to the ask

the entry's counter-case reads *"a repair that must be re-performed on a new lane every ~10 rounds
is a treatment rather than a cure."* **at one round per recurrence, that is no longer a treatment —
it is a tax on every convergence round**, and the round it taxes is the one already most expensive.

🔴 **and the "lever is spent" warn has landed early.** after i037 there is no third targets cut:
every l1 lane now carries either the exclusion or a split, and `behavior-intent-coverage` is the
one lane left whole — protected only because it carries no `--conversation`.

⇒ **the residual-30% risk this entry named for ~i045 has arrived at i037.** the wisher's call is
therefore live rather than distant: **dispatch the depth-bound engine ask now, or accept that the
next overflow is answered by a conversation drop and the coverage loss that comes with it.**

🟡 **confidence falls 70% → 55%.** the taken option is still judged correct — it bought the rounds
it could and cost no coverage — but this entry's own model of *how long it buys* was refuted by the
very next round, and a fork whose timeline is wrong is a fork a wisher should re-read.

## .the verdict, once ruled

*(open — and now time-sensitive, per the amendment above)*
