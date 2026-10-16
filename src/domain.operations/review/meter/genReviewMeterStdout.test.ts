import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { genReviewMeterReport } from '@src/domain.operations/review/meter/genReviewMeterReport';
import { genReviewMeterStdout } from '@src/domain.operations/review/meter/genReviewMeterStdout';

/**
 * .what = builds one metered run for a fixture corpus
 * .why = keeps each case's intent legible — the case says what varies, not how a
 *        record is shaped
 */
const genMeteredRun = (input: {
  slug: string;
  stone: string;
  iteration: number;
  index: number;
  tokens: { input: number; cacheSet: number; cacheGet: number; output: number };
  cost: string;
  provider?: string;
}): Extract<ReviewRunMeter, { grade: 'metered' }> => ({
  dir: `.log/bhrain/review/stamp.pid1.${input.slug}-i${input.iteration}`,
  head: null,
  brain: null,
  provider: input.provider ?? null,
  identity: {
    stone: input.stone,
    iteration: input.iteration,
    route: '.behavior/v2026_01_01.feat-demo',
    hash: 'a1b2c3d',
    index: input.index,
    slug: input.slug,
  },
  defect: null,
  grade: 'metered',
  scope: { rulesCount: 3, refsCount: 0, targetsCount: 42, focus: 'push' },
  tokens: input.tokens,
  cost: { total: asIsoPrice(input.cost), cacheSaved: null },
  // unread by default, so a case that is not about composition renders the census
  // as `absent`; `[case10]` varies this field alone
  prompt: null,
});

describe('genReviewMeterStdout', () => {
  given('[case1] a corpus of guard-run reviews, two of them unknown', () => {
    const runs: ReviewRunMeter[] = [
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 0,
        tokens: { input: 420_000, cacheSet: 0, cacheGet: 0, output: 3_100 },
        cost: '$0.2100',
      }),
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 2,
        index: 0,
        tokens: { input: 455_000, cacheSet: 0, cacheGet: 0, output: 2_900 },
        cost: '$0.2275',
      }),
      genMeteredRun({
        slug: 'mech-failhides',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 1,
        tokens: {
          input: 180_000,
          cacheSet: 0,
          cacheGet: 20_000,
          output: 1_400,
        },
        cost: '$0.0900',
      }),

      // the whole point of the absent/zero distinction: this lane compiled a
      // prompt, so the brain may well have been billed — then it died before it
      // wrote metrics. its spend is UNRECORDED, and must never read as $0.00.
      {
        dir: '.log/bhrain/review/stamp.pid1.overflowed',
        head: null,
        brain: null,
        provider: null,
        identity: {
          stone: '5.1.execution.from_vision',
          iteration: 2,
          route: '.behavior/v2026_01_01.feat-demo',
          hash: 'a1b2c3d',
          index: 2,
          slug: 'behavior-intent-coverage',
        },
        defect: null,
        grade: 'unknown',
        scope: {
          rulesCount: 1,
          refsCount: 5,
          targetsCount: 293,
          focus: 'push',
        },
        tokens: null,
        cost: null,
        prompt: null,
      },

      // a run refused at validation — it never reached the brain, so nil spend is a
      // FACT here, and the meter reports it as a measured $0 rather than as absent
      {
        dir: '.log/bhrain/review/stamp.pid1.refused',
        head: null,
        brain: null,
        provider: null,
        identity: {
          stone: '5.1.execution.from_vision',
          iteration: 2,
          route: '.behavior/v2026_01_01.feat-demo',
          hash: 'a1b2c3d',
          index: 3,
          slug: 'arch-smell-scopeleaks',
        },
        defect: null,
        grade: 'refused',
        scope: { rulesCount: 0, refsCount: 0, targetsCount: 0, focus: 'push' },
        tokens: null,
        cost: null,
        prompt: null,
      },
    ];

    when('[t0] the report is rendered', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });

      then('the tree reads as a scannable human surface', () => {
        expect(stdout).toContain(
          '├─ runs: 5 (3 metered · 1 refused · 1 unknown 🟡)',
        );
        expect(stdout).toContain(
          '└─ cost: $0.527500  🟡 +1 unknown (cost unrecorded, not zero)',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('an `unknown` run renders as absent, never as a zero', () => {
        // the unaccounted half of the law. this lane compiled a prompt and may
        // well have been charged, so BOTH its token count and its spend are
        // unknown — and a `0` in either column would read as "it sent none"
        const rowOfUnknown = stdout
          .split('\n')
          .find((line) => line.includes('behavior-intent-coverage'));
        expect(rowOfUnknown).toBeDefined();
        expect(rowOfUnknown).toContain('— prompt');
        expect(rowOfUnknown).toContain('— cached');
        expect(rowOfUnknown).not.toContain('$');
        expect(rowOfUnknown).toContain('unknown (cost unrecorded, not zero)');
        // and the corpus total says plainly that it is incomplete
        expect(stdout).toContain('1 unknown');
      });

      then(
        '🔴 ONE grade reads as ONE word, across every value of `--of`',
        () => {
          /**
           * .note = the clamp the `of`-axis divergence never had, and its absence is
           *         why it survived fourteen review rounds: the two words were each
           *         pinned by a snapshot of their own surface, so a repair would
           *         have redded a green test rather than greened a red one.
           *         `ReviewRunGrade` is `'metered' | 'refused' | 'unknown'`. the
           *         grove census (`genReviewGroveStdout`) renders those three words
           *         verbatim, so this surface must too — a second word for a
           *         declared grade is a synonym on a published cli
           *         (rule.forbid.domain-term-synonyms). this asserts the absence of
           *         every off-vocabulary word, never the presence of the right one
           *         — a presence check passes while a synonym sits beside it.
           */
          const WORDS_FORBIDDEN = ['unmetered', 'unpriced', 'unrecorded run'];

          // the corpus census names a grade this render has no word of its own for
          for (const word of WORDS_FORBIDDEN)
            expect(stdout).not.toContain(word);

          // and the unknown runs this fixture holds are counted under the declared word
          expect(stdout).toContain('1 unknown');
        },
      );

      then('a refused run renders a KNOWN nil, never an absent mark', () => {
        // the inverse half, and the reason the two grades are separate types: a
        // refusal never reached the brain, so its nil cost is a FACT. to render
        // it `—` would throw away the one distinction the grade exists to carry
        const rowOfRefused = stdout
          .split('\n')
          .find((line) => line.includes('arch-smell-scopeleaks'));
        expect(rowOfRefused).toBeDefined();
        expect(rowOfRefused).toContain('0 prompt');
        expect(rowOfRefused).toContain('$0');
      });

      then('the cache hit rate rides beside the token count', () => {
        expect(stdout).toContain('cached');
        // 20k of 1,075k prompt tokens across the corpus
        expect(stdout).toContain('of prompt tokens served from cache');
      });

      then('every axis the requirement names is reported', () => {
        expect(stdout).toContain('by reviewer');
        expect(stdout).toContain('by stone');
        expect(stdout).toContain('by round');
      });

      then('each ranked axis names the figure it ranks by', () => {
        // the grove ranks on full-rate tokens and the tree on prompt tokens (F8),
        // so each header names its own figure, and a lane that leads one page and
        // trails the other reads as two rankings, never a mis-sort
        expect(stdout).toContain('by reviewer — heaviest prompt first');
        expect(stdout).toContain('by stone — heaviest prompt first');
        // a round reads in sequence, so it claims no rank
        expect(stdout).not.toContain('by round — heaviest');
      });
    });
  });

  given('[case2] a corpus where not one run was metered', () => {
    const runs: ReviewRunMeter[] = [
      {
        dir: '.log/bhrain/review/stamp.pid1.a',
        head: null,
        brain: null,
        provider: null,
        identity: null,
        defect: null,
        grade: 'unknown',
        scope: null,
        tokens: null,
        cost: null,
        prompt: null,
      },
    ];

    when('[t0] the report is rendered', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });

      then(
        'the cache rate is absent, because a rate over zero is undefined',
        () => {
          // not "0.0%" — a corpus that measured naught must not read as a corpus
          // that cached naught
          //
          // .note = the figure moved into the `levers` block, which pads `input:`
          //         and `cache:` to one column, so the gap is matched rather than
          //         counted. the INTENT is unchanged and the assertion is less
          //         brittle than it was: it pinned an alignment it never meant to
          //         govern (rule.require.review-test-changes)
          expect(stdout).toMatch(/cache: +— of prompt tokens/);
          expect(stdout).not.toContain('cache: 0.0% of prompt tokens');
        },
      );

      then('🔴 the absent rate renders inside the LEVERS block', () => {
        // the cache lever is one of the two figures every breadth owes by
        // default, so its absence must be visible there rather than only in a
        // row a reader must hunt for
        // (rule.require.report-both-cost-levers-with-trend-and-locus)
        const lines = stdout.split('\n');
        const headOfLevers = lines.findIndex((line) =>
          line.includes('levers — input DOWN · cache UP'),
        );
        expect(headOfLevers).toBeGreaterThan(-1);
        expect(lines[headOfLevers + 2]).toMatch(/cache: +—/);
      });

      then('the cost is absent, not free', () => {
        expect(stdout).toContain('cost: —');
      });

      then('every token count is absent too, not zero', () => {
        // a sum over zero metered runs is `0`, and `0` tokens is a claim this
        // corpus cannot support — no run in it reported a count at all
        expect(stdout).toContain('input:     —');
        expect(stdout).toContain('cache.set: —');
        expect(stdout).toContain('cache.get: —');
        expect(stdout).toContain('output:    —');
      });

      then('the render matches snapshot', () => {
        expect(stdout).toContain(
          '├─ runs: 1 (0 metered · 0 refused · 1 unknown 🟡)',
        );
        expect(stdout).toContain('└─ — (no prompt could be read, 1 unread)');
        expect(stdout).not.toContain('$0');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] two lanes whose input order INVERTS their prompt order',
    () => {
      // the clamp for sort-vs-display agreement. `case1` cannot exercise it: its
      // lanes rank the same way on either quantity, so a rollup that ranks on
      // `input` alone renders a column that happens to read correctly. here the
      // two disagree on purpose — `lane-cold` sent MORE input, and `lane-warm`
      // sent a larger PROMPT, because most of its prompt was served from cache.
      // the renderer prints the prompt total, so the ranked column must follow
      // it too (rule.require.single-source-of-truth-for-render).
      const runs: ReviewRunMeter[] = [
        genMeteredRun({
          slug: 'lane-cold',
          stone: '5.1.execution.from_vision',
          iteration: 1,
          index: 0,
          // 300.0k input · 300.0k prompt — the larger INPUT
          tokens: { input: 300_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
          cost: '$0.1500',
        }),
        genMeteredRun({
          slug: 'lane-warm',
          stone: '5.1.execution.from_vision',
          iteration: 1,
          index: 1,
          // 250.0k input · 450.0k prompt — the larger PROMPT
          tokens: {
            input: 250_000,
            cacheSet: 0,
            cacheGet: 200_000,
            output: 1_000,
          },
          cost: '$0.0800',
        }),
      ];

      when('[t0] the report is rendered', () => {
        const stdout = genReviewMeterStdout({
          report: genReviewMeterReport({ runs, levels: new Map() }),
          root: '.log/bhrain/review',
        });

        then('the two lanes render the prompt totals the case declares', () => {
          // the premise of the clamp, asserted rather than assumed — if the render
          // ever stops to print the prompt total, this case must fail loudly here
          // rather than quietly stop to test what it claims to test
          const rowOfCold = stdout
            .split('\n')
            .find((line) => line.includes('lane-cold'));
          const rowOfWarm = stdout
            .split('\n')
            .find((line) => line.includes('lane-warm'));
          expect(rowOfCold).toContain('300.0k prompt');
          expect(rowOfWarm).toContain('450.0k prompt');
        });

        then('the ranked column reads in the order it renders', () => {
          // the assertion the defect fails. ranked on `tokens.input`, `lane-cold`
          // (300.0k) sorts above `lane-warm` (250.0k) — and prints `300.0k prompt`
          // above `450.0k prompt`, a column that reads as a broken sort with no way
          // for the reader to tell which of the two figures is the lie
          const atWarm = stdout.indexOf('lane-warm');
          const atCold = stdout.indexOf('lane-cold');
          expect(atWarm).toBeGreaterThan(-1);
          expect(atCold).toBeGreaterThan(-1);
          expect(atWarm).toBeLessThan(atCold);
        });

        then('the render matches snapshot', () => {
          expect(stdout).toContain(
            '├─ lane-warm    1 run  ·  450.0k prompt ·  44.4% cached ·    $0.080000\n',
          );
          expect(stdout).toContain('└─ cost: $0.230000\n');
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] the same stone, re-driven after a repair', () => {
    // the clamp for `1.vision.experience.case=6 [t3]` — the walk the wish's bar 5
    // rests on: a driver repairs, re-drives, and reads whether the cache share
    // moved. `[t3]` states two claims, and only one is a property of this code:
    // 1. the instrument must render each round's share, per round, so the two
    //    are comparable side by side — testable here, and clamped below.
    // 2. a repair raises the share — a claim about the provider's cache, which
    //    no fixture can make true; it is measured live, and carried in the yield.
    // this case clamps (1) and says naught about (2). round 2 is GIVEN the
    // higher share here; the assertion is that a driver can read that it is
    // higher — never that it had to be.
    const runs: ReviewRunMeter[] = [
      // round 1 — cold. 400.0k prompt, none of it from cache
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 0,
        tokens: { input: 400_000, cacheSet: 0, cacheGet: 0, output: 2_000 },
        cost: '$0.2000',
      }),
      // round 2 — warm. the SAME 400.0k prompt, three quarters of it served cached
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 2,
        index: 0,
        tokens: {
          input: 100_000,
          cacheSet: 0,
          cacheGet: 300_000,
          output: 2_000,
        },
        cost: '$0.0740',
      }),
    ];

    when('[t0] the report is rendered', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });

      const rowOfRound1 = stdout
        .split('\n')
        .find((line) => line.includes('from_vision i001'));
      const rowOfRound2 = stdout
        .split('\n')
        .find((line) => line.includes('from_vision i002'));

      then('each round gets its own row, keyed by iteration', () => {
        // the premise of the whole walk. a `by round` axis that folded the two
        // iterations together would render one share, and a driver could never
        // compare a re-drive against the round it repaired
        expect(rowOfRound1).toBeDefined();
        expect(rowOfRound2).toBeDefined();
      });

      then('each row carries its OWN cache share, not the corpus share', () => {
        // the corpus share here is 37.5% (300.0k cached of 800.0k prompt). neither
        // row may read it — a per-round axis that printed the corpus figure would
        // pass a mere `toContain('cached')` check and tell the driver naught
        expect(rowOfRound1).toContain('0.0% cached');
        expect(rowOfRound2).toContain('75.0% cached');
      });

      then('the two shares are comparable — same prompt, same units', () => {
        // a share is only comparable against a share over the same denominator.
        // both rounds sent 400.0k prompt tokens, so the driver reads a real
        // delta rather than an artifact of two different-sized prompts
        expect(rowOfRound1).toContain('400.0k prompt');
        expect(rowOfRound2).toContain('400.0k prompt');
      });

      then('the repair shows up in the spend, not merely in the share', () => {
        // the caveat the yield carries: a higher SHARE is not the same as a lower
        // BILL. cache.get is cheaper than input but never free, so the walk is
        // only closed if the driver can read the cost beside the share
        expect(rowOfRound1).toContain('$0.2');
        expect(rowOfRound2).toContain('$0.07');
      });

      then('round 1’s zero is excused, because it had no cache to hit', () => {
        // the exact misread this walk would otherwise hand a driver. round 1 IS
        // `0.0% cached`, and it is the lane's FIRST run — there was no cache to
        // hit, so the zero says naught about the prompt's layout. a driver who
        // read it as a defect would repair a prompt that was never broken
        expect(rowOfRound1).toContain('0.0% cached');
        expect(rowOfRound1).toContain('cold (first round)');
        expect(rowOfRound1).not.toContain('warm and cached NAUGHT');
      });

      then(
        'round 2 carries no excuse, because it has no zero to excuse',
        () => {
          // the caveat is bound to the ZERO, never to the grade — a warm round that
          // hit its cache needs no annotation at all
          expect(rowOfRound2).not.toContain('cold');
          expect(rowOfRound2).not.toContain('warm and cached NAUGHT');
        },
      );

      then('the render matches snapshot', () => {
        expect(stdout).toContain(
          '└─ cache:     37.5% of prompt tokens served from cache   ↑ 75.0pp 🎉',
        );
        expect(stdout).toContain('└─ cost: $0.274000\n');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] two lanes at 0.0%, one cold and one warm', () => {
    // the case the whole grade exists for, and the one no other fixture can make:
    // `case1` holds a warm zero and `case4` holds a cold one, but in SEPARATE
    // corpora — so each renders alone, and a reader never has to tell them apart.
    // here both sit in one render, at the identical `0.0% cached`. if the two ever
    // render alike, this case reds — precisely the state the meter was in before
    // the grade existed (rule.forbid.failhide).
    const runs: ReviewRunMeter[] = [
      // lane-first — its ONLY run. a cache it could not have hit did not exist
      genMeteredRun({
        slug: 'lane-first',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 0,
        tokens: { input: 300_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1500',
      }),
      // lane-sixth — its SECOND run, and it still cached naught. a cache existed,
      // the prefix repeated, and the request did not reach it. THIS is the defect
      genMeteredRun({
        slug: 'lane-sixth',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 1,
        tokens: { input: 200_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1000',
      }),
      genMeteredRun({
        slug: 'lane-sixth',
        stone: '5.1.execution.from_vision',
        iteration: 2,
        index: 1,
        tokens: { input: 210_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1050',
      }),
    ];

    when('[t0] the report is rendered', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });

      const rowOfFirst = stdout
        .split('\n')
        .find((line) => line.includes('lane-first'));
      const rowOfSixth = stdout
        .split('\n')
        .find((line) => line.includes('lane-sixth'));

      then('both lanes really do read the same rate', () => {
        // the premise, asserted rather than assumed — if either lane ever stops to
        // read `0.0%`, this case must red here rather than quietly stop to exercise
        // the distinction it was written for
        expect(rowOfFirst).toContain('0.0% cached');
        expect(rowOfSixth).toContain('0.0% cached');
      });

      then('the cold zero is excused and the warm zero is flagged', () => {
        // one figure, two opposite meanings, and the render must part them
        expect(rowOfFirst).toContain('cold');
        expect(rowOfFirst).not.toContain('warm and cached NAUGHT');

        expect(rowOfSixth).toContain('warm and cached NAUGHT');
        expect(rowOfSixth).not.toContain('cold');
      });

      then(
        '🔴 the warm zero names its next move, since no pause explains it',
        () => {
          expect(rowOfSixth).toContain(
            '`--of run --at <rundir>` names the input past the seam',
          );
          expect(rowOfFirst).not.toContain('`--of run`');
        },
      );

      then('the two rows read differently to a human', () => {
        // the claim above at the grain a reader actually meets it: two rows that
        // carry the identical figure must not be the identical string
        expect(rowOfFirst).toBeDefined();
        expect(rowOfSixth).toBeDefined();
        expect(rowOfFirst?.trim()).not.toEqual(rowOfSixth?.trim());
      });

      then('the whole surface reads as a human sees it', () => {
        expect(stdout).toContain(
          '├─ lane-sixth    2 runs ·  410.0k prompt ·   0.0% cached ·    $0.205000  🟡 warm and cached NAUGHT — a prefix broke; `--of run --at <rundir>` names the input past the seam',
        );
        expect(stdout).toContain(
          '└─ lane-first    1 run  ·  300.0k prompt ·   0.0% cached ·    $0.150000  cold (first round) — no prior prompt of its lane to share a prefix with',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case9] a lane past ten dollars beside a sub-cent lane', () => {
    // the cost column pads to the width the grove shares; a pad of 9 let a figure
    // past ten dollars (`$15.250000`, 10 chars) push the caveat at the row's tail
    // right, so the caveats wobbled row against row where spend was largest
    const asRunPair = (input: { slug: string; index: number; cost: string }) =>
      [1, 2].map((iteration) =>
        genMeteredRun({
          slug: input.slug,
          stone: '5.1.execution.from_vision',
          iteration,
          index: input.index,
          tokens: { input: 100_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
          cost: input.cost,
        }),
      );
    const runs: ReviewRunMeter[] = [
      ...asRunPair({ slug: 'lane-costly', index: 0, cost: '$7.6250' }),
      ...asRunPair({ slug: 'lane-cheap', index: 1, cost: '$0.000710' }),
    ];

    when('[t0] the report is rendered', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });
      const rows = stdout
        .split('\n')
        .filter(
          (line) =>
            line.includes('lane-costly ') || line.includes('lane-cheap '),
        )
        .filter((line) => line.includes('warm and cached NAUGHT'));

      then('both figures render at the one column precision', () => {
        expect(stdout).toContain('$15.250000');
        expect(stdout).toContain('$0.001420');
      });

      then('the caveats at the row tails start at one column', () => {
        expect(rows.length).toBeGreaterThanOrEqual(2);
        const starts = rows.map((line) =>
          line.indexOf('🟡 warm and cached NAUGHT'),
        );
        expect(new Set(starts).size).toEqual(1);
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] a corpus whose rounds and reviewers cross', () => {
    // the cross-tab axis: `round × reviewer` is the only axis that can show a lever
    // MOVED — the three marginals each fold one of the two away, so a lane that
    // improved and a lane that regressed average into one flat figure.
    const runs: ReviewRunMeter[] = [
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 0,
        tokens: { input: 400_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.2000',
      }),
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 2,
        index: 0,
        tokens: {
          input: 100_000,
          cacheSet: 0,
          cacheGet: 300_000,
          output: 1_000,
        },
        cost: '$0.0740',
      }),
      genMeteredRun({
        slug: 'mech-failhides',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 1,
        tokens: { input: 200_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1000',
      }),
      genMeteredRun({
        slug: 'mech-failhides',
        stone: '5.1.execution.from_vision',
        iteration: 2,
        index: 1,
        tokens: { input: 210_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1050',
      }),
    ];

    const report = genReviewMeterReport({ runs, levels: new Map() });

    when('[t0] the report is rendered with the cross-tab withheld', () => {
      const stdout = genReviewMeterStdout({
        report,
        root: '.log/bhrain/review',
      });

      then('the three marginals render and the cross-tab does not', () => {
        // the default. the cross-tab's row count is the PRODUCT of two others, so
        // a tree with 9 lanes over 6 rounds would bury the three marginals a
        // reader opened the report for (rule.prefer.defaults-match-common-case)
        expect(stdout).toContain('by reviewer');
        expect(stdout).toContain('by stone');
        expect(stdout).toContain('by round');
        expect(stdout).not.toContain('round × reviewer');
      });

      then('the marginals fold the two lanes into one figure', () => {
        // the premise of the whole axis, stated as a fact about THIS corpus: read by
        // round alone, i002 reads one blended share — and a driver cannot tell that
        // one lane went to 75% while the other stayed at 0
        const rowOfRound2 = stdout
          .split('\n')
          .find((line) => line.includes('from_vision i002'));
        expect(rowOfRound2).toBeDefined();
        expect(rowOfRound2).not.toContain('0.0% cached');
        expect(rowOfRound2).not.toContain('75.0% cached');
      });

      then('the render matches snapshot', () => {
        expect(stdout).toContain(
          '└─ 5.1.execution.from_vision i002    2 runs ·  610.0k prompt ·  49.2% cached ·    $0.179000',
        );
        expect(stdout).not.toContain('round × reviewer');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] the report is rendered with the cross-tab traced', () => {
      const stdout = genReviewMeterStdout({
        report,
        root: '.log/bhrain/review',
        trace: true,
      });

      then('the cross-tab section renders beneath the marginals', () => {
        expect(stdout).toContain('round × reviewer');
        // and the marginals are not displaced by it
        expect(stdout).toContain('by reviewer');
        expect(stdout).toContain('by round');
      });

      then('each cell carries its OWN share, un-blended', () => {
        // the whole point: the cell the marginals averaged away. one lane moved to
        // 75% in i002 while its peer stayed at 0.0%, and only this axis says so
        const cellMoved = stdout
          .split('\n')
          .find((line) => line.includes('i002') && line.includes('repo-rules'));
        const cellFlat = stdout
          .split('\n')
          .find(
            (line) => line.includes('i002') && line.includes('mech-failhides'),
          );
        expect(cellMoved).toContain('75.0% cached');
        expect(cellFlat).toContain('0.0% cached');
      });

      then('the cells sort by key, so a round reads as a block', () => {
        // a marginal RANKS — heaviest first, because the reader asks "what is
        // dear?" a cross-tab TRACES — a reader follows ONE lane down the rounds,
        // so a rank order would scatter a lane's own series across the section
        const atI001 = stdout.indexOf('i001 · mech-failhides');
        const atI002 = stdout.indexOf('i002 · mech-failhides');
        expect(atI001).toBeGreaterThan(-1);
        expect(atI002).toBeGreaterThan(-1);
        expect(atI001).toBeLessThan(atI002);
      });

      then('the traced surface reads as a human sees it', () => {
        expect(stdout).toContain('└─ by round × reviewer\n');
        expect(stdout).toContain(
          '└─ 5.1.execution.from_vision i002 · repo-rules        1 run  ·  400.0k prompt ·  75.0% cached ·    $0.074000',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] a corpus whose lanes sit at two guard levels', () => {
    // the axis that answers the question this instrument was asked first — *"how
    // much cache have the L1 reviewers gotten?"* — and could not answer, because a
    // level lives in the guard and never in the log corpus.
    const runs: ReviewRunMeter[] = [
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 0,
        tokens: { input: 400_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.2000',
      }),
      genMeteredRun({
        slug: 'mech-failhides',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 1,
        tokens: { input: 200_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
        cost: '$0.1000',
      }),
      genMeteredRun({
        slug: 'arch-smell-scopeleaks',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 2,
        tokens: {
          input: 50_000,
          cacheSet: 0,
          cacheGet: 50_000,
          output: 1_000,
        },
        cost: '$0.0300',
      }),
      // a lane whose guard could not be read — no route in its identity, so its
      // level is an ABSENCE. it must NOT fold into L1
      genMeteredRun({
        slug: 'hand-run',
        stone: '5.1.execution.from_vision',
        iteration: 1,
        index: 3,
        tokens: { input: 10_000, cacheSet: 0, cacheGet: 0, output: 100 },
        cost: '$0.0050',
      }),
    ];

    // the join `getAllReviewerLevels` performs against the guard, handed in
    // directly — the fold under test is pure, and a fixture guard tree on disk
    // would test the filesystem rather than the axis
    const levels = new Map<string, number>([
      [runs[0]!.dir, 1],
      [runs[1]!.dir, 1],
      [runs[2]!.dir, 3],
      // runs[3] is deliberately ABSENT — an unread guard
    ]);

    when('[t0] the report is rendered with levels joined', () => {
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels }),
        root: '.log/bhrain/review',
      });

      const rowOfL1 = stdout.split('\n').find((line) => line.includes('L1'));
      const rowOfL3 = stdout.split('\n').find((line) => line.includes('L3'));
      const rowOfUnread = stdout
        .split('\n')
        .find((line) => line.includes('guard unread'));

      then('the axis renders beside reviewer', () => {
        expect(stdout).toContain('by level');
        // and it sits with its pair, never at the tail — a level is a property OF
        // a lane, so the two read together
        expect(stdout.indexOf('by reviewer')).toBeLessThan(
          stdout.indexOf('by level'),
        );
        expect(stdout.indexOf('by level')).toBeLessThan(
          stdout.indexOf('by stone'),
        );
      });

      then('each level folds only its own lanes', () => {
        // L1 = repo-rules (400.0k) + mech-failhides (200.0k) = 600.0k, none cached
        expect(rowOfL1).toContain('2 runs');
        expect(rowOfL1).toContain('600.0k prompt');
        expect(rowOfL1).toContain('0.0% cached');

        // L3 = arch-smell-scopeleaks alone — 100.0k prompt, half of it cached
        expect(rowOfL3).toContain('1 run');
        expect(rowOfL3).toContain('100.0k prompt');
        expect(rowOfL3).toContain('50.0% cached');
      });

      then('an unread guard reads as ABSENT, never as L1', () => {
        // the branch's central law on its fourth axis. to default an unread
        // guard to 1 would inflate L1's bill with spend nobody can attribute —
        // and the reader would have no way to see it happened (rule.forbid.failhide)
        expect(rowOfUnread).toBeDefined();
        expect(rowOfUnread).toContain('1 run');
        expect(rowOfUnread).toContain('10.0k prompt');
        expect(rowOfL1).not.toContain('610.0k');
      });

      then('the rows sum to the corpus, so no run is dropped', () => {
        // the whole-report invariant this axis must not break: every run lands in
        // exactly one bucket, so the axis totals the corpus
        const total = stdout
          .split('\n')
          .find((line) => line.includes('└─ cost:'));
        expect(total).toContain('$0.335000');
      });

      then('the level surface reads as a human sees it', () => {
        expect(stdout).toContain(
          '├─ L3                           1 run  ·  100.0k prompt ·  50.0% cached ·    $0.030000\n',
        );
        expect(stdout).toContain(
          '└─ (no level — guard unread)    1 run  ·   10.0k prompt ·',
        );
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] the report is rendered with NO levels joined', () => {
      // the caller that has no filesystem — a unit test, a `--json` consumer that
      // hands in a corpus. every other axis must still render
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({ runs, levels: new Map() }),
        root: '.log/bhrain/review',
      });

      then('the axis renders one honestly-named row', () => {
        expect(stdout).toContain('by level');
        expect(stdout).toContain('guard unread');
        expect(stdout).not.toContain('L1');
        expect(stdout).not.toContain('L3');
      });

      then('every other axis is untouched', () => {
        expect(stdout).toContain('by reviewer');
        expect(stdout).toContain('by stone');
        expect(stdout).toContain('by round');
        expect(stdout).toContain('repo-rules');
      });

      then('the render matches snapshot', () => {
        expect(stdout).toContain(
          '└─ (no level — guard unread)    4 runs ·  710.0k prompt ·   7.0% cached ·    $0.335000\n',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case10] a tree whose runs carry their prompt composition — which INPUT bought it',
    () => {
      // the stat its `grove` peer carried and this breadth did not, so a tree reader
      // could see the input lever's size and not name what to cut
      // (rule.require.report-both-cost-levers-with-trend-and-locus)
      const asRunOfComposition = (input: {
        index: number;
        prompt: ReviewRunMeter['prompt'];
      }): ReviewRunMeter => ({
        ...genMeteredRun({
          slug: `lane-${input.index}`,
          stone: '5.1.execution.from_vision',
          iteration: 1,
          index: input.index,
          tokens: { input: 30_000, cacheSet: 0, cacheGet: 0, output: 900 },
          cost: '$0.0150',
        }),
        prompt: input.prompt,
      });
      const stdout = genReviewMeterStdout({
        report: genReviewMeterReport({
          levels: new Map(),
          runs: [
            asRunOfComposition({
              index: 0,
              prompt: {
                chars: 100_000,
                targets: 12,
                sections: {
                  instructions: 2_500,
                  outputFormat: 1_200,
                  scaffold: 300,
                  rules: 20_000,
                  refs: 6_000,
                  targetFiles: 60_000,
                  'targetDiffs.additions': 5_000,
                  'targetDiffs.deletions': 0,
                  'targetDiffs.mutations': 3_000,
                  conversation: 2_000,
                },
                source: 'compiled',
                attribution: 'attributed',
                // this run recorded where its target mass came from; its peer
                // below predates the row, so the coverage reads 1 of 2
                locus: [
                  { path: 'src/domain.operations/review/a.ts', chars: 45_000 },
                  { path: 'blackbox/review.acceptance.test.ts', chars: 15_000 },
                ],
              },
            }),
            asRunOfComposition({
              index: 1,
              prompt: {
                chars: 50_000,
                targets: 6,
                sections: {
                  // a parsed run whose head carried no markers: its instructions and
                  // output contract stay in the residual, so both named rows read 0
                  instructions: 0,
                  outputFormat: 0,
                  scaffold: 9_000,
                  rules: 10_000,
                  refs: 0,
                  targetFiles: 26_000,
                  'targetDiffs.additions': 0,
                  'targetDiffs.deletions': 0,
                  'targetDiffs.mutations': 5_000,
                  conversation: 0,
                },
                source: 'parsed',
                attribution: 'unattributed',
                locus: null,
              },
            }),
            // an unread run — counted apart, never folded in as zeroes
            asRunOfComposition({ index: 2, prompt: null }),
          ],
        }),
        root: '.log/bhrain/review',
      });

      when('[t0] the report is rendered', () => {
        then('the by-input census renders at the tree breadth', () => {
          expect(stdout).toContain(
            '├─ by input — what the prompts were MADE of',
          );
          expect(stdout).toContain('2 read · 1 unread · 18 target files');
          expect(stdout).toContain('1 compiled (exact) · 1 parsed');
        });

        then('each input carries its summed chars and share', () => {
          // targetFiles = 60,000 + 26,000 over 150,000 total chars
          expect(stdout).toMatch(/targetFiles\s+86,000 chars\s+57\.3%/);
        });

        then(
          '🔴 the unvouched run is named beside the rows it qualifies',
          () => {
            expect(stdout).toContain('1 of 2 read runs are UNATTRIBUTED');
          },
        );

        then(
          '🔴 the locus names a directory to prune, weighed against the runs that placed it',
          () => {
            // the peer of the grove's locus — a breadth must not omit a stat its
            // peer carries (rule.require.report-both-cost-levers-with-trend-and-locus)
            expect(stdout).toContain(
              // full separators, at the scale of the census rows above it — one page, one scale
              'target mass by directory — 60,000 chars over 2 directories, from 1 of 2 read runs',
            );
            expect(stdout).toContain('src/domain.operations/review');
            expect(stdout).not.toContain('target mass by directory — — —');
          },
        );

        then(
          '🔴 the inner rail runs unbroken from the first row to the last `└─`',
          () => {
            // the block between the by-input header and the locus leaf
            const block = stdout
              .slice(
                stdout.indexOf('by input'),
                stdout.lastIndexOf(
                  '\n',
                  stdout.indexOf('└─ target mass by directory'),
                ),
              )
              .split('\n')
              .slice(1)
              .filter((line) => line.length > 0);
            expect(block.length).toBeGreaterThan(0);
            // each row carries the inner rail or a branch at the inner column —
            // never a bare outer rail, and never a wrapped line that drops the rail
            for (const line of block) expect(line).toMatch(/^ {3}│ {2}(│|├─)/);
          },
        );

        then('the render matches snapshot', () => {
          expect(stdout).toContain(
            '├─ cacheable           140,000 chars   93.3%  — the most any cache could ever serve',
          );
          expect(stdout).toContain(
            '├─  75.0%    45,000 chars  1 file    src/domain.operations/review',
          );
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case11] 🔴 three lanes at 0.0%, graded by what the cache reach saw',
    () => {
      // the ordinal counts only the prior runs that could have left a warm prefix. a
      // refusal reached no brain; a lane re-run past the reach found its prefix gone; a
      // lane re-run inside the reach had its prefix and missed it. the caveat must name
      // the real condition for each, never "its lane's first" for a lane a reader knows ran
      const asStamp = (minute: number): string =>
        new Date(Date.UTC(2026, 8, 26, 9, minute))
          .toJSON()
          .replace(/[:.]/g, '-');
      const asRunAt = (input: {
        slug: string;
        minute: number;
        index: number;
      }): ReviewRunMeter => ({
        ...genMeteredRun({
          slug: input.slug,
          stone: '5.1.execution.from_vision',
          iteration: input.minute,
          index: input.index,
          tokens: { input: 100_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
          cost: '$0.0500',
        }),
        dir: `.log/bhrain/review/${asStamp(input.minute)}.pid1.${input.slug}-m${input.minute}`,
      });
      const runs: ReviewRunMeter[] = [
        // lane-refused — a refusal, then the first request that ever sent its prefix
        {
          ...asRunAt({ slug: 'lane-refused', minute: 0, index: 0 }),
          grade: 'refused',
          tokens: null,
          cost: null,
        },
        asRunAt({ slug: 'lane-refused', minute: 5, index: 0 }),
        // lane-lapsed — two runs two hours apart
        asRunAt({ slug: 'lane-lapsed', minute: 0, index: 1 }),
        asRunAt({ slug: 'lane-lapsed', minute: 120, index: 1 }),
        // lane-held — the second run sits inside the reach of the first
        asRunAt({ slug: 'lane-held', minute: 0, index: 2 }),
        asRunAt({ slug: 'lane-held', minute: 50, index: 2 }),
      ];

      when('[t0] the report is rendered', () => {
        const stdout = genReviewMeterStdout({
          report: genReviewMeterReport({ runs, levels: new Map() }),
          root: '.log/bhrain/review',
        });
        const rowOf = (slug: string): string | undefined =>
          stdout.split('\n').find((line) => line.includes(`─ ${slug} `));

        then('the refused-then-0% lane reads cold, as a first round', () => {
          // no request ever sent this prefix, so there was none to lose — no act owed
          expect(rowOf('lane-refused')).toContain('cold (first round)');
          expect(rowOf('lane-refused')).not.toContain('lapsed');
        });

        then(
          '🔴 the past-reach-then-0% lane reads cold as a LAPSE, never a first round',
          () => {
            // the lane HAD a prefix and lost it to elapsed time — a real loss, so it
            // must never read as the weather
            expect(rowOf('lane-lapsed')).toContain('cold (lapsed 120m)');
            expect(rowOf('lane-lapsed')).toContain(
              '66-minute cache reach between rounds',
            );
            expect(rowOf('lane-lapsed')).not.toContain('first round');
          },
        );

        then(
          'the lane re-run inside the reach reads warm and flagged, never excused',
          () => {
            expect(rowOf('lane-held')).toContain('warm and cached NAUGHT');
          },
        );

        then('the whole surface reads as a human sees it', () => {
          expect(stdout).toContain(
            '├─ runs: 6 (5 metered · 1 refused · 0 unknown)',
          );
          expect(stdout).toContain(
            '├─ lane-held       2 runs ·  200.0k prompt ·   0.0% cached ·    $0.100000  🟡 warm and cached NAUGHT — a prefix broke; `--of run --at <rundir>` names the input past the seam',
          );
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case13] 🔴 CLAMP. two routes drove the same stone to the same round',
    () => {
      // one tree, two behavior routes over its life: each ran `5.1 i003`. they are two
      // rounds, and a round key that drops the route sums them into one row
      const asRunOfRoute = (input: {
        route: string;
        slug: string;
      }): ReviewRunMeter => {
        const run = genMeteredRun({
          slug: input.slug,
          stone: '5.1.execution.from_vision',
          iteration: 3,
          index: 0,
          tokens: { input: 100_000, cacheSet: 0, cacheGet: 0, output: 1_000 },
          cost: '$0.0500',
        });
        return {
          ...run,
          dir: `${run.dir}-${input.route}`,
          identity: run.identity && {
            ...run.identity,
            route: `.behavior/${input.route}`,
          },
        };
      };
      const runs: ReviewRunMeter[] = [
        asRunOfRoute({ route: 'v2026_01_01.feat-alpha', slug: 'repo-rules' }),
        asRunOfRoute({ route: 'v2026_02_02.feat-beta', slug: 'repo-rules' }),
      ];

      when('[t0] the report is folded', () => {
        const report = genReviewMeterReport({
          runs,
          levels: new Map(),
        });

        then('each route keeps its own round row, led by the route', () => {
          expect(report.byRound.map((bucket) => bucket.key)).toEqual([
            'v2026_01_01.feat-alpha · 5.1.execution.from_vision i003',
            'v2026_02_02.feat-beta · 5.1.execution.from_vision i003',
          ]);
        });

        then('the cross-tab parts the two routes too', () => {
          expect(report.byRoundAndReviewer.map((bucket) => bucket.key)).toEqual(
            [
              'v2026_01_01.feat-alpha · 5.1.execution.from_vision i003 · repo-rules',
              'v2026_02_02.feat-beta · 5.1.execution.from_vision i003 · repo-rules',
            ],
          );
        });
      });

      when('[t1] the corpus holds one route alone', () => {
        const report = genReviewMeterReport({
          runs: runs.slice(0, 1),
          levels: new Map(),
        });

        then('the round key reads as before, with no route prefix', () => {
          expect(report.byRound.map((bucket) => bucket.key)).toEqual([
            '5.1.execution.from_vision i003',
          ]);
        });
      });
    },
  );

  given('[case10] one lane whose rounds landed on two providers', () => {
    // the same lane, the same prompt — one provider read the prefix from cache, the
    // other read naught. measured 2026-10-12: every run of a partitioned round
    // landed on one provider and the prime and its partitions cached 1,280 tokens
    const runs: ReviewRunMeter[] = [
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.3.verification',
        iteration: 1,
        index: 0,
        tokens: { input: 20_000, cacheSet: 0, cacheGet: 380_000, output: 900 },
        cost: '$0.0200',
        provider: 'DeepSeek',
      }),
      genMeteredRun({
        slug: 'repo-rules',
        stone: '5.3.verification',
        iteration: 2,
        index: 0,
        tokens: { input: 398_720, cacheSet: 0, cacheGet: 1_280, output: 900 },
        cost: '$0.2000',
        provider: 'Wafer',
      }),
      {
        ...genMeteredRun({
          slug: 'repo-rules',
          stone: '5.3.verification',
          iteration: 3,
          index: 0,
          tokens: { input: 1, cacheSet: 0, cacheGet: 0, output: 0 },
          cost: '$0.0000',
        }),
        grade: 'refused',
        tokens: null,
        cost: null,
      },
    ];
    const report = genReviewMeterReport({ runs, levels: new Map() });

    when('[t0] the report is built', () => {
      then('🔴 each provider is its own row, with its own cache rate', () => {
        const byKey = new Map(report.byProvider.map((row) => [row.key, row]));
        expect(byKey.get('DeepSeek')?.cacheHitRate).toBeGreaterThan(0.9);
        expect(byKey.get('Wafer')?.cacheHitRate).toBeLessThan(0.01);
      });

      then('a run with no reported provider lands in one named row', () => {
        expect(report.byProvider.map((row) => row.key)).toContain(
          '(no provider — unreported)',
        );
      });
    });

    when('[t1] the report renders', () => {
      const stdout = genReviewMeterStdout({
        report,
        root: '.log/bhrain/review',
      });

      then('the provider axis renders', () => {
        expect(stdout).toContain('provider');
        expect(stdout).toContain('Wafer');
        expect(stdout).toContain('DeepSeek');
      });

      then('the stdout matches its snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });
});
