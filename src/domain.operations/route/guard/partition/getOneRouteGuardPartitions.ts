import { ConstraintError } from 'helpful-errors';

import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

import { asRouteGuardPartitionsOrFault } from './asRouteGuardPartitionsOrFault';
import { asRouteGuardPartitionsPath } from './asRouteGuardPartitionsPath';

/**
 * .what = the partitions a route declares for its peer reviews, as `--partition` values
 * .why = whether code splits cleanly is a fact about the code, never about the rubric that
 *        reads it (seed S45) — so a route declares its partitions once, and every reviewer
 *        reuses them. the values are held verbatim, so `rhx review` parses them with the one
 *        parser its own `--partition` flag uses
 *
 * .note = each scope holds a WHOLE set (seed S46). an override replaces the standard set for
 *         its one reviewer, and is never merged with it slug by slug
 */
export interface RouteGuardPartitions {
  /** the standard set, read by every reviewer on every stone; null where none is declared */
  all: string[] | null;
  /** whole-set overrides for one reviewer on one stone, keyed `$stone/$peer` */
  byPeer: Record<string, string[]>;
}

/**
 * .what = the route's partition declaration, or an empty one where none is declared
 * .why = `rhx review` reads it on every guarded run, and `route.guard.partition` reads it
 *        to show what a new declaration replaces
 *
 * .note = a declaration that does not parse refuses loud rather than reads as empty: an
 *         empty read would run every lane whole, and the overflow it was declared to cure
 *         would return with no word of why (rule.forbid.failhide)
 */
export const getOneRouteGuardPartitions = async (input: {
  route: string;
  cwd: string;
}): Promise<RouteGuardPartitions> => {
  // read the declaration; an absent file — or an absent parent dir — is an empty declaration
  const filePath = asRouteGuardPartitionsPath(input);
  const content = await getOneFileTextOrNull({ path: filePath });
  if (content === null) return { all: null, byPeer: {} };

  // parse it, and refuse a shape the tool did not write
  const read = asRouteGuardPartitionsOrFault({ content });
  if (!read.declared)
    throw new ConstraintError(
      'the route partition declaration does not parse; re-declare it with rhx route.guard.partition',
      { path: filePath, fault: read.fault },
    );
  return read.declared;
};
