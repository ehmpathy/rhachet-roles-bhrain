// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionRepair } from '@src/domain.operations/review/partition/asReviewPartitionRepair';

import { asRouteGuardPartitionCommand } from './asRouteGuardPartitionCommand';
import type { RouteGuardPartitionScope } from './RouteGuardPartitionScope';

/**
 * .what = a declared route partition set, repaired so it claims each unclaimed file, plus the
 *         smallest `route.guard.partition` command that closes the gap
 * .why = the stone entrance proposes the repair as one paste-ready command — a `--claim …
 *        --into <slug>` per partition where held partitions fit, the whole set only where a new
 *        domain partition is owed (seeds S51, S53). the placement and fold are the partition
 *        contract's own (`asReviewPartitionRepair`), so a review run that refuses a route set
 *        proposes the very same fix (rule.forbid.workarounds)
 */
export const asRouteGuardPartitionRepair = (input: {
  partition: string[];
  unclaimed: string[];
  /** the slugs of the partitions that lack the bound route — each gains `$route/**` */
  routeAbsentFrom: string[];
  route: string;
  scope: RouteGuardPartitionScope;
}): {
  partition: string[];
  placed: Array<{ path: string; slug: string; glob: string }>;
  form: 'claim' | 'declare' | 'append';
  command: string;
} =>
  asReviewPartitionRepair({
    partition: input.partition,
    unclaimed: input.unclaimed,
    routeAbsentFrom: input.routeAbsentFrom,
    route: input.route,
    command: asRouteGuardPartitionCommand({
      route: input.route,
      scope: input.scope,
    }),
  });
