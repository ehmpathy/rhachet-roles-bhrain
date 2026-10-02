import { UnexpectedCodePathError } from 'helpful-errors';

import { formatRouteDriveHeader } from '../drive/formatRouteDriveHeader';
import { asStoneBrainEffort } from './asStoneBrainEffort';
import { asStoneBrainSlug } from './asStoneBrainSlug';
import { formatStoneBrainUndispatched } from './formatStoneBrainUndispatched';
import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = renders the stone's drive output, with the prescribed-brain HALT applied
 * .why = `undispatched` — a brain asked for, no switch sent — must fail loud (the wish's
 *        bound), so it owns a branch; every other outcome passes the drive through
 *
 * .note = `requested` and `inherited` add no branch: the brain is ONE fact, shown on the
 *         drive's `where do we go?` line beside `route` and `stone` (`asStoneBrainSlug`)
 * .note = PURE
 * 🔴 .note = the halt is a BRANCH of the drive's own tree, never a second layout (`S13`):
 *           - `'replace'` (a work surface) — the drive's header, then the halt as its only
 *             branch. an unswitched stone's `--as passed` prose may never sit below it
 *             (case=8 [t2])
 *           - `'prepend'` (a route halt) — the halt spliced in as the FIRST branch of the
 *             route halt's tree, above that halt's own branch, so one stdout carries one
 *             owl, one root, and both halts
 */
export const formatStoneBrainOutcome = (
  input: {
    route: string;
    stone: string;
    outcome: StoneBrainOutcome;
    drive: string;
  },
  options?: { whenUndispatched?: 'replace' | 'prepend' },
): string => {
  const { outcome } = input;

  // every outcome but `undispatched` → PASS THROUGH, byte for byte
  // .why = `none` is every extant guard, so it adds no line (case=10); the other two are
  //        already named on the drive's `where do we go?` line
  if (outcome.outcome !== 'undispatched') return input.drive;

  // the header every drive surface opens with, which names the prescription the halt concerns
  const header = formatRouteDriveHeader({
    route: input.route,
    stone: input.stone,
    brain: asStoneBrainSlug({ outcome }),
    effort: asStoneBrainEffort({ outcome }),
  });

  // a work surface → the halt REPLACES the body, as the tree's only branch
  if (options?.whenUndispatched !== 'prepend')
    return [
      ...header,
      ...formatStoneBrainUndispatched({
        guard: outcome.guard,
        cause: outcome.cause,
        isLast: true,
      }),
    ].join('\n');

  // a route halt → splice the brain branch in above the route halt's own branch
  // .why = every route halt opens with this exact header, so the prefix is a contract; a
  //        miss is a render defect in this repo, and it fails loud rather than stacks two trees
  const headerText = `${header.join('\n')}\n`;
  if (!input.drive.startsWith(headerText))
    throw new UnexpectedCodePathError(
      'route halt does not open with the shared drive header; the brain halt cannot splice in',
      { stone: input.stone, drive: input.drive },
    );
  return [
    ...header,
    ...formatStoneBrainUndispatched({
      guard: outcome.guard,
      cause: outcome.cause,
      isLast: false,
    }),
    `   │`,
    input.drive.slice(headerText.length),
  ].join('\n');
};
