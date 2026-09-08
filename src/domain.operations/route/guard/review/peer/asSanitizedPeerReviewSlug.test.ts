import { given, then, when } from 'test-fns';

import { asSanitizedPeerReviewSlug } from './asSanitizedPeerReviewSlug';

describe('asSanitizedPeerReviewSlug', () => {
  given('[case1] a plain slug with no separators', () => {
    when('[t0] it is sanitized', () => {
      then('it passes through verbatim', () => {
        expect(asSanitizedPeerReviewSlug({ slug: 'architect' })).toEqual(
          'architect',
        );
      });
    });
  });

  given('[case2] a rubric PATH used as a slug', () => {
    // the legacy shape the sanitize exists for: a slug that is really a command path.
    // left raw, its separators would fork the .given path into nested directories.
    when('[t0] it is sanitized', () => {
      then('every forward separator becomes a hyphen', () => {
        expect(
          asSanitizedPeerReviewSlug({ slug: '.test/mock-review.sh' }),
        ).toEqual('.test-mock-review.sh');
      });
    });

    when('[t1] the path uses back separators', () => {
      then('those are swapped too', () => {
        expect(
          asSanitizedPeerReviewSlug({ slug: 'briefs\\arch\\rules.md' }),
        ).toEqual('briefs-arch-rules.md');
      });
    });
  });

  given('[case3] the WRITE side and the READ side, on one slug', () => {
    // this is the whole reason the transformer exists. the write side builds the
    // .given filename from a sanitized slug; the read side validates `--that <slug>`
    // against that filename. the two were independent inline copies of one regex, so
    // they agreed by coincidence rather than by construction (r11 nitpick.1, i004).
    //
    // ⚠️ this case does NOT re-assert what the swap produces — [case2] does that. it
    //    asserts the property the duplication threatened: that one call site cannot
    //    disagree with another.
    const slugRaw = '.test/mock-review.sh';

    when('[t0] both sides sanitize the same raw slug', () => {
      then('they produce the identical filename segment', () => {
        const asWrittenByTheGuard = asSanitizedPeerReviewSlug({
          slug: slugRaw,
        });
        const asReadByTheGate = asSanitizedPeerReviewSlug({ slug: slugRaw });
        expect(asReadByTheGate).toEqual(asWrittenByTheGuard);
      });
    });

    when('[t1] an already-sanitized slug is sanitized again', () => {
      then('it is idempotent — the gate may safely re-apply it', () => {
        // the driver types the slug the PROMPT printed, which is already sanitized.
        // so the read side sanitizes a sanitized value, and that must be a no-op or
        // the printed command would never match.
        const once = asSanitizedPeerReviewSlug({ slug: slugRaw });
        expect(asSanitizedPeerReviewSlug({ slug: once })).toEqual(once);
      });
    });
  });
});
