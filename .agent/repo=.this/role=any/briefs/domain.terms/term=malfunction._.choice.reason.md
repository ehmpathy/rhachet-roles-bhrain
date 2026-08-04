# domain.term.choice.reason: malfunction

## .etymology

`malfunction` = latin *mal-* (bad, wrong) + *function* — a mechanism that does not function as it
should. the word names a **broken process**, not a bad result. that distinction is the whole reason it
earns a place beside the verdict words: `approved` / `rejected` / `exhausted` describe a review that
RAN and reached a judgement; `malfunction` describes a review that could not run, or whose output could
not be read. the process broke before a judgement existed.

chosen over the rejected synonyms because each drops the one sense that matters — "the process broke,
so there is no verdict to trust":

- `crash` — too narrow: it evokes a segfault / thrown exception, but a malfunction also covers an
  exit code outside the verdict set and an unreadable-or-absent output that never threw at all.
- `error` — overloaded to exhaustion across every codebase; it says "some fault occurred somewhere"
  and reads at every layer, so it cannot mark this one specific end-state.
- `failure` — collides with the legitimate verdicts: a `rejected` review "failed" the artifact, and a
  `constraint` "failed" a threshold — yet both RAN correctly. `failure` would blur the ran-and-held
  case with the could-not-run case, the exact conflation this term exists to prevent.
- `broke` / `fault` — informal and directionless; neither names whether the fault blocks passage or
  merely logs, and neither composes into a contract word (`exitClass`, the `{ malfunction }` variant).

`malfunction` stays precise on the modal fact — the process did not deliver a verdict — and neutral on
blame, so it reads the same whether the cause was a crashed judge, a timed-out reviewer, or a reviewer
whose stdout lacked the required numeric counts.

## .malfunction vs constraint (the line that must not blur)

both are non-pass, both are terminal-for-unlock, both need a human to forgive — yet they are distinct,
and `getExitCodeClass` draws the line by exit code:

| exit code | class | sense |
|---|---|---|
| `0` | passed | the process ran and cleared |
| `2` | constraint | the process ran and reported a legitimate hold (blockers exceed threshold, no review files, an `approved?` that awaits sign-off) |
| else | **malfunction** | the process could not deliver any verdict — it broke |

a `constraint` is a verdict the process CHOSE to report; a `malfunction` is the absence of any verdict.
to conflate them would let a broken judge read as a legitimate hold (or vice-versa), which is exactly
the kind of silent mis-read `rule.forbid.failhide` forbids.

## .terminal-for-unlock, yet blocks passage

a malfunction is terminal (a broken lower rung does not hold a higher rung from a run — see
`term=terminal`), but terminal is necessary, not sufficient: the stone still cannot pass while any
reviewer or judge is malfunctioned. the only forgiveness is a human `--as overruled` (see
`term=overrule` / `term=forgive`) — never a driver act. this is why the tree renders the FACTUAL
`💥 malfunction` in both the live and persisted views, and renders a human overrule separately as
`overruled ✓ — forgiven by human`: the crash is a fact; the forgiveness is a distinct human act laid
over it, not a rewrite of the fact.

## .disputes

none. `malfunction` predates this capture as the codebase's `getExitCodeClass` third class and the
`{ malfunction: string }` outcome variant; the term merely names, in the glossary, a concept the code
already carried across its contract surfaces.

## .evidence

- **code**: `getExitCodeClass` classifies a non-0/non-2 exit as `malfunction`; the review runner
  (`runStoneGuardReviews.ts`) and judge runner (`runStoneGuardJudges.ts`) both emit a
  `{ malfunction: string }` variant; `GuardProgressEvent.ts` declares that variant on both the review
  and judge outcome; `setStoneAsPassed.ts` sets `passage = malfunction` and its `isJudgeForgivenByRung`
  forgives ONLY `judge.exitClass === 'malfunction'` (a rung overrule forgives a crash, never a
  co-judge's legitimate constraint).
- **behavior (`fix-route-overruled`, 2026-07)**: the live-tree fix this round turned on the
  malfunction/constraint distinction — a cached judge that malfunctioned had been emitted as a bare
  `blocked` (which dropped the malfunction signal), so the live tree contradicted the persisted
  `overruled ✓`. the fix restored the malfunction verdict end-to-end, which proves the term central to
  the contract, not incidental.
