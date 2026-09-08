# appendix: groundwork

the evidence beneath `1.vision.yield.md`. the yield states the decisions; this holds what they rest
on.

## .provenance

**external research: none.** every wish claim re-read from TypeScript, not `dist/` — D1, D2, the
whole-artifact hash scope, the exhaustion skip, the sound transport: **all verified as stated.**

## .five facts the wish did not carry

1. `runStoneGuardReviews` is called **from** `setStoneAsPassed` (`:378-388`) — entrance and exit are
   one operation, so D1 is a **sequence defect inside one function**
2. the exit gate is nested in `if (allJudgesPassed)` (`:814`) — it never evaluates when judges fail
3. ✅ the wish's gap #1 closes well — `enumRouteGuardReviewPeerFiles.ts:19-52` already takes `hash`
   as optional, `…TakenMetas.ts:23-27` already calls it hash-agnostically. P2 is a near-copy
4. 🔴 **P2's second site** — the deadlock. small does not mean single-site
5. 🔴 **prior art existed and I had not looked** — the dream, in `.dream/`, the one place a deferred
   followup is queued. `rule.always.reuse-pavement-before-improvise` names this miss

## 🔴 .D2, observed first-party

i002 raised **1 blocker** at hash `87a041d5…`. my repair moved the hash. I wrote the `.taken`, ran
`--as contemplated`, and the ack read **`this reviewer raised no blockers — no critique to answer`**.

⇒ **the repair erased the record of the very blocker it answered.** a driver who does the honest
work and one who edits at random reach the identical engine state.

## 🔴 .the cure, observed first-party

the wish's counts are out of reach; its **thesis** reproduced here in three iterations:

| iter | takens written | nitpicks | what the givens said |
|---|---|---|---|
| i004 | **0** | 3 + 4 | — |
| i005 | **0** | 5 + 6 | 🔴 every one *"re-raised from i004, no `[REPAIR]` in this submission"* |
| i006 | **2** | **1 + 0** | the repaired points dropped; the one new find was created by a repair |

⇒ **I repaired i004's points silently and wrote no `.taken`, so both reviewers correctly read a fix
as no fix and re-raised all of it.** the moment the takens landed, 11 → 1; across six rounds, 11 → 0.
that is `rule.always.converge-with-reviewers.via-a-taken-per-point` measured rather than cited: *"a
blocker that returns after you fixed it is a driver error, never a reviewer defect."*

⚠️ the wish's nitpick-count pattern reproduced too — 7 → 11 while no taken was written, then 11 → 1
once one was. **a count that holds station or climbs is the signature of a loop where no conversation
occurs.**

## ✅ .two yield claims confirmed incidentally

takens were written at the given's hash, then repairs moved the current hash **before** the re-run —
and both reviewers still read them. so:

- the `$conversation` transport is **hash-agnostic** (A8, and case=4's mechanism table)
- a `.taken` write does **not** move the artifact hash — `computeStoneReviewInputHash.ts:53-64`
  reads the `artifacts:` set alone

## 🔴 .three assumptions were false, and each changed the contract

| # | assumed | true |
|---|---|---|
| A5 | a `.taken` holds a real answer | **accepted false** — the gate checks existence, never content |
| A7 | P2 is one function | **two sites**, the second a deadlock |
| A9 | the enumeration arrives sorted | **an explicit sort** is owed |

## .unverified

| gap | status |
|---|---|
| 🔴 the wish's counts — 32 iterations, 282 givens, 0 takens | **[wisher]** — `gh api repos/…/branches` returns `main` alone; the cited branch does not exist |
| the adjacent worktree, reported stuck the same way | **[wisher]** — same cause |
| the `malfunction` entries in `passage.jsonl` | **[research]** — reachable only once the corpus is |

⚠️ **no `[research]` item is reachable without the `[wisher]` ask** — one question blocks, and it is
*"where did that branch go?"*, not a design question. ⇒ **the counts are motivation, never premise.**

## ✅ .`no review files found for hash` — the wish's other unexplained entry, explained

reproduced at i007. both reviewers sat at `6/6` **exhausted**; I edited an artifact; the hash moved
to `796b200c`; `judge.1` blocked with **`no review files found for hash 796b200c`**.

the chain: `runStoneGuardReviews.ts:441` skips an exhausted reviewer → it writes no given at the new
hash → the `reviewed?` judge tallies **by current hash** → it finds an empty set and cannot pass.

⚠️ **the guard and its judge disagree in one emit** — the same stdout renders `exhausted 🌙, cached ·
0 blockers ✓` for both lanes *and* `no review files found for hash`. the verdicts exist and are
clean; the judge's hash-keyed read cannot see them.

⇒ **D2's defect class, one layer up.** D2 is a hash-keyed read of *givens*; this is a hash-keyed read
of the *tally*. **P2 does not fix it**, so it is out of scope here and caught as
`.dream/v2026_09_04.fix.judge-tally-dies-on-hash-move-after-exhaustion.md`. ✅ the driver's lever is a
budget top-up, which is what I spent (`rule.always.spend-own-levers-before-escalation`).
