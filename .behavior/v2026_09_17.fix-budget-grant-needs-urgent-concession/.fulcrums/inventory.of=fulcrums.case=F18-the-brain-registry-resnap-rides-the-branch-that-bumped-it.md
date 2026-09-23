# F18 — the brain-registry re-snap rides the branch that bumped the dependency

| field | value |
|---|---|
| `rework` | 🟢 **clean** — one snapshot file, revertable in one command |
| `triage` | 🔴 **wisher** — a scope call, `F13`'s shape |
| `confidence` | 🟡 **74%** |
| `status` | best-guessed |
| `opened` | 2026-09-18, at `5.1.execution` i001 — raised by peer `behavior-intent-coverage` nitpick.3 |

## .the call

> **`blackbox/__snapshots__/review.conversation-help.acceptance.test.ts.snap` is re-snapped on this
> branch, because the dependency bump that moved it is on this branch.**

the registry of available brains drifted — three models in, three out. that list is rendered by
`review.conversation-help`, so the snapshot moves or the acceptance suite is red.

## .the fork, stated fairly

| option | what it does | what it costs |
|---|---|---|
| **A — carry it here** (taken) | the re-snap ships in this behavior's diff | a reviewer of the budget gate reads one unrelated diff hunk |
| **B — carry it on a separate change** | revert the snap here, land it beside the bump | 🔴 **the bump IS this branch.** there is no separate change to carry it on |
| **C — revert the bump too** | the snapshot never moves | the bump's own purpose is undone, and it is not this behavior's to undo |

## 🔴 .why option B is not available, which is the whole of the argument

the reviewer's remedy — *"it should be carried on the dependency-bump change rather than this
behavior's corpus"* — presumes a **separate dependency-bump change exists**. it does not.
`package.json` and `pnpm-lock.yaml` are modified on this branch, so the bump and the behavior share
one diff.

⇒ **to take option B, a driver must first split the branch**, which is a rebase of work already
reviewed, and `rule.forbid.commits-the-route-did-not-ask-for` forbids the commit that would do it.

## ⚠️ .why it is not 93%

the claim beneath the reviewer's remedy is **correct and unanswered**: a scope leak makes a reviewer
chase an unrelated diff. what is disputed is only the **remedy**, never the defect.

a third option exists and was not taken: **carry the re-snap and say so in the yield**, which is what
the execution log already does — *"one further file broke for an unrelated reason … it is owned here
because the bump ships on this branch."* ⇒ the record exists; the reviewer read it and still graded
it a leak, which is a fair read of the same fact.

🟡 **so this row is a judgment about whose corpus a forced re-snap belongs to**, and it is exactly
the shape `rule.always.itemize-the-fulcrums-you-best-guess` names: a call under 93% with no
alternative genuinely available.

## .what would move it

- a council that rules a forced re-snap must be split out regardless of cost → **option B**, and the
  branch splits
- a council that rules a forced re-snap rides its own bump → **option A ratified**, and the yield's
  note is the whole of what is owed

## .see also

`F13` — the scope-call shape this shares · `rule.always.fix-forward-under-scouts-honor` — the
SAFE/CLEAN test this fails on CLEAN · the peer given
`…r008._.given.by_peer.behavior-intent-coverage` nitpick.3
