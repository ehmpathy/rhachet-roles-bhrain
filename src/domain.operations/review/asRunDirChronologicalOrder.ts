import * as path from 'path';

import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = a sort comparator that orders review runs by the time their log dir was minted
 * .why = a log dir basename opens with an escaped iso stamp (`genLogDirName`), so a
 *        code-unit compare of basenames is a time compare. one home for that order keeps
 *        the lane ordinals and every later-than check from a drift apart
 * .note = code-unit order via compareStrings, never localeCompare: a locale's collation
 *         is host state, so one corpus could grade its runs two ways on two machines
 * .note = a named `{ a, b }` input, as `asStabilityOrder` takes; a caller passes it to
 *         `.sort((a, b) => asRunDirChronologicalOrder({ a, b }))`
 */
export const asRunDirChronologicalOrder = (input: {
  a: { dir: string };
  b: { dir: string };
}): number =>
  compareStrings(path.basename(input.a.dir), path.basename(input.b.dir));
