# handoff → rhachet-roles-ehmpathy / architect

## .what

a proposed refinement to `rule.require.dependency-injection` (and the sibling
`define.domain-operation-grains` used by the `arch-opport-decomposition` reviewer):

> **dependency injection applies only to _external_ dependencies and
> _parameterized_ dependencies. it does NOT apply to same-repo domain
> operations, which are composed via direct import.**

## .why (the incident that surfaced the gap)

during a build in `rhachet-roles-bhrain`, the `arch-opport-decomposition`
reviewer raised a **blocker** on this orchestrator:

```ts
// src/domain.operations/route/stepRouteStatusLine.ts
import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { asStatusLine } from './statusLine/asStatusLine';
import { computeNextStones } from './stones/computeNextStones';
import { getAllStoneDriveArtifacts } from './stones/getAllStoneDriveArtifacts';
import { getAllStones } from './stones/getAllStones';

export const stepRouteStatusLine = async (input?: {
  route?: string;
}): Promise<{ line: string }> => {
  const stoneName = await getCurrentStoneNameOrNull({ route: input?.route });
  return { line: asStatusLine({ stone: stoneName }) };
};
```

citing `rule.require.dependency-injection`, the reviewer demanded that every
leaf operation be injected via context:

```ts
context: { getRouteBindByBranch, getAllStones, getAllStoneDriveArtifacts,
           computeNextStones, asStatusLine }
```

this is **wrong**, and it is wrong in three provable ways:

1. **it contradicts the whole repo's established pattern.** every orchestrator
   in `src/contract/cli/route.ts` (`stepRouteDrive`, `stepRouteStoneSet`,
   `stepRouteStoneGet`, `stepRouteReview`, …) imports its same-repo leaf
   operations directly. injecting them would be a lone exception with no
   precedent.

2. **it contradicts `wet-over-dry` and the reviewer's own verdicts.** the same
   reviewer, in the same round, *also* raised nitpicks telling us to **inline**
   the pure transformers we had extracted (`asFirstStoneOrNull`,
   `getRouteFromBindOrNull`). "inject these" and "inline these" cannot both be
   right for the same one-line pure functions. (a prior reviewer,
   `mech-decode-friction`, had *required* those very extractions — so the
   reviewers are now fighting each other across rounds.)

3. **it produces worse code.** these are pure, deterministic, same-repo
   functions with no I/O. injecting them buys zero testability (there is
   no external thing to fake — they take data in, return data out) while
   adding a wide context contract, boilerplate at every call site, and
   indirection that defeats the "orchestrator reads as narrative" goal.

## .the principle (what the brief should say)

DI exists to make **the boundary with the outside world** swappable and
testable, and to let **callers parameterize behavior**. that is the entire
value. it does not exist to sever the ordinary composition of a repo's own
domain functions.

### 👍 inject via `context` — _external_ dependencies (the I/O boundary)

things that cross the process boundary or hold external state, where a test
wants to swap a fake for the real thing:

- communicators: SDKs, DAOs, service clients (`sdkStripe`, `daoCustomer`, `svcDeals`)
- `log`, `clock`/`now`, `uuid`, random, env/config readers
- `context.brain` (probabilistic / LLM)
- database connections, queues, filesystem adapters

### 👍 inject via `options` — _parameterized_ dependencies (caller's choice)

pure configuration or strategy the caller decides at the call site:

- format/mode/precision flags, feature toggles
- a strategy function the caller supplies to vary behavior

### 👎 do NOT inject — _same-repo domain_ operations (compose by import)

- transformers (pure: `as*`, `is*`, `compute*`) — import and call directly
- other orchestrators and same-repo leaf operations — import and call directly
- anything deterministic with no external dependency and no caller-varied strategy

> heuristic: **"is there a real, external thing a test would need to fake?"**
> yes → inject it (context). no, but the caller picks it → options. no, it's
> just our own domain code → import it. same-repo domain composition is a
> feature, not a coupling to break.

### the tell that DI has gone too far

if the proposed `context` lists this repo's own `get*`/`compute*`/`as*`
functions, DI has been misapplied. those are composition, not dependencies.
injecting them yields no test seam and only adds ceremony.

## .proposed edits

1. add a `.boundary` section to
   `rule.require.dependency-injection.md` (pt1) stating the three-way split
   above (external → context, parameterized → options, same-repo domain →
   import), with the "is there an external thing to fake?" heuristic.
2. add an explicit **anti-pattern** example: a `context` that lists same-repo
   `get*`/`as*`/`compute*` operations = **over-injection = not a blocker to
   raise; raising it is the defect.**
3. cross-link `define.domain-operation-grains`: orchestrators **compose** leaf
   operations by import; only the leaf **communicators** hold injected I/O. an
   orchestrator that injects its own transformers has confused composition with
   dependency.
4. reconcile with `rule.prefer.wet-over-dry`: reviewers must not simultaneously
   demand injection *and* inlining of the same pure one-liners.

## .evidence trail

- reviewer report (round 3):
  `.behavior/v2026_07_08.fix-status-line/.reviews/peer/5.1.execution.from_vision._.review.i3.43ad71b9a6c45b0ce2.r4._.given.by_peer.arch-opport-decomposition.report.md`
- the DI brief as it stands (no boundary stated):
  `rhachet-roles-ehmpathy/dist/domain.roles/mechanic/briefs/practices/code.prod/evolvable.procedures/rule.require.dependency-injection.md.pt1.md` (+ `.pt2.md`)
- the established counter-pattern (orchestrators importing same-repo leaves):
  `rhachet-roles-bhrain/src/contract/cli/route.ts` (every `routeStone*` / `route*` entrypoint)
