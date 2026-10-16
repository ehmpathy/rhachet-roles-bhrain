# F218 — the prime-meet grant is consumed from the process env

## .the fork

i042 r030 nitpick.2: `review.ts` reads the prime-meet grant and then deletes it from
`process.env`, so no process spawned later inherits a `join` it was never granted. the reviewer
asked the grant stripped where each child's env is built instead, as `runOneReview` already
does (`asEnvWithReviewPrimeMeet`), so the rule holds per spawn rather than by statement order.

1. **strip per child** — every spawn site builds its env without the grant
2. **consume once, at the contract boundary** — today's shape

## .taken

option 2, disputed. the spawns below the read are not ours to build an env for: the brain call
spawns its subprocess inside the brains package from the ambient `process.env`, and a clone a
lane enrolls is started by a tool this repo does not own. a per-child strip has no seam there.
the one seam that reaches every descendant is the process env itself, and the read sits at the
contract boundary, before the brain boot's first spawn, so the domain reads no env.

the spawns this repo DOES build already strip per child (`runOneReview` →
`asEnvWithReviewPrimeMeet`), clamped by `runOneReview.integration.test.ts`.

## .rework — dirty

a per-child strip at the brain needs an env seam in the brains package — another repo's
contract, so a re-seed, not an edit here.

## .confidence — 80%, and why it is not higher

the order rule is real and unenforced by the type system. the 20% is that a future spawn added
between the read and the boot could leak; the read's comment names the rule, and the marker is
now declared beside its lifetime in `ENV_OF_REVIEW_CHILD` (CONSUMED).

## .where

- `src/contract/cli/review.ts` — the read and delete
- `src/domain.operations/ENV_OF_REVIEW_CHILD.ts` — the lifetime table
- `src/domain.operations/review/prime/asEnvWithReviewPrimeMeet.ts` — the per-child strip

## .verdict

open — for the council.
