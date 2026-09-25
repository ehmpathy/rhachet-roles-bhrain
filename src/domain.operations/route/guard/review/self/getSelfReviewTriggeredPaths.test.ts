import { given, then, when } from 'test-fns';

import {
  asSelfReviewTriggeredGlob,
  getSelfReviewTriggeredPaths,
} from './getSelfReviewTriggeredPaths';

describe('getSelfReviewTriggeredPaths', () => {
  const input = {
    stone: '1.vision',
    slug: 'has-grounded-in-reality',
    route: '.behavior/v2026_03_08.feature',
  };

  given('[case1] a stone, a slug, and a route', () => {
    const paths = getSelfReviewTriggeredPaths(input);

    when('[t0] the marker paths are computed', () => {
      then('all three markers land under the route .route dir', () => {
        expect(paths.sincePath).toEqual(
          '.behavior/v2026_03_08.feature/.route/1.vision.guard.selfreview.has-grounded-in-reality.triggered.since',
        );
        expect(paths.uptilPath).toEqual(
          '.behavior/v2026_03_08.feature/.route/1.vision.guard.selfreview.has-grounded-in-reality.triggered.uptil',
        );
        expect(paths.attemptsPath).toEqual(
          '.behavior/v2026_03_08.feature/.route/1.vision.guard.selfreview.has-grounded-in-reality.triggered.attempts',
        );
      });

      /**
       * 🔴 .why = the key is (stone, slug) and NAUGHT else. a hash in this filename is what
       *           made a repair mint a fresh report, restart the clock, and clear the
       *           attempt count — the defect this round removes. this operation is the one
       *           place that shape is derived, so it is the one place a hash could return.
       */
      then('carries no hash — the key is (stone, slug) alone', () => {
        expect(paths.baseFilename).toEqual(
          '1.vision.guard.selfreview.has-grounded-in-reality.triggered',
        );
        expect(paths.sincePath).toContain(`${paths.baseFilename}.since`);
        expect(paths.uptilPath).toContain(`${paths.baseFilename}.uptil`);
        expect(paths.attemptsPath).toContain(`${paths.baseFilename}.attempts`);
      });

      /**
       * 🔴 .why = the i013 blocker, clamped at the grain it is DECIDED at. the tally lived
       *           inside `.since` until then, so every tally write rewrote the one file whose
       *           mtime the gate reads — a transient wrong `askedAt` for any concurrent
       *           reader, and a permanent one if the `fs.utimes` restore faulted after the
       *           write landed. a separate FILE removes both by construction.
       *           ⇒ so the property is not "there are three paths", it is "the diagnostic
       *             and the gate operand are different files", and this is the one place a
       *             re-fusion could be typed. the behavioral suites catch a re-fusion too,
       *             loudly — but they catch it three layers from where it is decided.
       */
      then(
        'the diagnostic marker is a DIFFERENT file from the gate operand',
        () => {
          expect(paths.attemptsPath).not.toEqual(paths.sincePath);
          expect(paths.attemptsPath).not.toEqual(paths.uptilPath);
        },
      );

      /**
       * .why = the rewind enumerates these with `…triggered.*`, so all three markers must sit
       *        on one base. two bases would leave a rewind that clears part of the record.
       */
      then('all three markers share one base filename', () => {
        expect(paths.sincePath.replace(/\.since$/, '')).toEqual(
          paths.uptilPath.replace(/\.uptil$/, ''),
        );
        expect(paths.attemptsPath.replace(/\.attempts$/, '')).toEqual(
          paths.uptilPath.replace(/\.uptil$/, ''),
        );
      });
    });
  });

  given('[case2] one input, computed twice', () => {
    when('[t0] the operation is called again', () => {
      /**
       * 🔴 .why = the key must depend on the three declared inputs and on no ambient state.
       *           a clock, a counter, or a hash read from disk would each make two calls
       *           disagree — and a key that disagrees with itself is what an ordinal did on
       *           this very stone, derived three ways at three call sites.
       */
      then('the result is identical — no ambient state enters the key', () => {
        expect(getSelfReviewTriggeredPaths(input)).toEqual(
          getSelfReviewTriggeredPaths(input),
        );
      });
    });
  });

  given('[case3] two slugs on one stone', () => {
    when('[t0] the marker paths are computed for each', () => {
      /**
       * 🔴 .why = the lane invariant, at the key level: no lane's verdict may depend on
       *           another lane. two slugs that shared a marker path would make one lane's
       *           promise clear the other's, so the fork could not be correct.
       */
      then(
        'the paths differ, so one lane cannot read another lane marker',
        () => {
          const first = getSelfReviewTriggeredPaths({
            ...input,
            slug: 'lane-a',
          });
          const second = getSelfReviewTriggeredPaths({
            ...input,
            slug: 'lane-b',
          });
          expect(first.sincePath).not.toEqual(second.sincePath);
          expect(first.uptilPath).not.toEqual(second.uptilPath);
        },
      );
    });
  });

  given('[case4] one slug on two stones', () => {
    when('[t0] the marker paths are computed for each', () => {
      /**
       * .why = the slug set is shared across stones, so a key on the slug alone would make a
       *        promise on one stone clear the same review on the next.
       */
      then(
        'the paths differ, so a stone cannot inherit another stone marker',
        () => {
          const first = getSelfReviewTriggeredPaths({
            ...input,
            stone: '1.vision',
          });
          const second = getSelfReviewTriggeredPaths({
            ...input,
            stone: '2.criteria',
          });
          expect(first.sincePath).not.toEqual(second.sincePath);
        },
      );
    });
  });

  given('[case5] the glob the rewind archives with', () => {
    const stone = '1.vision';
    const glob = asSelfReviewTriggeredGlob({ stone });

    when('[t0] the glob is derived', () => {
      then('it reaches every slug of the stone, and both marker kinds', () => {
        // .why = the literal, on the page, so a reviewer can read what the rewind reaches
        //        without a run. the `.*` tail is what covers `.since` AND `.uptil` — the
        //        extant cleanup wrote `.md` there and matched zero of them
        expect(glob).toEqual('.route/1.vision.guard.selfreview.*.triggered.*');
      });
    });

    when('[t1] the glob is compared against the paths it must match', () => {
      /**
       * 🔴 .why = the clamp that closes the MECHANISM rather than the value. the headline
       *           incident was a glob hand-typed beside the operation that builds the paths,
       *           and the two diverged in silence — 13 live markers on one route. a literal
       *           assertion alone would not catch that: it pins what the glob SAYS, never
       *           that it AGREES with the filenames it is aimed at.
       *
       * ⚠️ .why the substitution = bind the glob's slug wildcard to a real slug and it must
       *           reproduce that slug's own base filename. so the two derivations are checked
       *           against each other rather than each against a literal a maintainer could
       *           update on one side alone.
       */
      then('the two derivations agree, so they cannot drift apart', () => {
        const paths = getSelfReviewTriggeredPaths({
          stone,
          slug: 'lane-a',
          route: '.behavior/v2026_03_08.feature',
        });
        expect(glob.replace('*', 'lane-a')).toEqual(
          `.route/${paths.baseFilename}.*`,
        );
      });
    });
  });
});
