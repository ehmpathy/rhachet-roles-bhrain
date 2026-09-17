import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';

/**
 * .what = the reviewer slugs a bulk `--add` may touch, given the live meters and an optional
 *         explicit `--level` (F022, invariant 5).
 * .why = fork E of F022 forbids a blanket top-up: a level stays exhausted unless it is EXPLICITLY
 *        named. so a bare `--add` must not spray every level — it lands on the LATEST (deepest)
 *        level in play, and a lower level is reached only when the driver names it with `--level`.
 *        the return feeds route.ts's `targetSlugs` skip-filter, which drops any peer not in the set.
 *
 * @returns
 *   - `null` — no level scope applies, so the caller's extant filters stand alone. returned when a
 *     `--peer` slug already scopes the write, or when no `--level` was named AND no lane has run
 *     yet (no meter carries a level, so a scope would be meaningless and the extant all-peers
 *     behavior is the safe, harmless case — no lane is exhausted, so none is silently healed).
 *   - a `Set<slug>` — the peers the write may touch. every other peer is skipped.
 *
 * 🔴 .note = an explicit `--level` ALWAYS returns a scoped `Set` — even against an empty meters
 *        array, where it returns an empty one. the empty-meters short-circuit below applies to
 *        the DEFAULT case alone (`levelFlag === null`); an empty meters set has no lane at ANY
 *        level, so a NAMED level trivially matches naught, and route.ts's own fail-fast check
 *        reads that empty set to error before the write. checked in the other order, a named
 *        `--level` on a never-run stone fell through to `null`, which route.ts's `targetSlugs
 *        !== null` guard cannot see — `isPeerBudgetLineInScope` then reads `null` as unscoped and
 *        extends EVERY configured peer, the exact blanket sweep F022 fork E forbids.
 *
 * 🔴 .note = it reads the meter `level`, never the ladder config. the meters are the live truth of
 *        what has run and at what level, so the scope tracks the run rather than the declaration.
 *
 * .note = an explicit `--level` that matches no lane returns an EMPTY set (touch naught). the caller
 *        validates that a level was named that a lane sits at, and errors before the write, so this
 *        transformer stays pure and total (rule.require.failfast owns the guidance, not this).
 */
export const computeBudgetTargetSlugs = (input: {
  meters: GuardPeerMeterStatus[];
  levelFlag: number | null;
  peerSlug: string | null;
}): Set<string> | null => {
  // a --peer slug already scopes the write; a level scope on top would only narrow it further
  // by coincidence, so defer to the peer filter alone.
  if (input.peerSlug !== null) return null;

  // an explicit --level names exactly the peers at that level — even against an EMPTY meters
  // set, where it returns an empty Set (route.ts's fail-fast reads that, and errors)
  if (input.levelFlag !== null)
    return new Set(
      input.meters
        .filter((meter) => meter.level === input.levelFlag)
        .map((meter) => meter.slug),
    );

  // no --level named, and no lane has run: no meter carries a level, so a scope is meaningless,
  // and the extant all-peers behavior heals no lower level — leave it unscoped.
  if (input.meters.length === 0) return null;

  // the default: the LATEST (deepest) level in play, and it alone.
  const latestLevel = input.meters.reduce(
    (max, meter) => Math.max(max, meter.level),
    0,
  );
  return new Set(
    input.meters
      .filter((meter) => meter.level === latestLevel)
      .map((meter) => meter.slug),
  );
};
