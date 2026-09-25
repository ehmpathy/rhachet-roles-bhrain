import { given, then, when } from 'test-fns';

import { formatSelfReviewGuide } from './formatSelfReviewGuide';

describe('formatSelfReviewGuide', () => {
  const base = {
    stone: '1.vision',
    slug: 'all-done',
    route: '.behavior/v2026_03_08.feature',
  };

  given('[case1] a self review is in hand', () => {
    const output = formatSelfReviewGuide({
      ...base,
      selfReview: {
        reviewSelf: {
          slug: base.slug,
          say: 'have you grounded it in reality?',
        },
        index: 1,
        total: 3,
      },
    }).join('\n');

    when('[t0] format is called', () => {
      /**
       * 🔴 .why = all four verdicts close the same way — the guide, the owed path, the
       *           command. one operation owns that tail so the four branches compose it,
       *           rather than each one re-derives a confrontation of its own.
       */
      then('renders the guide', () => {
        expect(output).toContain('lets reflect');
        expect(output).toContain('have you grounded it in reality?');
      });

      then(
        'carries the progress counter, so the driver sees the ladder',
        () => {
          expect(output).toContain('review.self 1/3');
        },
      );

      then('names the owed path', () => {
        expect(output).toContain(
          '.behavior/v2026_03_08.feature/review/self/for.1.vision._.all-done.md',
        );
      });

      /**
       * .why = this is what makes a confrontation name its fix rather than merely report a
       *        failure. `--into` is required, so a command without it is not runnable.
       */
      then('names the run command, with --into already filled in', () => {
        expect(output).toContain('--as promised --that all-done');
        expect(output).toContain(
          '--into .behavior/v2026_03_08.feature/review/self/for.1.vision._.all-done.md',
        );
      });

      then('carries no rN level in the path', () => {
        expect(output).not.toContain('_.r1.all-done');
      });

      /**
       * .why = this operation owns the tail EVERY self-review confrontation renders, so it
       *        is the text a driver reads most and the text a reviewer can least afford to
       *        vibecheck only through a caller. its four callers each carry a snapshot;
       *        without one here, a shape change to the shared tail shows up in four diffs
       *        and in none of them at its source.
       *        ⇒ snapshot AND assertions, per `rule.require.snapshots`: the assertions above
       *          verify function; this verifies shape.
       */
      then('renders the shape a driver reads', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] no self review is in hand', () => {
    when('[t0] format is called with none supplied', () => {
      /**
       * ⚠️ .why = it renders no lines, which is correct AND is a trap for a test fixture.
       *           a snapshot taken without `selfReview` shows a confrontation that names no
       *           fix — an output no driver ever meets, since the real call site always
       *           supplies one. measured: it shrank a snapshot by 61 lines and read as a
       *           regression that was not there.
       */
      then('renders no lines, so the caller must supply one', () => {
        expect(formatSelfReviewGuide(base)).toEqual([]);
      });
    });
  });
});
