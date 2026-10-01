import { formatRouteDriveWhere } from './formatRouteDriveWhere';

/**
 * .what = the opener every `route.drive` surface shares: the owl's vibe line, the `🗿` root,
 *         the `where do we go?` bucket, and the spacer its first branch hangs from
 * .why = every drive surface opened with its own copy of these lines. one source makes the
 *        form a property of the code rather than of each author's recall (`S13`), and it lets
 *        `formatStoneBrainOutcome` splice a branch into a halt's tree by an exact prefix
 *
 * .note = LINES, never a string — every caller appends its own branches beneath
 */
export const formatRouteDriveHeader = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
}): string[] => [
  `🦉 where were we?`,
  '',
  `🗿 route.drive`,
  ...formatRouteDriveWhere(input),
  `   │`,
];
