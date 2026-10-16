// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import type { ReviewPartitionSplit } from '@src/domain.operations/review/partition/getAllTargetsByPartition';

import type { RouteGuardPartitionAction } from './asRouteGuardPartitionAction';
import { asRouteGuardPartitionClaimRefusal } from './asRouteGuardPartitionClaimRefusal';
import { asRouteGuardPartitionPruneRefusal } from './asRouteGuardPartitionPruneRefusal';
import { asRouteGuardPartitionsClaimed } from './asRouteGuardPartitionsClaimed';
import { asRouteGuardPartitionsPruned } from './asRouteGuardPartitionsPruned';
import { getAllPartitionFlagsOfScope } from './getAllPartitionFlagsOfScope';
import { getOneRouteGuardPartitionScopeRefusal } from './getOneRouteGuardPartitionScopeRefusal';
import {
  getOneRouteGuardPartitions,
  type RouteGuardPartitions,
} from './getOneRouteGuardPartitions';
import { getOneRouteGuardPartitionsCheck } from './getOneRouteGuardPartitionsCheck';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';
import { setRouteGuardPartitions } from './setRouteGuardPartitions';

/**
 * .what = declares, grows, shrinks, or clears one scope's partition set — checked whole against the
 *         branch before any write, and written only on apply
 * .why = a declaration always names the WHOLE set and replaces what stood (seed S46), so the
 *        check-then-write order is held here once for every write a driver can ask for, and
 *        the contract only parses flags and renders what this returns
 *
 * .note = a one-reviewer override with no set of its own grows a claim from @all, which is
 *         the set that reviewer reads today
 * .note = a one-reviewer scope whose stone is not on the route, or whose peer that stone's
 *         guard does not declare, refuses before any check — plan and apply alike
 * .note = a refusal writes naught; plan writes naught either way
 */
export const setRouteGuardPartitionsOfScope = async (input: {
  /** the route dir, relative to cwd */
  route: string;
  cwd: string;
  scope: RouteGuardPartitionScope;
  mode: 'plan' | 'apply';
  action: RouteGuardPartitionAction;
}): Promise<
  | { refusal: { headline: string; lines: string[] }; outcome: null }
  | {
      refusal: null;
      outcome:
        | { kind: 'clear'; replaced: string[] | null }
        | {
            kind: 'split';
            targets: string[];
            split: ReviewPartitionSplit;
            tokensByPath: Map<string, number>;
            replaced: string[] | null;
            claimed: Array<{ glob: string; into: string }> | null;
            pruned: Array<{ glob: string; from: string | null }> | null;
          };
    }
> => {
  // what the scope holds now
  const declared = await getOneRouteGuardPartitions({
    route: input.route,
    cwd: input.cwd,
  });
  const replaced = getAllPartitionFlagsOfScope({
    declared,
    scope: input.scope,
  });

  // the scope must name a stone the route holds and a reviewer its guard declares, before
  // any check or write — else the override lands under a key no lane reads. a clear of an
  // override that IS held is exempt, so a stale one (its stone since removed) can be cleared
  const isClearOfHeld = input.action.kind === 'clear' && replaced !== null;
  const scopeRefusal = isClearOfHeld
    ? null
    : await getOneRouteGuardPartitionScopeRefusal({
        route: input.route,
        cwd: input.cwd,
        scope: input.scope,
      });
  if (scopeRefusal) return { refusal: scopeRefusal, outcome: null };

  // a clear stands alone, since a set beside it is two asks
  if (input.action.kind === 'clear') {
    if (input.action.others.length > 0)
      return {
        refusal: {
          headline:
            '--partition none clears the scope, so it takes no other --partition',
          lines: [],
        },
        outcome: null,
      };
    if (input.mode === 'apply')
      await setRouteGuardPartitions({
        route: input.route,
        cwd: input.cwd,
        scope: input.scope,
        partition: [],
      });
    return { refusal: null, outcome: { kind: 'clear', replaced } };
  }

  // the whole set to check: the declared one, or the held one grown by each claim
  const proposed = getOneProposedSet({
    action: input.action,
    declared,
    replaced,
    route: input.route,
    scope: input.scope,
  });
  if (proposed.refusal) return { refusal: proposed.refusal, outcome: null };

  // the whole set is checked against the branch, before any write
  const check = await getOneRouteGuardPartitionsCheck({
    partition: proposed.partition,
    route: input.route,
    cwd: input.cwd,
    repairOf: input.scope,
  });
  if (check.refusal) return { refusal: check.refusal, outcome: null };

  // write it, on apply
  if (input.mode === 'apply')
    await setRouteGuardPartitions({
      route: input.route,
      cwd: input.cwd,
      scope: input.scope,
      partition: proposed.partition,
    });
  return {
    refusal: null,
    outcome: {
      kind: 'split',
      targets: check.targets,
      split: check.split,
      tokensByPath: check.tokensByPath,
      replaced,
      claimed: input.action.kind === 'claim' ? input.action.claims : null,
      pruned: input.action.kind === 'prune' ? input.action.prunes : null,
    },
  };
};

/**
 * .what = the whole set a declare, claim, or prune proposes, or the refusal it earns
 * .why = a claim never creates a partition, a prune never drops a glob no partition holds,
 *        and a scope with no set has none to edit
 */
const getOneProposedSet = (input: {
  action: Exclude<RouteGuardPartitionAction, { kind: 'clear' }>;
  declared: RouteGuardPartitions;
  replaced: string[] | null;
  route: string;
  scope: RouteGuardPartitionScope;
}):
  | { partition: string[]; refusal: null }
  | { partition: null; refusal: { headline: string; lines: string[] } } => {
  // a declaration is the whole set as given
  if (input.action.kind === 'declare')
    return { partition: input.action.partition, refusal: null };

  // a claim or prune edits the held set; an override with no set of its own edits @all's
  const held =
    input.replaced && input.replaced.length > 0
      ? input.replaced
      : (getAllPartitionFlagsOfScope({
          declared: input.declared,
          scope: { kind: 'all' },
        }) ?? []);
  if (held.length === 0)
    return {
      partition: null,
      refusal: {
        headline: `the scope holds no partition set, so there is no partition to ${input.action.kind === 'claim' ? 'claim into' : 'prune from'}`,
        lines: [
          "   └─ fix: declare the set first — rhx route.guard.partition --for review --peer @all --partition '<slug>=<globs>' ...",
        ],
      },
    };

  // a prune drops each glob from the partitions that hold it
  if (input.action.kind === 'prune') {
    const shrunk = asRouteGuardPartitionsPruned({
      partition: held,
      prunes: input.action.prunes,
    });
    if (shrunk.partition === null)
      return {
        partition: null,
        refusal: asRouteGuardPartitionPruneRefusal({
          unheld: shrunk.unheld,
          held,
          isFromNamed: input.action.prunes.some((prune) => prune.from !== null),
        }),
      };
    return { partition: shrunk.partition, refusal: null };
  }

  // every claim must name a held slug
  const grown = asRouteGuardPartitionsClaimed({
    partition: held,
    claims: input.action.claims,
  });
  if (grown.partition === null)
    return {
      partition: null,
      refusal: asRouteGuardPartitionClaimRefusal({
        unknownInto: grown.unknownInto,
        held,
        claims: input.action.claims,
        route: input.route,
        scope: input.scope,
      }),
    };
  return { partition: grown.partition, refusal: null };
};
