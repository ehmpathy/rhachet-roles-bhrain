import * as path from 'path';

import { asPeerReviewOutputName } from '@src/domain.operations/asPeerReviewOutputName';
import { asPeerReviewOutputParts } from '@src/domain.operations/asPeerReviewOutputParts';

/**
 * .what = the slug prefix a lane poke's run files under — `poke.<the primer's slug>`
 * .why = a poke is a run of its own: it spends, and the meter must name that spend by
 *        stone, round, brain, and the reviewer whose head it sent. yet it is no round of
 *        the primer's lane — under the primer's own slug it would become that lane's prior
 *        and shift its ordinal. a slug of its own files the spend as a named row and leaves
 *        the lane's rounds as they were
 */
export const PREFIX_OF_LANE_POKE_SLUG = 'poke.';

/**
 * .what = the output path a lane poke's args record names, from its primer's output path
 * .why = the meter recovers a run's guard identity from the output path alone
 *        (`asReviewRunIdentity`), so the poke names a path in the primer's grammar, under
 *        the primer's stone, round, hash, and index, with the poke slug
 *
 * .note = no file is ever written at this path: a poke writes no report. it is a name
 *         for the meter to read, never an artifact a conversation reads
 * .note = a primer outside the guard grammar (a hand review) has no identity to derive
 *         from, so its poke names the primer's path as is, and files as the primer does
 */
export const asReviewLanePokeOutputPath = (input: {
  output: string;
}): string => {
  const parts = asPeerReviewOutputParts({ name: path.basename(input.output) });
  if (!parts) return input.output;
  return path.join(
    path.dirname(input.output),
    asPeerReviewOutputName({
      parts: { ...parts, slug: `${PREFIX_OF_LANE_POKE_SLUG}${parts.slug}` },
      kind: 'report',
    }),
  );
};
