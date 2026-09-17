import { BadRequestError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';

/**
 * .what = asserts a driver-supplied slug names a real peer reviewer on this stone
 * .why = three commands now take a reviewer slug — `--as absorbed --that <slug>`,
 *        `--as disputed --with <reviewer>`, and `--as conceded --with <reviewer>` — and each
 *        must accept exactly the same set. an inline copy per command would agree by
 *        coincidence rather than by construction, which is the defect class
 *        `asSanitizedPeerReviewSlug` was extracted to close one layer down.
 *
 * 🔴 the valid set is the live config UNION every reviewer that has SPOKEN on this stone —
 *    never the config alone. a RETIRED reviewer is absent from the config by definition (that
 *    is what `retired` MEANS), and the halt prompt names it and prints the command for it. a
 *    config-only check therefore rejects the one move the prompt just instructed, so the guard
 *    refuses its own guidance (r10 blocker.1, i004).
 *
 * ⚠️ the union does NOT weaken the typo guard, which is what this check is for: a mistyped
 *    slug names no configured reviewer AND has authored no given, so it still throws — and the
 *    listed options name every slug the driver could legitimately pass.
 *
 * .note = the driver types the SANITIZED form, because that is the form the halt prompt
 *         prints. the sanitize is the WRITE side's grammar, so it is reached for, never
 *         re-typed.
 *
 * .note = the error names no FLAG, deliberately. the MESSAGE is exactly the one
 *         `--as absorbed` has always thrown, so this extraction preserves what a driver
 *         reads and its pinned snapshots pass untouched — which is the PROOF that it does. a
 *         flag name would be a field no consumer reads, bought at the cost of that proof.
 *
 * ⚠️ one metadata field is not identical: `stone` reports the RESOLVED stone name, where the
 *    inline copy reported the driver's raw `--stone` pattern. they coincide unless the driver
 *    passed a glob, in which case the resolved name is the more useful of the two — it says
 *    which stone the check actually ran against.
 */
export const assertValidPeerReviewSlug = (input: {
  slug: string;
  stone: RouteStone;
  slugsSpoken: string[];
}): void => {
  const peerReviews = input.stone.guard
    ? getGuardPeerReviews(input.stone.guard)
    : [];
  const slugsConfigured = peerReviews.map((r) =>
    asSanitizedPeerReviewSlug({ slug: r.slug }),
  );
  const validSlugs = [
    ...new Set([...slugsConfigured, ...input.slugsSpoken]),
  ].sort();

  if (!validSlugs.includes(input.slug))
    throw new BadRequestError(
      `invalid peer reviewer slug: "${input.slug}". valid options: ${validSlugs.join(', ')}`,
      { stone: input.stone.name, slug: input.slug, validSlugs },
    );
};
