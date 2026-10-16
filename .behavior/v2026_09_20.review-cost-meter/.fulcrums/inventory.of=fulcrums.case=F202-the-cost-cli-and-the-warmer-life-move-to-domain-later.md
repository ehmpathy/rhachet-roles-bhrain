# F202 — the cost cli's rules and the warmer's life move to the domain, in a later round

- raised 2026-10-09, from i034 r030 nitpick.2 and nitpick.3 `[nitpick][better]`:
  - `review._.cost.ts` holds the breadth axis, the flag × breadth rule, and the refusal builders,
    none exported nor unit-testable apart from a process run
  - `review._.warmer.ts` runs the warmer's life cycle in the contract, and
    `getOneWarmerBrainOrNull` writes a ledger row, prints, and sets the exit code behind a `get*`
- rework: 🔴 dirty
- status: 🟡 **BEST-GUESSED — deferred; overrule it to extract both now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — extract now** | `review/cost/` transformers with unit tests; `runReviewWarmerLife` returns `clean \| unbooted \| unrecorded`; the contract reduces to parse, dispatch, emit, exit |
| **B — after this route** | both files are covered end to end by acceptance cases that snapshot every refusal and every life-cycle exit; the extraction is a move with no behavior change, best done with F201's shared reader, since parse and the flag × breadth rule are one seam |

## .taken, and why

**B.** the `get*` with a side effect is the sharpest of the three, and it is real: a reader of
`reviewWarmer` cannot see the exit code move. it is confined to one private function in a detached
entrypoint, whose only caller is the line beside it. the move lands with F201, since the cost cli's
breadth rule is half of what a shared argv spec declares.

## .rework, and why

**dirty.** the warmer's life cycle is tested only through the spawned process today, so the
extraction re-lays those tests as integration tests of a domain orchestrator.

## .confidence, and why it is not higher

the `get*` name could be fixed alone today (`setOneWarmerBootRefused`) at small cost; that half
may be worth an overrule.

## .where

`src/contract/cli/review._.cost.ts` · `src/contract/cli/review._.warmer.ts:61-265` · F201

## .verdict

(open)
