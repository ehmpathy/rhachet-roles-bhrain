/**
 * .what = which reviewers a partition declaration applies to
 * .why = `@all` is the standard (seed S45): every reviewer on every stone. a scope of one
 *        reviewer on one stone is an override, and replaces the standard set for that one
 */
export type RouteGuardPartitionScope =
  | { kind: 'all' }
  | { kind: 'peer'; stone: string; peer: string };
