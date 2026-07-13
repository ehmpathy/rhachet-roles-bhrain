import { given, then, when } from 'test-fns';

import {
  getReviewTacticFromContent,
  TALLIED_FOOTER_PREFIX,
} from './getReviewTacticFromContent';

describe('getReviewTacticFromContent', () => {
  given('[case1] content with the tallied-by footer line', () => {
    const content = `├─ stdout
│  └─ looks solid, no blockers
└─ tallied
   ├─ 0 blockers
   ├─ 1 nitpick
   └─ ${TALLIED_FOOTER_PREFIX}fireworks/deepseek/v4-flash`;

    when('[t0] parsed', () => {
      then('recovers probabilistic (a sub-brain tallied it)', () => {
        expect(getReviewTacticFromContent({ content })).toBe('probabilistic');
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
        expect(getReviewTacticFromContent({ content })).toBe('deterministic');
      });
    });
  });

  given('[case3] empty content', () => {
    const content = ``;

    when('[t0] parsed', () => {
      then('recovers deterministic (no footer present)', () => {
        expect(getReviewTacticFromContent({ content })).toBe('deterministic');
      });
    });
  });
});
