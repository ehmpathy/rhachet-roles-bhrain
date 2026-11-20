import { createHash } from 'crypto';

import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';

/**
 * .what = a short hash of what a human reads when they rule a fulcrum: every field but the verdict
 *         and the status, plus the argument body
 * .why = a ledger row binds a verdict to the entry the human saw. a later edit — a concern added to
 *        `holds`, a changed `lean`, a rewritten argument — changes this hash, so the old row proves
 *        naught for the new content and the entry owes the human again
 *
 * .note = `verdict` and `status` are left out: the lever itself writes both, so the hash it stamps
 *         must survive its own write. the fields are listed in a fixed order, so key order in the
 *         yaml never moves the hash
 */
export const asFulcrumContentSeen = (input: {
  frontmatter: FulcrumFrontmatter;
  body: string;
}): string => {
  const { frontmatter } = input;
  const seen = JSON.stringify([
    frontmatter.case,
    frontmatter.rework,
    frontmatter.ground,
    frontmatter.confidence,
    frontmatter.owed,
    frontmatter.holds,
    frontmatter.lean,
    frontmatter.reflect,
    input.body.trim(),
  ]);
  return createHash('sha256').update(seen).digest('hex').slice(0, 16);
};
