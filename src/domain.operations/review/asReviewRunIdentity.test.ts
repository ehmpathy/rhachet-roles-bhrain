import { given, then, when } from 'test-fns';

import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';

/**
 * .what = unit tests for the read side of the guard's review-output grammar
 * .why = this transformer is the only bridge from a log dir (named by clock +
 *        pid + uuid) back to the reviewer, round, and stone that produced it.
 *        if it drifts from the write side in runStoneGuardReviews, every
 *        figure the meter reports silently collapses into `(unattributed)` —
 *        a meter that still prints a plausible total while it has lost the
 *        axis it exists to report.
 */
describe('asReviewRunIdentity', () => {
  given('[case1] an output path the guard wrote', () => {
    // .note = byte-identical to the template in runStoneGuardReviews.ts:
    //         `${stone}._.review.i${i}.${hash}.r${r}._.given.by_peer.${slug}.report.md`
    const output =
      '.behavior/v2026_09_08.feat/.reviews/peer/5.1.execution.from_vision._.review.i003.a1b2c3d.r002._.given.by_peer.mech-failhides.report.md';

    when('[t0] the identity is recovered', () => {
      then('every axis the meter reports on is present', () => {
        expect(asReviewRunIdentity({ output })).toEqual({
          route: '.behavior/v2026_09_08.feat',
          stone: '5.1.execution.from_vision',
          iteration: 3,
          hash: 'a1b2c3d',
          index: 2,
          slug: 'mech-failhides',
        });
      });
    });
  });

  given('[case5] an output path with no `.reviews/peer` parent', () => {
    // a hand `rhx review` writes wherever it was told, so it has no route.
    // an invented route would be worse than an absent one — it would
    // attribute real spend to a route that never drove it.
    when('[t0] the identity is recovered', () => {
      then('the route is ABSENT, never guessed', () => {
        const identity = asReviewRunIdentity({
          output:
            'scratch/5.1.execution.from_vision._.review.i003.a1b2c3d.r002._.given.by_peer.mech-failhides.report.md',
        });
        expect(identity?.route).toEqual(null);
        expect(identity?.slug).toEqual('mech-failhides');
      });
    });
  });

  given('[case6] an output path the guard wrote ABSOLUTE', () => {
    // the guard records whatever path shape it was invoked under, so both
    // shapes reach the meter and both must recover the same route
    when('[t0] the identity is recovered', () => {
      then('the absolute route survives whole', () => {
        const identity = asReviewRunIdentity({
          output:
            '/home/x/tree/.behavior/v2026_09_08.feat/.reviews/peer/1.vision._.review.i001.a1b2c3d.r001._.given.by_peer.repo-rules.report.md',
        });
        expect(identity?.route).toEqual(
          '/home/x/tree/.behavior/v2026_09_08.feat',
        );
      });
    });
  });

  given('[case2] a stone name that carries dots', () => {
    when('[t0] the identity is recovered', () => {
      then(
        'the dotted stone survives whole, never truncated at its first dot',
        () => {
          const identity = asReviewRunIdentity({
            output:
              '1.vision._.review.i001.deadbee.r000._.given.by_peer.repo-rules.report.md',
          });
          expect(identity?.stone).toEqual('1.vision');
          expect(identity?.slug).toEqual('repo-rules');
        },
      );
    });
  });

  given('[case3] a slug that carries dots, from a sanitized command', () => {
    when('[t0] the identity is recovered', () => {
      then('the dotted slug survives whole', () => {
        const identity = asReviewRunIdentity({
          output:
            '5.3.verification._.review.i012.cafe123.r007._.given.by_peer..test-mock-review.sh.report.md',
        });
        expect(identity?.slug).toEqual('.test-mock-review.sh');
        expect(identity?.iteration).toEqual(12);
        expect(identity?.index).toEqual(7);
      });
    });
  });

  given('[case4] an output path no guard wrote', () => {
    when('[t0] a hand `rhx review --output review.md` is metered', () => {
      then(
        'it answers null, so the caller buckets it rather than drops it',
        () => {
          expect(asReviewRunIdentity({ output: 'review.md' })).toEqual(null);
        },
      );
    });

    when('[t1] the stdout variant (no `.report` segment) is metered', () => {
      then(
        "it answers null — only the report path is the review's own output",
        () => {
          expect(
            asReviewRunIdentity({
              output:
                '1.vision._.review.i001.deadbee.r000._.given.by_peer.repo-rules.md',
            }),
          ).toEqual(null);
        },
      );
    });
  });
});
