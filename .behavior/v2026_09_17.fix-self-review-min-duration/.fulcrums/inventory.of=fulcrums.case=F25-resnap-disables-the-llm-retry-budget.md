# F25 — `--resnap` disables the LLM retry budget, corpus-wide

- **rework** = dirty
- **status** = OPEN
- **confidence** = 95% on the deferral · 60% on direction 1 vs 2

## .the fork, stated fairly

this stone restructured one error message and re-ran the acceptance corpus with `--resnap`. the flag
rewrote a snapshot in `review.by.guard-peer` — a file this round never opened — and the rewrite
flipped a **verdict**: `approved / 0 blockers` → `rejected / 1 blocker`, in a case named
`[case-seam-pass-aggregation]`.

the fork the drive faced, once it caught this:

| | the option | what it costs |
|---|---|---|
| **A** | revert the one snapshot, carry on, say naught about the flag | cheap, and the next driver walks into it |
| **B** | revert, and **repair `git.repo.test`** so the pair cannot recur | the skill every gate in every route runs through |
| ✅ **C** | revert, **bite-test the revert**, and defer the instrument repair with a dream + this fulcrum | the defect stays live until a council rules |

## .taken, and why at the time

**C.** the revert is this round's to make — it undoes a change this round caused. the *instrument*
repair is not:

- `git.repo.test` lives in `.agent/repo=ehmpathy/role=mechanic/skills/`, a **different repo's** tree.
  direction 1 and 2 of the dream are a **reseed**, never a fix here
  (`rule.always.scope-onetime-lessons-to-the-behavior`)
- a refusal rule that mis-fires blocks a legitimate resnap for **every driver in the org**, and this
  round has no way to measure that surface

⇒ and the revert was **bite-tested** rather than trusted: restored to `HEAD`, re-run with no
`--resnap` → `54 passed, 0 failed`. the flake is confirmed, the revert is proven, and the byte count
matches `HEAD` exactly (`10616`).

## .rework, and why

**dirty.** the ripple is not one file — it reaches every route in every repo that runs a gate
through `git.repo.test`. that is what makes this a fulcrum rather than a dream alone
(`rule.always.fix-forward-under-scouts-honor`: a dirt deferral owes both).

## 🔴 .confidence, and why it is not 100%

**95% on the deferral.** the one argument against it is the verification stone's own zero-tolerance
clause — *"it's unrelated to my changes is not an excuse — fix it"*. ⇒ this is the **same rule
conflict `F22` hands up**, and it is now the round's second instance: the gate's letter says repair
every red you meet; `rule.always.fix-forward-under-scouts-honor` grades a cross-tree cleanup
smuggled into an unrelated change a **blocker** from the mirror side.

🟡 **that `F22` and `F25` collide with the gate for the same reason, in one round, is itself the
signal.** one instance is a judgment call; two is a question the repo owes an answer to.

**60% on direction 1 vs 2** — refuse the combination, or demand a `--scope`. the drive favours 2 as
cheapest and 1 as most correct, and has not measured how many legitimate unscoped resnaps exist.

## 🔴 .what makes this worth a council's eye rather than a quiet revert

the defect is **invisible by construction**, and that is the part a count cannot convey:

- the run printed `8 snapshots written` and **named none of them**
- the suite reported **green**
- `when.repeatably({ attempts: 3, criteria: 'SOME' })` — the repo's own LLM-variance absorber — was
  **never reached**, because attempt 1 cleared by rewrite

⇒ **no gate in that run could have reported it.** it surfaced only because a driver ran
`git status` on the snapshot dir and read a diff it had no reason to expect. **the next driver will
not necessarily do that**, and the corpus holds more probabilistic cases than this one.

## .where

- `.dream/v2026_09_23.fix.resnap-silently-overwrites-a-flaked-llm-verdict.md` — the full diagnosis,
  the bite test, and the three candidate directions
- `.dream/v2026_09_20.fix.an-llm-verdict-snapshot-exhausts-its-three-retries.md` — the **case**-side
  twin. that dream asks whether the case should draw from an LLM at all; this one asks why the
  instrument hid the draw
- `blackbox/__snapshots__/review.by.guard-peer.acceptance.test.ts.snap` — reverted, byte-identical
  to `HEAD`

## .the verdict, once ruled

_pending._
