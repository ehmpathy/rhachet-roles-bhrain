import { ConstraintError } from 'helpful-errors';
import { asIsoPrice, priceSum } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOneCacheHitRate } from '@src/domain.operations/review/getOneCacheHitRate';
import type {
  GroveRollupRow,
  ReviewGroveReport,
} from '@src/domain.operations/review/grove/genReviewGroveReport';
import { genReviewGroveStdout } from '@src/domain.operations/review/grove/genReviewGroveStdout';
import { getOneFullRateTokens } from '@src/domain.operations/review/grove/getOneFullRateTokens';
import { HEADER_OF_COST_LEVERS } from '@src/domain.operations/review/meter/asCostLeverLines';

/**
 * .what = a rollup row with the token split spelled out
 * .why = the drift this suite clamps lives between input/cacheSet and output, so
 *        each case must set all four axes explicitly
 */
const asRow = (input: {
  key: string;
  input: number;
  cacheSet: number;
  output: number;
  /** how many metered runs the row folds — 1 by default */
  runs?: number;
  /** the prompt tokens served from cache — 0 by default */
  cacheGet?: number;
}): GroveRollupRow => ({
  key: input.key,
  runs: input.runs ?? 1,
  census: { metered: input.runs ?? 1, refused: 0, unknown: 0 },
  tokens: {
    input: input.input,
    cacheSet: input.cacheSet,
    cacheGet: input.cacheGet ?? 0,
    output: input.output,
  },
  cost: asIsoPrice('USD 1.00'),
});

/**
 * .what = a by-input census with a chosen read/unread coverage
 * .why = the census is the one row whose ABSENCE must not render as zeroes, so a
 *        case must be able to set its coverage to zero explicitly
 */
const asInputs = (input: {
  read: number;
  unread: number;
  unattributed?: number;
  locus?: ReviewGroveReport['inputs']['locus'];
}): ReviewGroveReport['inputs'] => ({
  read: input.read,
  // every read run in these cases is read from the durable artifact; the parsed
  // lane is the migration path, and no case here exercises it
  compiled: input.read,
  parsed: 0,
  unread: input.unread,
  // the three attribution counts sum to `read` by construction, so a case
  // that raises `unattributed` lowers `attributed` by the same amount. a fixture
  // whose census did NOT sum would render a caveat over a corpus that cannot
  // exist, and would clamp a render no real report can reach
  attributed: input.read - (input.unattributed ?? 0),
  unattributed: input.unattributed ?? 0,
  ungraded: 0,
  sections: {
    instructions: 1_200,
    outputFormat: 600,
    scaffold: 200,
    rules: 8_000,
    refs: 0,
    conversation: 2_000,
    'targetDiffs.additions': 3_000,
    'targetDiffs.deletions': 0,
    'targetDiffs.mutations': 1_000,
    targetFiles: 12_000,
  },
  chars: 28_000,
  targets: 12,
  // every read run placed its target mass, split over two directories, unless a
  // case asks for the unplaced state
  locus: input.locus ?? {
    placed: input.read,
    targets: [
      { path: 'src/domain.operations/review/a.ts', chars: 9_000 },
      { path: 'src/contract/cli/b.ts', chars: 3_000 },
    ],
  },
});

/**
 * .what = the totals one axis of rows sums to — runs, census, tokens, cost
 * .why = the real fold builds every axis from ONE run list
 *        (`genReviewGroveReport`), so each axis sums to the grove's own totals.
 *        a fixture that hand-set the totals apart from its rows pinned reports
 *        no real fold can mint — `runs: 4 found` above a `by tree` of two runs
 */
const asAxisTotals = (input: {
  rows: GroveRollupRow[];
}): {
  runs: number;
  census: ReviewGroveReport['census'];
  tokens: ReviewGroveReport['tokens'];
  cost: ReviewGroveReport['cost'];
} => {
  const costs = input.rows
    .map((row) => row.cost)
    .filter((cost): cost is NonNullable<typeof cost> => cost !== null);
  return {
    runs: input.rows.reduce((sum, row) => sum + row.runs, 0),
    census: {
      metered: input.rows.reduce((sum, row) => sum + row.census.metered, 0),
      refused: input.rows.reduce((sum, row) => sum + row.census.refused, 0),
      unknown: input.rows.reduce((sum, row) => sum + row.census.unknown, 0),
    },
    tokens: {
      input: input.rows.reduce((sum, row) => sum + row.tokens.input, 0),
      cacheSet: input.rows.reduce((sum, row) => sum + row.tokens.cacheSet, 0),
      cacheGet: input.rows.reduce((sum, row) => sum + row.tokens.cacheGet, 0),
      output: input.rows.reduce((sum, row) => sum + row.tokens.output, 0),
    },
    cost: costs.length === 0 ? null : priceSum(...costs),
  };
};

const asReport = (input: {
  byTree: GroveRollupRow[];
  byRoute?: GroveRollupRow[];
  byStone?: GroveRollupRow[];
  byReviewer?: GroveRollupRow[];
  inputs?: ReviewGroveReport['inputs'];
  /** trees whose log root could not be read — none by default */
  treesUnreadable?: ReviewGroveReport['treesUnreadable'];
  /** the per-day samples of the trend — none by default */
  byDay?: ReviewGroveReport['byDay'];
  /** the shared-prefix census — no round pairs by default */
  prefix?: ReviewGroveReport['prefix'];
}): ReviewGroveReport => {
  // the run count IS the by-input census's coverage: the real fold reads every run
  // it found, so `read + unread === runsFound` by construction. a fixture that set
  // the two apart would pin a render no real grove can reach
  const inputs = input.inputs ?? asInputs({ read: 3, unread: 1 });
  const runsFound = inputs.read + inputs.unread;

  // every axis that carries rows is a partition of the same run list, so each one
  // sums to the same runs, census, tokens, and cost. an empty axis is the
  // `absent` render, and stays legal
  const axes = [
    input.byTree,
    input.byRoute ?? [],
    input.byStone ?? [],
    input.byReviewer ?? [],
  ].filter((rows) => rows.length > 0);
  const totals = axes.map((rows) => asAxisTotals({ rows }));
  for (const total of totals)
    if (JSON.stringify(total) !== JSON.stringify(totals[0]))
      throw new ConstraintError(
        'fixture axes disagree on their totals — no real fold can',
        { totals, hint: 'build every axis from one run list' },
      );
  const totalOfAxes = totals[0] ?? null;
  if (totalOfAxes && totalOfAxes.runs !== runsFound)
    throw new ConstraintError(
      'fixture axis rows do not sum to the runs found — no real fold can',
      {
        runsOfAxis: totalOfAxes.runs,
        runsFound,
        hint: 'set read + unread to the sum of the axis rows',
      },
    );

  // the totals are the rows' own sums, where any axis carries rows
  const tokens = totalOfAxes?.tokens ?? {
    input: 100,
    cacheSet: 0,
    cacheGet: 0,
    output: 0,
  };

  // the day samples are one more partition of the same run list, so they sum to the
  // same runs and tokens. a fixture whose trend moved over a corpus its own total
  // denies pinned a `↑ 75.0pp` cache move above a `cache.get 0` grove
  const byDay = input.byDay ?? [];
  if (byDay.length > 0) {
    const daysTotal = {
      runs: byDay.reduce((sum, day) => sum + day.runs, 0),
      tokens: {
        input: byDay.reduce((sum, day) => sum + day.tokens.input, 0),
        cacheSet: byDay.reduce((sum, day) => sum + day.tokens.cacheSet, 0),
        cacheGet: byDay.reduce((sum, day) => sum + day.tokens.cacheGet, 0),
        output: byDay.reduce((sum, day) => sum + day.tokens.output, 0),
      },
    };
    if (
      JSON.stringify(daysTotal) !== JSON.stringify({ runs: runsFound, tokens })
    )
      throw new ConstraintError(
        'fixture days disagree with the grove totals — no real fold can',
        {
          daysTotal,
          groveTotal: { runs: runsFound, tokens },
          hint: 'build byDay and the axis rows from one run list',
        },
      );
  }

  return {
    ...asReportBody({ ...input, inputs, byDay }),
    runsFound,
    census: totalOfAxes?.census ?? {
      metered: runsFound,
      refused: 0,
      unknown: 0,
    },
    tokens,
    // the grove rate is its own tokens' rate, as the real fold derives it
    rateOfCacheHit: getOneCacheHitRate({ tokens }),
    cost: totalOfAxes ? totalOfAxes.cost : asIsoPrice('USD 1.00'),
  };
};

/**
 * .what = the walked trees a fixture's `by tree` rows imply, one per row
 * .why = the header's tree count and the rollup's rows must agree, as a real fold's do
 */
const asTreesOfRows = (input: {
  byTree: GroveRollupRow[];
}): ReviewGroveReport['trees'] =>
  (input.byTree.length === 0 ? ['a'] : input.byTree.map((row) => row.key)).map(
    (name) => ({
      name,
      dir: `/tmp/trees/${name}`,
      root: `/tmp/trees/${name}/.log`,
      present: true,
    }),
  );

const asReportBody = (input: {
  byTree: GroveRollupRow[];
  byRoute?: GroveRollupRow[];
  byStone?: GroveRollupRow[];
  byReviewer?: GroveRollupRow[];
  inputs: ReviewGroveReport['inputs'];
  treesUnreadable?: ReviewGroveReport['treesUnreadable'];
  byDay?: ReviewGroveReport['byDay'];
  prefix?: ReviewGroveReport['prefix'];
}): Omit<
  ReviewGroveReport,
  'runsFound' | 'census' | 'tokens' | 'cost' | 'rateOfCacheHit'
> => ({
  root: '/tmp/trees',
  // one walked tree per `by tree` row, as the real fold yields — a fixture whose header
  // counted fewer trees than its rollup lists would pin a count no real grove can reach.
  // a case with no tree rows still walks one tree, which carried no runs
  trees: asTreesOfRows({ byTree: input.byTree }),
  treesWithLogs: Math.max(input.byTree.length, 1),
  treesUnreadable: input.treesUnreadable ?? [],
  inputs: input.inputs,
  byTree: input.byTree,
  byRoute: input.byRoute ?? [],
  byStone: input.byStone ?? [],
  byReviewer: input.byReviewer ?? [],
  byProvider: [],
  // empty by DEFAULT, so no case renders a trend it did not ask for
  byDay: input.byDay ?? [],
  // no round pairs by DEFAULT, so the prefix row reads absent on every case that
  // does not set it
  prefix: input.prefix ?? {
    verdicts: {
      pairs: 0,
      served: 0,
      missed: 0,
      selfCached: 0,
      overReach: 0,
      unshared: 0,
      unmeasured: 0,
    },
    pairs: [],
  },
});

describe('genReviewGroveStdout', () => {
  given(
    '[case1] rows that carry OUTPUT tokens beside their full-rate mass',
    () => {
      // the regression this clamps: the ROLLUP sorted on
      // `input + cacheSet + output` while the RENDERER displayed
      // `input + cacheSet`. two expressions of one quantity, and they
      // disagreed — a 27M row rendered above a 33.9M row and read as a
      // broken sort. `getOneFullRateTokens` now declares it once, and this
      // clamps that the rendered figure is exactly that operation.
      const rows = [
        asRow({ key: 'rich', input: 33_000_000, cacheSet: 0, output: 1 }),
        asRow({ key: 'lean', input: 27_000_000, cacheSet: 0, output: 900 }),
      ];

      when('[t0] the report is rendered', () => {
        // two rows of one run each, so the grove found exactly two runs
        const report = asReport({
          byTree: rows,
          inputs: asInputs({ read: 2, unread: 0 }),
        });
        const out = genReviewGroveStdout({ report, limit: 10 });

        then('🔴 the grove totals are the sums of its own rows', () => {
          // a real fold builds both from one run list; a fixture that set them
          // apart pinned `runs: 4 found` above a `by tree` of two runs
          expect(out).toContain('runs:  2 found — 2 metered');
          expect(report.tokens.input).toEqual(60_000_000);
          expect(report.cost).toEqual(asIsoPrice('USD 2.00'));
        });

        then('each row displays exactly getOneFullRateTokens', () => {
          for (const row of rows)
            expect(out).toContain(
              `${getOneFullRateTokens({ tokens: row.tokens }).toLocaleString('en-US')} at full rate`,
            );
        });

        then('the render ends on its last row, never a blank one', () => {
          expect(out.endsWith('\n')).toEqual(false);
          expect(out.split('\n').slice(-1).join('').trim()).not.toEqual('');
        });

        then(
          '🔴 CLAMP. a metered-only render carries no static legend and no alarm glyph',
          () => {
            // the token/cost split is design rationale, stated in the code, never
            // printed on every render; the `runs:` line already states the split
            expect(out).not.toContain('🔴');
            expect(out).not.toContain('🟡');
            expect(out).not.toContain('never zero');
            expect(out).not.toContain('unknown,');
          },
        );

        then('output tokens never enter the full-rate figure', () => {
          expect(out).not.toContain('33,000,001 at full rate');
          expect(out).not.toContain('27,000,900 at full rate');
        });

        then('🔴 the column is named for the RATE, never `billable`', () => {
          // cache.get is billed, at 1/31.4 — so a column that excludes it under
          // the word `billable` reports a figure nobody measured, and contradicts
          // the token block above it, which already renders `at full rate` beside
          // input and `31.4x cheaper` beside cache.get
          // (rule.forbid.ambiguous-labels)
          expect(out).not.toContain('billable');
        });

        then('the renderer preserves the order the rollup sorted', () => {
          expect(out.indexOf('rich')).toBeLessThan(out.indexOf('lean'));
        });

        then('the render matches snapshot', () => {
          // the two tree rows pin the full-rate figure that excludes output
          expect(out).toContain(
            '33,000,000 at full rate     $1.000000     1 run   rich',
          );
          expect(out).toContain(
            '27,000,000 at full rate     $1.000000     1 run   lean',
          );
          expect(out).toMatchSnapshot();
        });
      });
    },
  );

  given('[case5] a route key rendered on the route axis', () => {
    // .what = clamps that the RENDERER passes a route key through untouched.
    // .why = the key is computed upstream by `asRouteKey`, so the renderer must not
    //        re-derive it — a second expression of one quantity is how the full-rate
    //        figure above drifted.
    //
    // this does NOT clamp `asRouteKey` itself. the row below is handed a key that
    //    is ALREADY tree-relative, so the absolute-vs-relative branch never runs —
    //    measured: this suite stayed green 8/8 with that branch reverted. the real
    //    clamp for it is `genReviewGroveReport.integration.test.ts` [case1], which
    //    seeds both `--output` path shapes on disk.
    when('[t0] the report is rendered', () => {
      // one run, read, on one route
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          byRoute: [
            asRow({
              key: '.behavior/v2026_09_09.feat-demo',
              input: 10,
              cacheSet: 0,
              output: 0,
            }),
          ],
          inputs: asInputs({ read: 1, unread: 0 }),
        }),
        limit: 10,
      });

      then('the route key renders as its own tree-relative path', () => {
        expect(out).toContain('.behavior/v2026_09_09.feat-demo');
      });

      then('no route key escapes its tree with a `..` segment', () => {
        expect(out).not.toContain('../');
      });

      then('the render matches snapshot', () => {
        // the route row sits under the route title, with its figure
        expect(out).toContain(
          '10 at full rate     $1.000000     1 run   .behavior/v2026_09_09.feat-demo',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case6] a by-input census over prompts that were read', () => {
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: [] }),
        limit: 10,
      });

      then('every named input earns its own row', () => {
        for (const section of [
          'instructions',
          'outputFormat',
          'scaffold',
          'rules',
          'refs',
          'conversation',
          'targetDiffs',
          'targetFiles',
        ])
          expect(out).toContain(section);
      });

      then('🔴 the rendered rows sum to the rendered total', () => {
        // the census that shipped before this clamp rendered `targetFiles` at
        // 148.5% of a total it was supposed to be a part of, and a per-round
        // remainder of -12.9% — a report that refuted itself on its own face.
        // this reads the RENDERED figures back, so a renderer that drops or
        // doubles a row is caught even where the report object is sound
        // the locus block closes the census and re-cuts the TARGET mass by place, so it
        // is a second view of rows already summed — the sum stops where it opens. it
        // went unread here only while the locus printed scaled figures (`12.0k`) this
        // parse could not read; at the census's own scale it must be cut out by name
        const census = out
          .slice(
            out.indexOf('by input'),
            out.indexOf('target mass by directory'),
          )
          .split('\n');
        const asChars = (line: string): number =>
          Number((line.match(/([\d,]+) chars/)?.[1] ?? '0').replace(/,/g, ''));

        // the section rows are found by their LABEL, never by the presence of a
        // branch glyph. this filter once read `one.includes('─')`, which worked
        // only because the three total rows rendered UNGLYPHED — so the test was
        // coupled to the very inconsistency `rule.forbid.snapshot-visual-blemishes`
        // forbids, and it went red the moment the render was made uniform.
        // a parse that keys on a defect passes for as long as the defect lives
        const IS_A_TOTAL_ROW = ['total', 'cacheable', 'per round'];
        const asLabel = (line: string): string =>
          line.replace(/^\s*[├└]─\s*/, '').trimStart();

        // a child row (`additions` under `targetDiffs`) is a PART of its parent's
        // figure, so only the top-level rows are summed — a nested row sits behind
        // a `│` gutter, a top-level one opens on its branch glyph
        const IS_A_TOP_ROW = /^\s*[├└]─/;
        const rows = census
          .filter((one) => one.includes('chars'))
          .filter((one) => IS_A_TOP_ROW.test(one))
          .filter(
            (one) => !IS_A_TOTAL_ROW.some((w) => asLabel(one).startsWith(w)),
          )
          .reduce((sum, one) => sum + asChars(one), 0);
        const total = asChars(
          census.find((one) => asLabel(one).startsWith('total')) ?? '',
        );

        expect(total).toBeGreaterThan(0);
        expect(rows).toEqual(total);
      });

      then('🔴 the two cache halves sum to the total, never past it', () => {
        // the broken census rendered a per-round half of -367,119,602 chars, at
        // -12.9%. a negative half is the tell that the rows double-counted
        const census = out
          .slice(out.indexOf('by input'), out.indexOf('by tree'))
          .split('\n');
        // the same glyph-blind label read as above — `.trimStart()` alone stopped
        // at `├─` once every row carried one, and returned NaN rather than a figure
        const asChars = (word: string): number =>
          Number(
            (
              census
                .find((one) =>
                  one
                    .replace(/^\s*[├└]─\s*/, '')
                    .trimStart()
                    .startsWith(word),
                )
                ?.match(/(-?[\d,]+) chars/)?.[1] ?? 'x'
            ).replace(/,/g, ''),
          );

        expect(asChars('cacheable')).toBeGreaterThanOrEqual(0);
        expect(asChars('per round')).toBeGreaterThanOrEqual(0);
        // `getOneCharsByCacheSeam` sums the two halves from ONE seam record,
        // independently of `total`, so this grades what it claims: that the six
        // sections account for every char of `chars`
        expect(asChars('cacheable') + asChars('per round')).toEqual(
          asChars('total'),
        );
      });

      then('each row is marked on which side of the cache seam it sat', () => {
        // a share alone misreads: a large CACHEABLE section is the cheap half,
        // and a small per-round one can still be the dear half
        expect(out).toContain('cacheable');
        expect(out).toContain('per round');
      });

      then('the coverage rides beside the figures', () => {
        expect(out).toContain('3 read');
        expect(out).toContain('1 unread');
      });

      then('🔴 the census states which source each figure came from', () => {
        // a compiled figure is measured from the source arrays; a parsed one is
        // re-read off the rendered prompt and is coarse. a census that mixes the
        // two, and declares neither, reads as exact however much of it was guessed
        expect(out).toContain('3 compiled (exact)');
        expect(out).toContain('0 parsed from the rendered prompt (coarse)');
      });

      then('🔴 the ATTRIBUTION census rides beside the source census', () => {
        // the coverage axis answers *"could we read it?"*; this one answers
        // *"did its own census vouch for what we read?"* — two different
        // questions, and a report that answers only the first renders a
        // confident share over rows nobody stood behind
        expect(out).toContain('3 attributed');
        expect(out).toContain('0 unattributed');
      });

      then(
        '🔴 NO caveat is rendered — every read run vouched for itself',
        () => {
          expect(out).not.toContain('UNATTRIBUTED');
        },
      );

      then('the render matches snapshot', () => {
        // the census total and its two cache halves pin the by-input block
        expect(out).toContain('├─ total                28,000 chars');
        expect(out).toContain('├─ cacheable            25,000 chars   89.3%');
        expect(out).toContain('├─ per round             3,000 chars   10.7%');
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case7] a corpus where NOT ONE prompt could be read', () => {
    // the failhide this forbids: a census of zeroes would state "the grove's
    // prompts carried no rules and no diffs" as a measured fact, where the truth
    // is that nobody could read a single one of them
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          inputs: {
            ...asInputs({ read: 0, unread: 9 }),
            sections: {
              instructions: 0,
              outputFormat: 0,
              scaffold: 0,
              rules: 0,
              refs: 0,
              conversation: 0,
              'targetDiffs.additions': 0,
              'targetDiffs.deletions': 0,
              'targetDiffs.mutations': 0,
              targetFiles: 0,
            },
            chars: 0,
            targets: 0,
          },
        }),
        limit: 10,
      });

      then('the census renders ABSENT, never a row of 0.0% shares', () => {
        expect(out).toContain('absent (no prompt could be read, 9 unread)');
        expect(out).not.toContain('0 chars');
      });

      then('the render matches snapshot', () => {
        // the by-input block holds one absent row, and the run count is all nine
        expect(out).toContain('└─ absent (no prompt could be read, 9 unread)');
        expect(out).toContain(
          'runs:  9 found — 9 metered · 0 refused · 0 unknown',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given(
    '[case8] a grove fold over runs that did NOT vouch for themselves',
    () => {
      /**
       * the defect this forbids, and the reason this case exists.
       *
       * every OTHER honesty grade this report carries — `metered`, `refused`,
       * `unknown` — travels beside its aggregate, so a reader weighs a figure
       * against the share of the corpus that could prove it. the ATTRIBUTION axis
       * had no counterpart: `asGrovePromptInputs` folded every readable run's
       * `sections` alike, and the renderer printed a confident `targetFiles: 42.9%`
       * built partly from runs whose own census said *"the residual may hide an
       * input with no row"*.
       *
       * .note = the discipline is exactly `genReviewRunStdout`'s, one level up.
       *         that surface warns per prompt; this one warns per FOLD, because a
       *         reader of the grove never opens the runs it summed.
       */
      when('[t0] two of three read runs declined to vouch', () => {
        const out = genReviewGroveStdout({
          report: asReport({
            byTree: [],
            inputs: asInputs({ read: 3, unread: 1, unattributed: 2 }),
          }),
          limit: 10,
        });

        then('🔴 the caveat is rendered, with its denominator named', () => {
          expect(out).toContain('├─ 🟡 2 of 3 read runs are UNATTRIBUTED');
        });

        then(
          '🔴 the caveat carries the caution mark 🟡, never the forbidden U+26A0',
          () => {
            expect(out).not.toContain(String.fromCodePoint(0x26a0));
          },
        );

        then('🔴 it says the shares were summed over them ANYWAY', () => {
          // a caveat that merely names a count teaches a reader naught about the
          // figures beside it. the load-bearing half is that the percentages they
          // are about to act on INCLUDE the runs nobody vouched for
          expect(out).toContain('summed over them ALL, vouched and unvouched');
        });

        then('🔴 it names the next step, not the symptom alone', () => {
          // the grove sums rows over many runs, and the fix acts on one run's
          // prompt — so the caveat hands over the command that opens one run
          expect(out).toContain('rhx review._.cost --of run --at <rundir>');
        });

        then(
          'the lever block reads by the same header as --of run and --of tree',
          () => {
            expect(out).toContain(`   ${HEADER_OF_COST_LEVERS}`);
            expect(out).not.toContain('the two levers — drive');
          },
        );

        then(
          '🔴 the rows are STILL rendered — a caveat is not a refusal',
          () => {
            // the fold records what it read and declines to VOUCH for it. to
            // withhold the rows would hide a measurement that is probably fine
            expect(out).toContain('targetFiles');
            expect(out).toContain('rules');
          },
        );

        then('the census line agrees with the caveat', () => {
          // two renders of one quantity that can disagree is the drift this
          // asserts away: the census count and the caveat count are one number
          expect(out).toContain('1 attributed · 2 unattributed');
        });

        then('the render matches snapshot', () => {
          // the caveat sits above the rows it qualifies
          expect(out).toContain('├─ 🟡 2 of 3 read runs are UNATTRIBUTED');
          expect(out.indexOf('UNATTRIBUTED')).toBeLessThan(
            out.indexOf('├─ instructions'),
          );
          expect(out).toMatchSnapshot();
        });
      });
    },
  );

  given('[case9] a grove fold over runs that predate the grade', () => {
    /**
     * ~2,700 runs on disk were written before `attribution` existed. their
     * silence must render as an ABSENCE — never as the clean grade, and never as
     * a warn either.
     */
    when('[t0] every read run is ungraded', () => {
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          inputs: {
            ...asInputs({ read: 3, unread: 1 }),
            attributed: 0,
            unattributed: 0,
            ungraded: 3,
          },
        }),
        limit: 10,
      });

      then('🔴 they are counted apart, never folded in as attributed', () => {
        expect(out).toContain('0 attributed');
        expect(out).toContain('3 ungraded (no grade stated)');
      });

      then(
        '🔴 and NO caveat fires — an unstated grade is not a declined one',
        () => {
          // to warn here would claim a verdict nobody rendered, in the other
          // direction — the same failhide the clean-grade read would be
          expect(out).not.toContain('UNATTRIBUTED');
        },
      );

      then('the render matches snapshot', () => {
        // the census line counts every read run as ungraded
        expect(out).toContain(
          '├─ census        0 attributed · 0 unattributed · 3 ungraded (no grade stated)',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case17] the census names WHERE the target mass came from', () => {
    /**
     * the census rows name the KIND of input; the locus names the PLACE, so a
     * reader at this breadth can name a directory to prune from the report alone
     * (rule.require.report-both-cost-levers-with-trend-and-locus, obligation 4)
     */
    when('[t0] every read run placed its mass', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: [] }),
        limit: 10,
      });

      then('the locus rows name each directory with its share', () => {
        expect(out).toContain(
          'target mass by directory — 12,000 chars over 2 directories, from 3 of 3 read runs',
        );
        // 🔴 one page, one scale: the census rows above print `12,000`, so the locus does too
        expect(out).not.toContain('12.0k');
        expect(out).toContain('src/domain.operations/review');
        expect(out).toContain('src/contract/cli');
      });

      then('the render matches snapshot', () => {
        // each locus row carries its share, its mass, and its file count
        expect(out).toContain(
          '├─  75.0%     9,000 chars  1 file    src/domain.operations/review',
        );
        expect(out).toContain(
          '└─  25.0%     3,000 chars  1 file    src/contract/cli',
        );
        expect(out).toMatchSnapshot();
      });
    });

    when('[t1] NO read run recorded a locus', () => {
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          inputs: asInputs({
            read: 3,
            unread: 1,
            locus: { placed: 0, targets: [] },
          }),
        }),
        limit: 10,
      });

      then('🔴 it renders ABSENT, never an empty rollup', () => {
        expect(out).toContain(
          'target mass by directory — not recorded by any of 3 read runs',
        );
        expect(out).not.toContain('over 0 directories');
      });

      then('it names the one breadth that can place a run', () => {
        expect(out).toContain('rhx review._.cost --of run --at <rundir>');
      });

      then('the render matches snapshot', () => {
        // the absent locus explains why, and renders no directory row
        expect(out).toContain('runs compiled before the locus row carry none');
        expect(out).not.toContain('src/domain.operations/review');
        expect(out).toMatchSnapshot();
      });
    });

    when('[t2] the placed runs carried no per-target mass', () => {
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          inputs: asInputs({
            read: 3,
            unread: 1,
            locus: { placed: 2, targets: [{ path: 'src/a.ts', chars: 0 }] },
          }),
        }),
        limit: 10,
      });

      then('it states the fact, with its coverage', () => {
        expect(out).toContain(
          'target mass by directory — no per-target mass to place, from 2 of 3 read runs',
        );
      });

      then(
        'a fact carries no absent form, neither the MARK nor the WORD',
        () => {
          expect(out).not.toContain('target mass by directory — —');
          expect(out).not.toContain('target mass by directory — absent');
        },
      );

      then('the render matches snapshot', () => {
        // the fact names the pull render that sends no payload
        expect(out).toContain(
          '(a --focus pull render sends paths, no payload)',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case4] cache.get mass, which is read at 1/31.4 the price', () => {
    // the tokens are typed as the FULL `ReviewTokens` a real call site holds, never as
    // the narrowed shape the operation accepts — so this exercises the same widened
    // argument every caller passes, rather than a literal tailored to the signature
    const tokens: ReviewTokens = {
      input: 10,
      cacheSet: 5,
      cacheGet: 1_000_000,
      output: 7,
    };

    when('[t0] the full-rate mass is computed', () => {
      then('cache.get never enters the full-rate figure', () => {
        expect(getOneFullRateTokens({ tokens })).toEqual(15);
      });

      then('🔴 the exclusion is STRUCTURAL, never merely arithmetic', () => {
        // `getOneFullRateTokens` takes `{ input, cacheSet }` — so cache.get and output are
        // unreachable from inside it, and a later edit cannot quietly restore one.
        // the assertion above would still pass if the body were rewritten to read them;
        // this one records that the SIGNATURE is what forbids it, and the compiler is
        // the enforcement. a literal that carries cacheGet is now a type error, which
        // is why the fixture above is typed and passed whole rather than inline
        expect(
          getOneFullRateTokens({ tokens: { input: 10, cacheSet: 5 } }),
        ).toEqual(getOneFullRateTokens({ tokens }));
      });
    });
  });

  given('[case2] a report with no rows on an axis', () => {
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: [] }),
        limit: 10,
      });

      then('the axis renders as ABSENT, never as a zero', () => {
        expect(out).toContain(
          'by tree · route · stone · reviewer · provider: absent — no run carried them',
        );
      });

      then(
        '🔴 cache.set reads at the full rate `getOneFullRateTokens` sums it at, never free',
        () => {
          // one report once called cache.set `free`, then folded it into the `at full
          // rate` figure a few lines below. two prices for one axis on one render
          expect(out).toContain('of read, at full rate, once per seed)');
          expect(out).not.toContain('of read, free)');
        },
      );

      then(
        '🔴 the lever figures start in the column the grove total starts its values in',
        () => {
          // the two blocks sit one above the other, so a figure that starts a column
          // off from the values above it reads as a kinked table
          // the cost value is the widest in the total block, so it alone starts at
          // the left edge of the value column
          const lines = out.split('\n');
          const cost = lines.find((line) => line.includes('└─ cost')) ?? '';
          const lever = lines.find((line) => line.includes('├─ input:')) ?? '';
          expect(cost.indexOf('$1.000000')).toBeGreaterThan(0);
          expect(lever.indexOf('25 prompt tokens/run')).toEqual(
            cost.indexOf('$1.000000'),
          );
        },
      );

      then('the render matches snapshot', () => {
        // the four empty axes share ONE absent row, never one block apiece
        expect(
          out.split('\n').filter((line) => line.includes('no run carried'))
            .length,
        ).toEqual(1);
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case16] a grove whose runs span two days', () => {
    when('[t0] the report is rendered', () => {
      // 🔴 the days and the tree row are two partitions of ONE run list, so the
      // grove total carries the cache the trend moved on. `asReport` refuses a
      // fixture whose days disagree with its total — a `↑ 75.0pp` cache move above
      // a `cache.get 0` grove is a report no real fold can mint
      const report = asReport({
        byTree: [
          asRow({
            key: 'a',
            input: 1100,
            cacheSet: 0,
            cacheGet: 300,
            output: 0,
            runs: 4,
          }),
        ],
        byDay: [
          {
            day: '2026-09-30',
            runs: 2,
            metered: 2,
            tokens: { input: 1000, cacheSet: 0, cacheGet: 0, output: 0 },
            cacheHitRate: 0,
          },
          {
            day: '2026-10-01',
            runs: 2,
            metered: 2,
            tokens: { input: 100, cacheSet: 0, cacheGet: 300, output: 0 },
            cacheHitRate: 0.75,
          },
        ],
      });
      const out = genReviewGroveStdout({ report, limit: 10 });

      then('🔴 the grove total carries the cache its own days carry', () => {
        expect(report.tokens.cacheGet).toEqual(300);
        expect(out).toMatch(/cache\.get\s+300 /);
        expect(out).not.toMatch(/cache\.get\s+0 /);
      });

      then('the levers name the window the trend spans', () => {
        expect(out).toContain('(trend over 2 days)');
      });

      then('each lever carries its move on its own line', () => {
        expect(out).toMatch(/input:.*↓ 60\.0% 🎉/);
        expect(out).toMatch(/cache:.*↑ 75\.0pp 🎉/);
      });

      then('the render matches snapshot', () => {
        // the lever header carries the trend window
        expect(out).toContain(
          'levers — input DOWN · cache UP (trend over 2 days)',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case16b] a fixture whose days disagree with its grove total', () => {
    when('[t0] the report is built', () => {
      then(
        '🔴 the fixture builder refuses it — no real fold can mint it',
        () => {
          // the shape `[case16]` once pinned: a trend over cached days, above a
          // grove total with no cache and no rows
          expect(() =>
            asReport({
              byTree: [],
              byDay: [
                {
                  day: '2026-10-01',
                  runs: 4,
                  metered: 4,
                  tokens: { input: 100, cacheSet: 0, cacheGet: 300, output: 0 },
                  cacheHitRate: 0.75,
                },
              ],
            }),
          ).toThrow('fixture days disagree with the grove totals');
        },
      );
    });
  });

  given('[case3] a grove whose cache rate cannot be computed', () => {
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: {
          ...asReport({ byTree: [] }),
          rateOfCacheHit: null,
        },
        limit: 10,
      });

      then('the rate renders as ABSENT, never as 0.0%', () => {
        expect(out).toContain('absent of prompt tokens served from cache');
        expect(out).not.toContain('0.0% of prompt tokens served from cache');
      });

      then('the render matches snapshot', () => {
        // the cache lever row reads absent, and the prefix row closes the block
        expect(out).toContain(
          '├─ cache:     absent of prompt tokens served from cache',
        );
        expect(out).toContain('└─ prefix:    absent  (no reviewer ran twice)');
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case11] a grove where one tree`s log root could not be read', () => {
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          treesUnreadable: [
            {
              tree: 'repo.beav.feat-denied',
              fault: 'EACCES: permission denied',
            },
          ],
        }),
        limit: 10,
      });

      then('🔴 it names the tree and its fault beside the count', () => {
        // the tree enters no sum, so a reader who cannot see it trusts a total
        // that is short by an amount nobody measured
        // and the count agrees with its noun — `1 tree`, never a bare `1 unreadable`
        expect(out).toContain('1 tree unreadable');
        expect(out).toContain('repo.beav.feat-denied: EACCES');
      });

      then('the fault header names its class, never a bare glyph', () => {
        // a barred log root is a system condition, so the class the reader acts
        // on is named in the header (rule.require.qualified-error-headers)
        expect(out).toContain('💥 MalfunctionError: 1 tree unreadable');
      });

      then('the render matches snapshot', () => {
        // the fault row names the tree and its full fault under the header
        expect(out).toContain(
          '└─ repo.beav.feat-denied: EACCES: permission denied',
        );
        expect(out).toContain('excluded from every figure below:');
        expect(out).toMatchSnapshot();
      });
    });

    when('[t1] every tree read cleanly', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: [] }),
        limit: 10,
      });

      then('no unreadable line renders — a no-op costs no line', () => {
        expect(out).not.toContain('unreadable');
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case13] more rollup rows than the limit', () => {
    // vision case=4 [t2]: `--limit N` truncates the rollups, and SAYS it truncated
    const rows = ['a', 'b', 'c', 'd'].map((key, i) =>
      asRow({
        key: `tree-${key}`,
        input: 1_000 * (4 - i),
        cacheSet: 0,
        output: 0,
      }),
    );

    when('[t0] the report is rendered with limit 2', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: rows }),
        limit: 2,
      });

      then('only the first two rows render', () => {
        expect(out).toContain('tree-a');
        expect(out).toContain('tree-b');
        expect(out).not.toContain('tree-c');
        expect(out).not.toContain('tree-d');
      });

      then('🔴 the truncation is announced with the count it dropped', () => {
        expect(out).toContain('… and 2 more');
      });

      then('the truncation names the lever that lists the rest', () => {
        expect(out).toContain('… and 2 more — raise --limit to list them');
      });

      then('each rollup row names the figure it ranks by', () => {
        // the tree ranks on prompt tokens and the grove on full-rate tokens (F8),
        // so each row names its figure, and a shift between the two pages reads
        // as two rankings rather than a mis-sort. the header stays bare
        expect(out.split('\n')).toContain('   by tree');
        expect(out).toContain('3,000 at full rate');
      });

      then('the render matches snapshot', () => {
        // the truncation notice closes the tree branch
        expect(out).toContain('└─ … and 2 more');
        expect(out).toContain(
          '├─       3,000 at full rate     $1.000000     1 run   tree-b',
        );
        expect(out).toMatchSnapshot();
      });
    });

    when('[t1] the limit covers every row', () => {
      const out = genReviewGroveStdout({
        report: asReport({ byTree: rows }),
        limit: 10,
      });

      then('no truncation notice renders', () => {
        expect(out).toContain('tree-d');
        expect(out).not.toMatch(/… and \d+ more/);
      });

      then('the render matches snapshot', () => {
        // the last row closes the tree branch
        expect(out).toContain(
          '└─       1,000 at full rate     $1.000000     1 run   tree-d',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case14] rows on the stone and reviewer axes', () => {
    // vision case=4 [t0]: a rollup by tree, by route, by stone, and by reviewer
    when('[t0] the report is rendered', () => {
      // one run, read, seen once on each axis — so both axes carry the same
      // run, the same tokens, and the same cost, as a real fold's would
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          byStone: [
            asRow({ key: '5.1.execution', input: 20, cacheSet: 0, output: 0 }),
          ],
          byReviewer: [
            asRow({ key: 'repo-rules', input: 20, cacheSet: 0, output: 0 }),
          ],
          inputs: asInputs({ read: 1, unread: 0 }),
        }),
        limit: 10,
      });

      then('the stone axis renders its row under its own title', () => {
        const section = out.slice(
          out.indexOf('by stone'),
          out.indexOf('by reviewer'),
        );
        expect(section).toContain('5.1.execution');
      });

      then('the reviewer axis renders its row under its own title', () => {
        expect(out.slice(out.indexOf('by reviewer'))).toContain('repo-rules');
      });

      then('the render matches snapshot', () => {
        // each axis row carries its own full-rate figure
        expect(out).toContain(
          '20 at full rate     $1.000000     1 run   5.1.execution',
        );
        expect(out).toContain(
          '20 at full rate     $1.000000     1 run   repo-rules',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case15] a sub-cent metered lane beside a refused lane', () => {
    // the column i038 named: a stored price keeps its measured precision, so a
    // metered `$0.001420008` sat above a refused `$0.00` and the column did not
    // align. both now render at one precision, in one width
    when('[t0] the reviewer axis is rendered', () => {
      // three runs, read, one per lane
      const out = genReviewGroveStdout({
        report: asReport({
          byTree: [],
          inputs: asInputs({ read: 3, unread: 0 }),
          byReviewer: [
            {
              ...asRow({
                key: 'lane-metered',
                input: 30,
                cacheSet: 0,
                output: 0,
              }),
              cost: asIsoPrice('USD 0.001420008'),
            },
            {
              ...asRow({
                key: 'lane-refused',
                input: 0,
                cacheSet: 0,
                output: 0,
              }),
              census: { metered: 0, refused: 1, unknown: 0 },
              cost: asIsoPrice('USD 0'),
            },
            {
              ...asRow({
                key: 'lane-costly',
                input: 20,
                cacheSet: 0,
                output: 0,
              }),
              cost: asIsoPrice('USD 151.92'),
            },
          ],
        }),
        limit: 10,
      });
      const rows = out
        .slice(out.indexOf('by reviewer'))
        .split('\n')
        .filter((line) => line.includes('lane-'));

      then('every nonzero spend renders at one precision', () => {
        expect(rows.join('\n')).toContain('$0.001420');
        expect(rows.join('\n')).toContain('$151.920000');
      });

      then('the refused lane reads $0, its nil a fact, never $0.00', () => {
        // iso-price renders an exact zero as `$0` at any precision — the same `$0`
        // the refused grade promises everywhere else
        const refused = rows.find((line) => line.includes('lane-refused'));
        expect(refused).toContain('$0 ');
        expect(refused).not.toContain('$0.00');
      });

      then('every key starts at the same column', () => {
        const columns = rows.map((line) => line.indexOf('lane-'));
        expect(new Set(columns).size).toEqual(1);
      });

      then('the aligned rows match snapshot', () => {
        // three lane rows, the price column right-aligned
        expect(rows).toHaveLength(3);
        expect(rows.join('\n')).toContain(
          '0 at full rate            $0     1 run   lane-refused',
        );
        expect(rows.join('\n')).toMatchSnapshot();
      });

      then('the whole render matches snapshot', () => {
        // the costly lane closes the reviewer branch
        expect(out).toContain(
          '└─          20 at full rate   $151.920000     1 run   lane-costly',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case12] a grove whose every run is unknown', () => {
    /**
     * .why = the one corpus where "unknown, never $0.00" is the WHOLE report.
     *           every run hit a provider that never answered, so no run proved a
     *           spend — yet the brain may still have billed. a `$0.00` here would
     *           read exactly like a grove that truly spent naught.
     */
    when('[t0] the report is rendered', () => {
      const out = genReviewGroveStdout({
        report: {
          ...asReport({
            byTree: [
              {
                ...asRow({ key: 'a', input: 0, cacheSet: 0, output: 0 }),
                census: { metered: 0, refused: 0, unknown: 1 },
                cost: null,
              },
            ],
            // one run, read, whose spend is unknown
            inputs: asInputs({ read: 1, unread: 0 }),
          }),
          // census, tokens, and cost derive from the row; only the rate is set,
          // since a grove with no prompt tokens has no rate to compute
          rateOfCacheHit: null,
        },
        limit: 10,
      });

      then(
        '🔴 the census states the unknown run beside a zero denominator',
        () => {
          expect(out).toContain('0 metered · 0 refused · 1 unknown');
        },
      );

      then('🔴 the spend renders ABSENT, never $0.00', () => {
        expect(out).toContain('absent');
        expect(out).not.toContain('$0.00');
      });

      then('🔴 the token counts render ABSENT too, never a measured 0', () => {
        expect(out).toMatch(/├─ input\s+absent /);
        expect(out).toMatch(/├─ output\s+absent /);
        expect(out).not.toMatch(/├─ input\s+0 /);
        expect(out).toMatch(/└─\s+absent at full rate/);
      });

      then('the render is stable', () => {
        // the grove cost reads absent with the unknown caveat beside it
        expect(out).toMatch(/└─ cost\s+absent {2}\(\+1 unknown, unrecorded\)/);
        expect(out).toContain(
          'runs:  1 found — 0 metered · 0 refused · 1 unknown',
        );
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case18] a grove whose groups mix metered and unknown runs', () => {
    /**
     * .why = the cost figure over such a group is a PARTIAL sum — the unknown runs
     *        dropped out of it, and they are the timeouts and brain faults most
     *        likely to have been billed in full. the grove marks that floor with
     *        `+N unknown`; a bare figure reads as complete, and a lane full of
     *        timeouts ranks as the cheap one.
     */
    when('[t0] the report is rendered', () => {
      // every count agrees, as the real fold guarantees: a row's `runs` is its
      // census sum, and the report's `runsFound` is the sum over rows. a fixture
      // whose counts disagree would pin a render no real grove can reach
      const byTree: GroveRollupRow[] = [
        {
          ...asRow({ key: 'tree-mixed', input: 30, cacheSet: 0, output: 0 }),
          runs: 5,
          census: { metered: 2, refused: 0, unknown: 3 },
          cost: asIsoPrice('USD 0.04'),
        },
        {
          ...asRow({ key: 'tree-whole', input: 20, cacheSet: 0, output: 0 }),
          runs: 1,
          census: { metered: 1, refused: 0, unknown: 0 },
          cost: asIsoPrice('USD 0.02'),
        },
      ];
      // the census and the cost derive from the rows: 3 metered, 3 unknown, $0.06
      const report = asReport({
        byTree,
        inputs: asInputs({ read: 6, unread: 0 }),
      });
      const out = genReviewGroveStdout({ report, limit: 10 });

      then('the fixture counts agree, as a real fold would', () => {
        for (const row of byTree)
          expect(row.runs).toEqual(
            row.census.metered + row.census.refused + row.census.unknown,
          );
        expect(report.byTree.length).toBeLessThanOrEqual(report.treesWithLogs);
        expect(report.runsFound).toEqual(
          report.census.metered + report.census.refused + report.census.unknown,
        );
      });

      then('🔴 the grove cost row carries the unknown caveat', () => {
        const cost = out.split('\n').find((line) => line.includes('└─ cost '));
        expect(cost).toContain('$0.060000');
        expect(cost).toContain('(+3 unknown, unrecorded)');
      });

      then('🔴 the mixed rollup row carries a terse mark too', () => {
        const row = out.split('\n').find((line) => line.includes('tree-mixed'));
        expect(row).toMatch(/tree-mixed {2}\+3 unknown$/);
      });

      then(
        '🔴 CLAMP. the unrecorded sense is stated once, beside the total cost',
        () => {
          expect(out.split('unrecorded').length - 1).toEqual(1);
          expect(out).not.toContain('🟡');
          expect(out).not.toContain('🔴');
        },
      );

      then('a whole row carries no caveat — the mark is never noise', () => {
        const row = out.split('\n').find((line) => line.includes('tree-whole'));
        expect(row).not.toContain('unknown');
      });

      then('the render is stable', () => {
        // the mixed row counts all five runs, and the census counts all six
        expect(out).toContain('$0.040000     5 runs  tree-mixed');
        expect(out).toContain(
          'runs:  6 found — 3 metered · 0 refused · 3 unknown',
        );
        expect(out).toMatchSnapshot();
      });
    });

    when(
      '[t1] 🔴 CLAMP. the limit cuts the row that holds the unknown runs',
      () => {
        // only metered runs carry tokens, so a lane heavy in unknown runs ranks low —
        // exactly the row a limit cuts. the overflow line must still say its cost is
        // unrecorded, or a driver prunes a lane that only reads cheap
        const byTree: GroveRollupRow[] = [
          {
            ...asRow({ key: 'tree-whole', input: 20, cacheSet: 0, output: 0 }),
            runs: 1,
            census: { metered: 1, refused: 0, unknown: 0 },
            cost: asIsoPrice('USD 0.02'),
          },
          {
            ...asRow({ key: 'tree-mixed', input: 10, cacheSet: 0, output: 0 }),
            runs: 5,
            census: { metered: 2, refused: 0, unknown: 3 },
            cost: asIsoPrice('USD 0.04'),
          },
        ];
        const report = asReport({
          byTree,
          inputs: asInputs({ read: 6, unread: 0 }),
        });
        const out = genReviewGroveStdout({ report, limit: 1 });

        then(
          'the hidden row is gone, and the overflow line counts its unknown runs',
          () => {
            expect(out).not.toContain('tree-mixed');
            expect(out).toContain(
              '└─ … and 1 more — raise --limit to list them  +3 unknown',
            );
            expect(out).toMatchSnapshot();
          },
        );
      },
    );
  });
});
