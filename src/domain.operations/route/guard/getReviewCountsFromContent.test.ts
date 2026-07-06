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
│  │     ├─ brain: fireworks/deepseek/v4-flash
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
      then('extracts correct counts and detects both', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(true);
        expect(counts.blockers).toBe(8);
        expect(counts.nitpicks).toBe(1);
      });
    });
  });

  given('[case2] yaml format with blockers: N', () => {
    const content = `blockers: 3
nitpicks: 5`;

    when('[t0] parsed', () => {
      then('extracts correct counts and detects both', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(true);
        expect(counts.blockers).toBe(3);
        expect(counts.nitpicks).toBe(5);
      });
    });
  });

  given('[case3] prose format with N blockers', () => {
    const content = `found 12 blockers and 4 nitpicks in the review`;

    when('[t0] parsed', () => {
      then('extracts correct counts and detects both', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(true);
        expect(counts.blockers).toBe(12);
        expect(counts.nitpicks).toBe(4);
      });
    });
  });

  given('[case4] prose with no numeric counts', () => {
    const content = `all good, no issues found`;

    when('[t0] parsed', () => {
      then('is undetected (must not silently read as zero)', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(false);
      });
    });
  });

  given('[case5] singular blocker/nitpick with explicit zero', () => {
    const content = `├─ 1 blocker 🔴
└─ 0 nitpicks`;

    when('[t0] parsed', () => {
      then('extracts correct counts and detects both', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(true);
        expect(counts.blockers).toBe(1);
        expect(counts.nitpicks).toBe(0);
      });
    });
  });

  given('[case6] explicit zeros for both dimensions', () => {
    const content = `0 blockers
0 nitpicks`;

    when('[t0] parsed', () => {
      then('detects both as a clean review', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(true);
        expect(counts.blockers).toBe(0);
        expect(counts.nitpicks).toBe(0);
      });
    });
  });

  given('[case7] only blockers declared, nitpicks absent', () => {
    const content = `3 blockers`;

    when('[t0] parsed', () => {
      then('is undetected (nitpicks dimension absent)', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(false);
      });
    });
  });

  given('[case8] only nitpicks declared, blockers absent', () => {
    const content = `2 nitpicks`;

    when('[t0] parsed', () => {
      then('is undetected (blockers dimension absent)', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(false);
      });
    });
  });

  given('[case9] word-form "none" is not a numeric count', () => {
    const content = `blockers = none
nitpicks = none`;

    when('[t0] parsed', () => {
      then('is undetected (numbers-only contract)', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(false);
      });
    });
  });

  given('[case10] empty stdout (reviewer crashed)', () => {
    const content = ``;

    when('[t0] parsed', () => {
      then('is undetected', () => {
        const counts = getReviewCountsFromContent({ content });
        expect(counts.detected).toBe(false);
      });
    });
  });

  given(
    '[case11] incidental prose count precedes the authoritative summary',
    () => {
      // a reviewer that mentions an earlier count in prose then declares the real
      // count last — the authoritative declaration is the LAST one, not the first
      const content = `i reviewed the 3 blockers from last round. all fixed.
0 blockers
0 nitpicks`;

      when('[t0] parsed', () => {
        then(
          'takes the last declaration, not the incidental first mention',
          () => {
            const counts = getReviewCountsFromContent({ content });
            expect(counts.detected).toBe(true);
            expect(counts.blockers).toBe(0);
            expect(counts.nitpicks).toBe(0);
          },
        );
      });
    },
  );
});
