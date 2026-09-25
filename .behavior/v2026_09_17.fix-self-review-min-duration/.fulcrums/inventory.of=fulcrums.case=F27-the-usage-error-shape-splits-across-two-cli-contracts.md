# fulcrum F27 — the usage-error shape splits across two cli contracts

- raised  = 2026-09-23, stone `5.3.verification`, i004
- rework  = clean
- status  = open
- confidence = 80%

## .the fork

`ergo-snapshot-visual-blemishes` blocker.1 named `route.bind.set` as the lone divergent usage-error
render in `driver.route.usage-errors.acceptance.test.ts.snap`. the repair is taken. the question the
repair raises, and does not answer:

> **how far does the uniformity claim reach — one contract, or the whole cli?**

| option | the claim | cost |
|---|---|---|
| **A** — one shape per **contract** | `route.*` renders `BadRequestError` + JSON; `review*` renders the bare pair; each is internally uniform | naught — this is what ships |
| **B** — one shape across the **whole cli** | every required-flag refusal, in every contract, renders identically | ~8 call sites, 2 files, 2 snapshot files re-taken |
| **C** — one shape per **verb family**, deliberately | `route.guard.budget` keeps its help-dump, `review*` keeps the bare pair, and each divergence is argued in a docblock | a read of every site, plus the prose |

## .taken, and why at the time

**A**, for this round — the blocker named the route contract's snapshot file, and the outlier in
that file is repaired. the eight `review*` sites are consistent with each other and pinned by their
own snapshots, so no site there is an outlier by the rule's own test.

## .rework, and why

**clean.** all three options are shape changes on error paths that snapshots already pin. a later
verdict for **B** moves ~8 call sites and re-takes two snapshot files; no caller has hardened against
either shape, because both exit 2 and `rule.require.exit-code-semantics` is what a caller reads.

## .confidence, and why it is not higher

**80%.** the deferral is well grounded — CLEAN fails plainly, since `review.ts` and `review.by.ts`
are outside this diff and this wish is about the self-review gate's timer and hash key.

🔴 **what holds it under 90% is that this round already mis-graded this exact concern once.** at
i003 the same point arrived as a nitpick and was **declined** on the claim that the bare shape was
the majority — *"1 of ~9 identical call sites, so a partial repair makes the boundary more
inconsistent"*. the arithmetic was wrong: within `route.ts` the `BadRequestError` throw is the house
shape at ~14 sites and the bare pair was the outlier at 3. ⇒ the decline reversed a correct lane on
a count that was never taken, and the lane had to raise it again as a blocker to get it read.

🟡 **the transferable form: a consistency argument is an ARITHMETIC claim, and it must be counted
before it is made.** *"a repair of one among many makes it worse"* and *"a repair of the one outlier
makes it better"* are the same sentence under different counts, and only a grep parts them.

⇒ so the scope call recorded here is offered with that history attached: the council should read
**B** on its merits rather than on this drive's second guess at a boundary it already mis-drew once.

## .where

- repaired: `src/contract/cli/route.ts:908-912` — `routeBindSet`
- pinned: `blackbox/__snapshots__/driver.route.usage-errors.acceptance.test.ts.snap` (case7)
- deferred: `src/contract/cli/review.ts:307,316,321,334,343` · `src/contract/cli/review.by.ts:187,198,205`
- deliberate third shape: `src/contract/cli/route.ts:2272,2289` — `routeGuardBudget`

## .the verdict

open — awaits the council.

## .see also

- `.dream/v2026_09_23.fix.two-cli-contracts-refuse-an-absent-flag-in-two-shapes.md` — the work
- `F24` — the extant scope fulcrum this one corrects the arithmetic of
- `rule.forbid.snapshot-visual-blemishes` (bhuild/role=behaver)
