import { given, then, when } from 'test-fns';

import { asReviewLevelPourAnnounce } from './asReviewLevelPourAnnounce';

/**
 * .what = clamps the liveness line a level's pour announces under a pipe
 *
 * .why = `genContextCliEmit [case10]` proves the ABSENCE of spam under non-tty
 *        and proves naught about the presence of any signal. both claims held
 *        while the path emitted zero bytes from a level's launch to its settle
 *        — which is the point i009/r10 raised
 *
 * 🔴 .why = `[case3]` is the one that carries the design. the reviewer proposed
 *         a line per LANE, announced at launch; that form was built and
 *         measured nondeterministic, because a lane bound only by its level
 *         slot launches ahead of a grouped one. this transformer takes the
 *         roster instead, so the SAME bytes come back whatever order the lanes
 *         go in
 */
describe('asReviewLevelPourAnnounce', () => {
  given('[case1] a level with several members and no bound', () => {
    when('[t0] the pour announces', () => {
      then('it names the count and the roster in declared order', () => {
        const line = asReviewLevelPourAnnounce({
          level: 1,
          members: [
            { index: 1, slug: 'l1-a' },
            { index: 2, slug: 'l1-b' },
            { index: 3, slug: 'l1-c' },
          ],
          concurrency: null,
        });

        // 🔴 ONE MEMBER PER BRANCH, never a comma-joined line. the roster was
        //    `join(', ')` until i019, which rendered ~145 unbroken chars at this repo's
        //    own 12-wide fixture while EVERY other member list in the corpus used
        //    branches (`rule.forbid.snapshot-visual-blemishes`)
        expect(line).toEqual(
          [
            '🦉 l1 pours 3 lanes',
            '   ├─ r1:l1-a',
            '   ├─ r2:l1-b',
            '   └─ r3:l1-c',
          ].join('\n'),
        );
      });

      then('it carries no bound clause, because none was declared', () => {
        const line = asReviewLevelPourAnnounce({
          level: 1,
          members: [
            { index: 1, slug: 'a' },
            { index: 2, slug: 'b' },
          ],
          concurrency: null,
        });

        expect(line).not.toContain('at a time');
      });
    });
  });

  given('[case2] a level bounded at one', () => {
    when('[t0] the pour announces', () => {
      then('the bound is stated, so a serial pour reads as the valve', () => {
        const line = asReviewLevelPourAnnounce({
          level: 3,
          members: [
            { index: 5, slug: 'l3-a' },
            { index: 6, slug: 'l3-b' },
            { index: 7, slug: 'l3-c' },
          ],
          concurrency: 1,
        });

        // 🔴 without this clause a reader sees three lanes announce and one run,
        //    and reads the feature as absent rather than as the cap at work
        expect(line).toContain('≤1 at a time');
        expect(line).toContain('🦉 l3 pours 3 lanes · ≤1 at a time');
      });
    });
  });

  given('[case3] the same level, announced twice', () => {
    when('[t0] the roster is the DECLARED order', () => {
      then('the bytes are fixed by the roster, never by a launch race', () => {
        const declared = [
          { index: 5, slug: 'l3-a' },
          { index: 9, slug: 'l3-x' },
        ];

        const first = asReviewLevelPourAnnounce({
          level: 3,
          members: declared,
          concurrency: 1,
        });
        const again = asReviewLevelPourAnnounce({
          level: 3,
          members: declared,
          concurrency: 1,
        });

        // 🔴 the determinism claim, as an assertion rather than an argument.
        //    the transformer reads a roster and no clock, no slot, no settle
        //    order — so there is no input a scheduler could vary
        expect(first).toEqual(again);

        // 🔴 the DECLARED order, pinned as adjacent branches. `r5` precedes `r9`
        //    because the roster declared it so — never because it launched first
        expect(first).toContain(['   ├─ r5:l3-a', '   └─ r9:l3-x'].join('\n'));
      });
    });
  });

  given('[case4] a level with exactly one member', () => {
    when('[t0] the pour announces', () => {
      then(
        'it names the count and the sole member — the slotted path seals no header at inflight',
        () => {
          // .why = `genContextCliEmit` slotted path: `wave.launch(…); drawStatus(); return`
          //        — no header is sealed at inflight, and under a pipe `drawStatus` is a no-op.
          //        so a single-member level was byte-silent from launch to settle before this
          //        announce. the `< 2` early return that caused the silence is now dropped.
          //        multi-member levels still announce here once — no duplication
          expect(
            asReviewLevelPourAnnounce({
              level: 1,
              members: [{ index: 1, slug: 'solo' }],
              concurrency: null,
            }),
          ).toEqual(['🦉 l1 pours 1 lane', '   └─ r1:solo'].join('\n'));
        },
      );
    });
  });

  given('[case5] a level with no members at all', () => {
    when('[t0] the pour announces', () => {
      then('null — there is no pour to announce', () => {
        expect(
          asReviewLevelPourAnnounce({
            level: 2,
            members: [],
            concurrency: 4,
          }),
        ).toEqual(null);
      });
    });
  });
});
