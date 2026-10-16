import { given, then, when } from 'test-fns';

import { getOneReviewTacticFromContent } from './getOneReviewTacticFromContent';
import { TALLIED_FOOTER_PREFIX } from './TALLIED_FOOTER_PREFIX';

describe('getOneReviewTacticFromContent', () => {
  given('[case1] content with the tallied-by footer line', () => {
    const content = `├─ stdout
│  └─ looks solid, no blockers
└─ tallied
   ├─ 0 blockers
   ├─ 1 nitpick
   └─ ${TALLIED_FOOTER_PREFIX}openrouter/deepseek/flash`;

    when('[t0] parsed', () => {
      then('recovers probabilistic (a sub-brain tallied it)', () => {
        expect(getOneReviewTacticFromContent({ content })).toBe(
          'probabilistic',
        );
      });
    });
  });

  given('[case2] content without the tallied-by footer line', () => {
    const content = `├─ stdout
│  ├─ 0 blockers
│  └─ 2 nitpicks
└─ tallied
   ├─ 0 blockers
   └─ 2 nitpicks`;

    when('[t0] parsed', () => {
      then('recovers deterministic (read verbatim)', () => {
        expect(getOneReviewTacticFromContent({ content })).toBe(
          'deterministic',
        );
      });
    });
  });

  given('[case3] empty content', () => {
    const content = ``;

    when('[t0] parsed', () => {
      then('recovers deterministic (no footer present)', () => {
        expect(getOneReviewTacticFromContent({ content })).toBe(
          'deterministic',
        );
      });
    });
  });

  given('[case4] stdout that QUOTES the footer phrase, with no footer', () => {
    // a reviewer in this repo reads the source that holds the phrase, and quotes it
    const content = `├─ stdout
│  ├─ see: expect(result).toContain('${TALLIED_FOOTER_PREFIX}');
│  ├─ 0 blockers
│  └─ 1 nitpick
└─ tallied
   ├─ 0 blockers
   └─ 1 nitpick`;

    when('[t0] parsed', () => {
      then('recovers deterministic (a quote is not a footer)', () => {
        expect(getOneReviewTacticFromContent({ content })).toBe(
          'deterministic',
        );
      });
    });
  });
});
