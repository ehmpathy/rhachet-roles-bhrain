import * as path from 'path';

/**
 * .what = the pattern of a pursuit route dir name: `v$date.education.pursuit.$role.$slug`
 */
const PATTERN_OF_PURSUIT =
  /^v(\d{4}_\d{2}_\d{2})\.education\.pursuit\.([a-z0-9-]+)\.([a-z0-9-]+)$/;

/**
 * .what = parse a pursuit route dir into its parts
 * .why = role, slug, and date live in the dir name, so no other file needs to state them
 * .note = null when the dir is no pursuit route
 */
export const asPursuitRouteParts = (input: {
  route: string;
}): { date: string; role: string; slug: string } | null => {
  const match = PATTERN_OF_PURSUIT.exec(path.basename(input.route));
  if (!match) return null;
  return { date: match[1]!, role: match[2]!, slug: match[3]! };
};
