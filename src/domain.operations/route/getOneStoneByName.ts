import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

/**
 * .what = the stone of a route snapshot that carries this name, or null where none does
 * .why = named, so the `stepRouteDrive` hard-stop gate reads as prose
 *        (`rule.forbid.inline-decode-friction`)
 *
 * .note = NULL, never undefined: callers feed a `| null` seam, so the coalesce lives here
 *         rather than at each call site (`rule.forbid.undefined-attributes`)
 *
 * .note = `getOne` carries its cardinality because the name is a route's stone key and at
 *         most one stone answers to it (`rule.require.get-set-gen-verbs`)
 */
export const getOneStoneByName = (input: {
  stones: RouteStone[];
  name: string;
}): RouteStone | null =>
  input.stones.find((stone) => stone.name === input.name) ?? null;
