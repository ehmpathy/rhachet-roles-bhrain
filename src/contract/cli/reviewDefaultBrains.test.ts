import { getBrainAtomsByOpenRouter } from 'rhachet-brains-openrouter';
import { given, then, when } from 'test-fns';

import { BRAIN_DEFAULT_OF_REVIEW } from '@src/domain.operations/brain/BRAIN_DEFAULT_OF_REVIEW';
import { FIXED_FALLBACK_BRAIN } from '@src/domain.operations/brain/FIXED_FALLBACK_BRAIN';

/**
 * .what = clamp: every default brain is VERSIONLESS, and is a slug the sdk registers as is
 * .why = two defects, one per assertion:
 *        - a PINNED default strands every lane the day its version retires
 *          (rule.require.versionless-brain-defaults)
 *        - a default handed to genContextBrain that no package registers throws
 *          BrainChoiceNotFoundError from every guard lane at once, since the lookup
 *          matches registered slugs only. that shipped once, green on every type check;
 *          the registered half is its clamp
 *
 * .note = a versionless default is an openrouter TIER slug: it names no version, and the
 *         package registers it directly, so the choice passes straight to genContextBrain.
 *         the mark of a versionless slug is the absence of a version number, so the clamp
 *         asserts no digit in the slug
 */
describe('reviewDefaultBrains', () => {
  const DEFAULTS = {
    // `rhx review` and `rhx review.by` both read this one constant, so one row clamps both
    review: BRAIN_DEFAULT_OF_REVIEW,
    'tally fallback': FIXED_FALLBACK_BRAIN,
  };

  given('[case1] the slugs the brains sdk registers', () => {
    const slugsRegistered = getBrainAtomsByOpenRouter().map(
      (atom) => atom.slug,
    );

    Object.entries(DEFAULTS).forEach(([name, slug], index) => {
      when(`[t${index}] the ${name} default is looked up`, () => {
        then('it is versionless', () => {
          expect(slug).not.toMatch(/\d/);
        });

        then('it is registered', () => {
          expect(slugsRegistered).toContain(slug);
        });
      });
    });
  });
});
