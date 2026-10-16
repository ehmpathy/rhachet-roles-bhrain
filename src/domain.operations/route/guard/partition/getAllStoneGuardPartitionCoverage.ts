import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { asPathRelativeToCwd } from '@src/utils/asPathRelativeToCwd';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { asRouteGuardPartitionPeerKey } from './asRouteGuardPartitionPeerKey';
import { getAllDistinctByKey } from './getAllDistinctByKey';
import { getAllGuardPeerSlugs } from './getAllGuardPeerSlugs';
import { getOneRouteGuardPartitions } from './getOneRouteGuardPartitions';
import {
  getOneStoneGuardPartitionCoverage,
  type StoneGuardPartitionCoverage,
} from './getOneStoneGuardPartitionCoverage';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = how many scope checks may be in flight at one time
 * .why = each check reads the branch's changed files. a stone reads one scope per distinct
 *        partition set, so this bound pours a typical stone in one wave, and keeps the reads
 *        at a fixed count should a guard ever declare many overrides
 */
const BOUND_OF_CONCURRENT_SCOPE_CHECKS = 8;

/**
 * .what = the distinct partition scopes a stone's reviewers read: an override per reviewer
 *         that has one, else the standard set — each once, with every reviewer that reads it
 * .why = two reviewers that read one set check it once, and a set no reviewer reads is no
 *        concern of this stone
 */
const asScopesOfStone = (input: {
  stone: string;
  peers: string[];
  overrides: Record<string, string[]>;
  standard: string[] | null;
}): Array<{
  scope: RouteGuardPartitionScope;
  key: string;
  partition: string[];
  peers: string[];
}> => {
  // the scope each reviewer reads; a reviewer with neither override nor standard reads none
  const readsOf = input.peers
    .map((peer) => {
      const key = asRouteGuardPartitionPeerKey({ stone: input.stone, peer });
      const override = input.overrides[key];
      if (override)
        return {
          peer,
          scope: { kind: 'peer', stone: input.stone, peer } as const,
          key,
          partition: override,
        };
      if (input.standard)
        return {
          peer,
          scope: { kind: 'all' } as const,
          key: '@all',
          partition: input.standard,
        };
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // each scope once, the first reviewer's entry kept, with every reviewer that reads it
  return getAllDistinctByKey({ items: readsOf }).map((read) => ({
    scope: read.scope,
    key: read.key,
    partition: read.partition,
    peers: getAllPeersOfScopeKey({ reads: readsOf, key: read.key }),
  }));
};

/**
 * .what = the reviewers that read one scope, in declared order
 * .why = a named projection, so the scope list reads "who reads it" rather than an inline
 *        filter + map to simulate (rule.forbid.inline-decode-friction)
 */
const getAllPeersOfScopeKey = (input: {
  reads: Array<{ peer: string; key: string }>;
  key: string;
}): string[] =>
  input.reads.filter((read) => read.key === input.key).map((read) => read.peer);

/**
 * .what = how each partition scope a stone's reviewers read holds the branch — read-only
 *         and brain-free
 * .why = 🔴 the ONE stone-wide computation the entrance gate runs before any brain is called,
 *        and the coverage read a driver runs before arrival. the gate keeps the gaps; the read
 *        renders all of it. one computation, so the preview cannot disagree with the halt
 *        (rule.forbid.adhoc-scope-rollups)
 *
 * .note = checked against every file the branch changed — the set every lane draws from —
 *         so a set that holds here holds for every lane that reads the diff. each lane still
 *         re-checks its own split at review time, for a hand run or a lane bound past it
 * .note = no window check: the window is a property of each lane's brain and head
 */
export const getAllStoneGuardPartitionCoverage = async (input: {
  stone: { name: string; guard: RouteStoneGuard | null };
  /** the route dir — relative to cwd, or absolute */
  route: string;
  cwd: string;
}): Promise<StoneGuardPartitionCoverage[]> => {
  // no guard, no reviewer, no declaration — no partition to check
  const peers = getAllGuardPeerSlugs({ guard: input.stone.guard });
  if (peers.length === 0) return [];

  // 🔴 the route-spec check matches the route as a glob prefix against cwd-relative paths, so
  //    an absolute route matched no changed file and reported every partition as one that
  //    lacks the route spec — a false halt, whose printed repair appended a second, absolute
  //    route glob beside the relative one already declared
  const route = asPathRelativeToCwd({ path: input.route, cwd: input.cwd });
  const declared = await getOneRouteGuardPartitions({
    route,
    cwd: input.cwd,
  });
  const scopes = asScopesOfStone({
    stone: input.stone.name,
    peers,
    overrides: declared.byPeer,
    standard: declared.all,
  });

  // check each scope against the branch
  return getAllResultsInBoundedPool({
    items: scopes,
    bound: BOUND_OF_CONCURRENT_SCOPE_CHECKS,
    map: (scope) =>
      getOneStoneGuardPartitionCoverage({
        scope: scope.scope,
        peers: scope.peers,
        partition: scope.partition,
        route,
        cwd: input.cwd,
      }),
  });
};
