import { given, then, when } from 'test-fns';

import { getReviewCountsFromContent } from './getReviewCountsFromContent';

describe('getReviewCountsFromContent', () => {
  given('[case1] tree-bucket format with blockers and nitpicks', () => {
    const content = `├─ stdout
│  ├─
│  │
│  │  🪨 run solid skill repo=bhrain/role=reviewer/skill=review
│  │
│  │  🦉 let's review
│  │     ├─ brain: xai/grok/code-fast-1
│  │     ├─ focus: push
│  │     └─ scope
│  │        ├─ diffs: since-main
│  │        ├─ paths: **/*.ts
│  │        └─ join: intersect
│  │
│  │  🦉 needs your talons
│  │     ├─ logs: .log/bhrain/review/2026-06-12T11-24-23-005Z
│  │     ├─ review: .behavior/v2026_06_11.fix-route-review-peer-stdout/.reviews/5.1.execution.from_vision.peer-review.mech-failhides.md
│  │     └─ summary
│  │        ├─ 8 blockers 🔴
│  │        └─ 1 nitpick 🟠
│  │
│  └─
├─ stderr
│  ├─
│  │
│  └─`;

    when('[t0] parsed', () => {
      then('extracts correct counts', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.blockers).toBe(8);
        expect(counts.nitpicks).toBe(1);
      });
    });
  });

  given('[case2] yaml format with blockers: N', () => {
    const content = `blockers: 3
nitpicks: 5`;

    when('[t0] parsed', () => {
      then('extracts correct counts', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.blockers).toBe(3);
        expect(counts.nitpicks).toBe(5);
      });
    });
  });

  given('[case3] prose format with N blockers', () => {
    const content = `found 12 blockers and 4 nitpicks in the review`;

    when('[t0] parsed', () => {
      then('extracts correct counts', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.blockers).toBe(12);
        expect(counts.nitpicks).toBe(4);
      });
    });
  });

  given('[case4] no blockers or nitpicks', () => {
    const content = `all good, no issues found`;

    when('[t0] parsed', () => {
      then('returns zeros', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.blockers).toBe(0);
        expect(counts.nitpicks).toBe(0);
      });
    });
  });

  given('[case5] singular blocker/nitpick', () => {
    const content = `├─ 1 blocker 🔴
└─ 0 nitpicks`;

    when('[t0] parsed', () => {
      then('extracts correct counts', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.blockers).toBe(1);
        expect(counts.nitpicks).toBe(0);
      });
    });
  });
});
