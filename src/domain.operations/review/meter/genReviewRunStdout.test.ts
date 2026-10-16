import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';
import { SECTIONS_NIL } from '@src/domain.objects/Reviewer/PromptSectionChars';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { genReviewRunStdout } from '@src/domain.operations/review/meter/genReviewRunStdout';

/**
 * .what = one metered run, at a chosen attribution grade
 * .why = the caveat branch turns on `prompt.attribution` alone, so every other
 *        field is held FIXED across the cases — a diff between two renders here
 *        is caused by the grade or by naught.
 */
const asRun = (input: {
  attribution: AttributionGrade | null;
}): Extract<ReviewRunMeter, { grade: 'metered' }> => ({
  dir: '.log/bhrain/review/2026-09-21T10-00-00-000Z.pid1.abc',
  head: null,
  brain: null,
  provider: null,
  identity: {
    slug: 'repo-rules',
    stone: '5.1.execution.from_vision',
    iteration: 6,
    index: 1,
    hash: 'e1fd84dfa93c018090',
    route: '.behavior/v2026_09_20.review-cost-meter',
  },
  grade: 'metered',
  defect: null,
  scope: { rulesCount: 27, refsCount: 0, targetsCount: 12, focus: 'push' },
  tokens: { input: 1_000, cacheSet: 50_000, cacheGet: 40_000, output: 500 },
  cost: { total: asIsoPrice('USD 0.0402'), cacheSaved: null },
  prompt: {
    chars: 100_000,
    targets: 12,
    source: 'compiled',
    attribution: input.attribution,
    sections: { ...SECTIONS_NIL, rules: 60_000, scaffold: 40_000 },
    // null, and deliberately so: this row is `source: 'compiled'`, and a compiled
    // artifact carries per-INPUT rows with no per-TARGET ones. so the default
    // fixture exercises the UNREAD locus branch, which is the state most runs on
    // disk are actually in — `[case9]` carries a read one
    locus: null,
  },
});

const ROOT = '/home/dev/repo';

describe('genReviewRunStdout', () => {
  given('[case1] a run the census can vouch for', () => {
    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({
        run: asRun({ attribution: 'attributed' }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'cache:     44.0% of prompt tokens served from cache',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('it names the grade beside the rows it qualifies', () => {
        expect(stdout).toContain('attribution: attributed');
      });

      then('🔴 NO caveat is rendered — there is naught to warn about', () => {
        expect(stdout).not.toContain('UNATTRIBUTED');
      });

      then('every named input carries a row', () => {
        expect(stdout).toContain('rules');
        expect(stdout).toContain('refs');
        expect(stdout).toContain('conversation');
        expect(stdout).toContain('targetDiffs');
        expect(stdout).toContain('targetFiles');
        expect(stdout).toContain('scaffold');
      });

      then('each row states which side of the cache seam it sat on', () => {
        expect(stdout).toContain('cacheable');
        expect(stdout).toContain('per round');
      });
    });
  });

  given('[case2] a run the census CANNOT vouch for', () => {
    /**
     * .why = the human-visible face of wish bar 2, and the reason this file
     *        exists. `scaffold` is a residual at its source, so an input that
     *        entered with no row of its own lands there and the rows still
     *        sum to `chars` — the sum can never catch it, so this caveat is
     *        the one signal that tells a reader their percentages are not
     *        vouched for. it had zero coverage before this case: a rename of
     *        `HINT_OF_UNATTRIBUTED`, a broken `===`, or a deleted block would
     *        all have shipped green.
     */
    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({
        run: asRun({ attribution: 'unattributed' }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          '(source: compiled, attribution: unattributed)',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 the caveat is rendered', () => {
        expect(stdout).toContain('🟡 UNATTRIBUTED');
        expect(stdout).toContain('scaffold may hide an input with no row');
      });

      then('🔴 it names what to check FIRST, never the symptom alone', () => {
        // a bare `unattributed` teaches a reader naught. the commonest cause is
        // legitimate — many small targets — so the caveat rules that OUT before
        // it sends anyone after a defect (rule.require.errors-name-the-fix)
        expect(stdout).toContain('check FIRST');
        expect(stdout).toContain('many small targets');
      });

      then('🔴 it names the fix where the cause is a real absent input', () => {
        // the else-arm is the one a driver needs when the corpus is NOT many small
        // files: the four names an input must be added to
        expect(stdout).toContain('else: a real input lacks a row');
        expect(stdout).toContain('PromptInputName');
        expect(stdout).toContain('SECTION_OF_INPUT');
      });

      then(
        '🔴 the caveat holds the one leaf `└─`; the last row does not',
        () => {
          // a `└─` that a caveat then reopens reads as a broken tree
          expect(stdout).toContain(
            '      ├─ conversation              0 chars    0.0%  per round\n      └─ 🟡 UNATTRIBUTED',
          );
        },
      );

      then('the grade also rides on the composition line itself', () => {
        expect(stdout).toContain('attribution: unattributed');
      });

      then('🔴 the rows are still rendered — a caveat is not a refusal', () => {
        // the census records what it read and declines to VOUCH for it. to
        // withhold the rows would hide a measurement that is probably fine
        expect(stdout).toContain('scaffold');
        expect(stdout).toContain('rules');
      });
    });
  });

  given('[case3] a run whose prompt predates the grade entirely', () => {
    /**
     * ~2,700 runs on disk were written before the field existed. their silence
     * must render as an ABSENCE, never as the clean grade.
     */
    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({
        run: asRun({ attribution: null }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain('(source: compiled, attribution: —)');
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 the grade reads absent, never `attributed`', () => {
        expect(stdout).toContain('attribution: —');
        expect(stdout).not.toContain('attribution: attributed');
      });

      then('🔴 and NO caveat is rendered either', () => {
        // an unstated grade is not an `unattributed` one. to warn here would
        // claim a verdict nobody rendered, in the other direction
        expect(stdout).not.toContain('UNATTRIBUTED');
      });
    });
  });

  given('[case4] a run that compiled no prompt at all', () => {
    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({
        run: { ...asRun({ attribution: null }), prompt: null },
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain('└─ composition: —');
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 it says so plainly rather than render a census of zeros', () => {
        expect(stdout).toContain('composition: —');
        expect(stdout).toContain('🟡 UNREAD');
        expect(stdout).toContain('no input can be attributed');
      });

      then('it names no cause the null cannot establish', () => {
        // a null prompt may be absent, pruned, or unparseable; the meter cannot
        // tell which, so the row must not claim one
        expect(stdout).toContain('the prompt could not be read');
        expect(stdout).not.toContain('compiled');
      });

      then('no input row is rendered', () => {
        expect(stdout).not.toContain('targetDiffs');
      });
    });
  });

  given('[case5] a run whose artifacts could NOT be parsed', () => {
    /**
     * .why = the diagnostic that was computed, stored, asserted in data — and
     *        read by no renderer at any breadth. `asReviewRunMeterOfDefect`
     *        stamps a corrupt run with the file at fault and the reason, and
     *        `getOneReviewRunMeterLatest`'s own comment promises an `unknown`
     *        row that names its defect. every other honesty signal this
     *        branch ships surfaces its cause to the human on purpose; this
     *        one was dropped in exactly the moment it is worth most
     *        (rule.require.errors-name-the-fix). it compounded too: a defect
     *        row also carries `identity: null`, so it read the text written
     *        for a legitimate hand run — "all is well" over a corruption.
     */
    const asRunOfDefect = (): ReviewRunMeter => ({
      ...asRun({ attribution: null }),
      identity: null,
      grade: 'unknown',
      defect:
        'failed to parse metrics.realized.json: Unexpected token h in JSON at position 2',
      tokens: null,
      cost: null,
      prompt: null,
    });

    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({ run: asRunOfDefect(), root: ROOT });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'defect: 💥 MalfunctionError: failed to parse metrics.realized.json',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 the defect NAMES the file a human must repair', () => {
        expect(stdout).toContain('defect:');
        expect(stdout).toContain('metrics.realized.json');
      });

      then('🔴 the identity does NOT read as a legitimate hand run', () => {
        // the misread this repairs: `identity: null` has two causes, and the text
        // for the benign one told a driver in front of a corrupt log that naught
        // went wrong (rule.forbid.failhide)
        expect(stdout).not.toContain('a hand or review.by run');
        expect(stdout).toContain('🟡 UNPARSED');
      });

      then('🟡 its label is DISTINCT from the absent-prompt one', () => {
        // `UNPARSED` names the identity parse that failed; `UNREAD` names an
        // artifact the composition row could not read. one word over two states
        // is a re-read (rule.forbid.ambiguous-labels)
        expect(stdout).toContain('composition: —');
        expect(stdout).not.toContain('UNPARSED — no prompt');
      });

      then(
        '🔴 the composition row defers to the defect, never names a cause',
        () => {
          // a null prompt on a defect run is unknown, not "never compiled" — a row
          // that asserts a cause sends the driver to the wrong subsystem, and
          // contradicts the identity row beside it
          expect(stdout).toContain(
            'composition: —\n      └─ 🟡 UNREAD — see the defect below',
          );
          expect(stdout).not.toContain('compiled');
        },
      );

      then('🔴 the spend still reads absent, never $0', () => {
        expect(stdout).toContain(
          'cost: —  🟡 unknown, not $0 — the brain may have charged',
        );
        expect(stdout).not.toMatch(/cost: \$/);
      });
    });

    when('[t1] a HEALTHY run is rendered beside it', () => {
      const stdout = genReviewRunStdout({
        run: asRun({ attribution: 'attributed' }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'identity: repo-rules · 5.1.execution.from_vision · i6',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 no defect line is rendered at all', () => {
        // the row is conditional, so a healthy run must not grow an empty one
        expect(stdout).not.toContain('defect:');
        expect(stdout).not.toContain('UNPARSED');
      });

      then('and its identity still reads the guard that minted it', () => {
        expect(stdout).toContain('repo-rules');
      });
    });

    when('[t2] the defect string is MULTI-LINE, as a HelpfulError is', () => {
      /**
       * .why = the shape the real producer emits, and the one a hand-written
       *        fixture hides. `UnexpectedCodePathError` serializes as a
       *        message then a pretty-printed metadata block, so the naive
       *        render spilled four unglyphed lines through the middle of the
       *        tree and broke every row's alignment below it
       *        (rule.require.treestruct-output). caught by eye in the
       *        `[case9]` acceptance snapshot, which is the whole reason that
       *        snapshot is taken.
       */
      const run = {
        ...asRunOfDefect(),
        defect: [
          'review log artifact is present but unparseable: metrics.realized.json',
          '',
          '{',
          '  "file": "metrics.realized.json",',
          '  "error": "SyntaxError: Expected property name"',
          '}',
        ].join('\n'),
      };
      const stdout = genReviewRunStdout({ run, root: ROOT });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toMatchSnapshot();
      });

      then(
        '🔴 the full-error hint names THIS run, never the latest one',
        () => {
          // a bare `--of run` reads the newest run, so a reader who opened an older
          // run would follow the pointer to some other run's json
          expect(stdout).toContain(
            `└─ full error: rhx review._.cost --of run --at ${run.dir} --json`,
          );
          expect(stdout).not.toContain('--of run --json');
        },
      );

      then(
        '🔴 EVERY line of the render carries a tree glyph or is blank',
        () => {
          // the assertion that actually catches the spill: a leaked metadata line
          // has no `│`, so it fails here and passes every `toContain` above
          const GLYPHS_OF_TREE = ['│', '├', '└'];
          const spilled = stdout
            .split('\n')
            .filter((line) => line.trim() !== '')
            .filter((line) => !line.startsWith('🦉'))
            .filter(
              (line) => !GLYPHS_OF_TREE.some((glyph) => line.includes(glyph)),
            );
          expect(spilled).toEqual([]);
        },
      );

      then('the headline still names the file at fault', () => {
        expect(stdout).toContain('defect:');
        expect(stdout).toContain('metrics.realized.json');
      });

      then('🔴 and the truncation NAMES where the rest is read', () => {
        // a render that silently drops detail is a failhide. it is only honest
        // because it names where the full error survives in `--json`
        expect(stdout).toContain('full error:');
        expect(stdout).toContain('--json');
      });

      then('the metadata block itself does NOT reach stdout', () => {
        expect(stdout).not.toContain('SyntaxError');
      });
    });
  });

  given('[case6] a run billed no cache WRITE that read a cache anyway', () => {
    /**
     * .why = the last nil on this surface that had no grade beside it. every
     *        brain metered in this tree bills `cache.set = 0` — 58 of 58 runs
     *        — while it serves real cache reads. so the figure looks like a
     *        term that never fires, and the misread sits upstream of a
     *        repair: a reader who takes it for unmeasured would propose to
     *        cut the term from `getOneCacheHitRate`'s denominator, which
     *        silently sends the rate too high for any brain that does bill a
     *        cache write. the zero is MEASURED — `getOneReviewRunMeter`
     *        throws where the field is absent rather than coerce it to `0` —
     *        so the surface says which kind of zero it is, exactly as the
     *        spend (`refused` vs `unknown`) and the composition
     *        (`attributed` vs `unattributed`) already do (rule.forbid.failhide).
     */
    const asRunOfTokens = (input: {
      cacheSet: number;
      cacheGet: number;
    }): ReviewRunMeter => ({
      ...asRun({ attribution: 'attributed' }),
      tokens: {
        input: 1_000,
        cacheSet: input.cacheSet,
        cacheGet: input.cacheGet,
        output: 500,
      },
    });

    when('[t0] cache.set is 0 and cache.get is not', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfTokens({ cacheSet: 0, cacheGet: 40_000 }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'cache:     97.6% of prompt tokens served from cache',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 the zero is NAMED as measured, never read as unrecorded', () => {
        expect(stdout).toContain('a MEASURED zero');
      });

      then('and it rides the cache.set row, never a row of its own', () => {
        // the caveat qualifies ONE figure, so it must sit beside that figure — a
        // caveat on a line of its own would leave a reader to guess which row it
        // grades
        const rowOfCacheSet = stdout
          .split('\n')
          .filter((line) => line.includes('cache.set:'));
        expect(rowOfCacheSet).toHaveLength(1);
        expect(rowOfCacheSet[0]).toContain('a MEASURED zero');
      });
    });

    when('[t1] BOTH cache figures are 0 — a cold run', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfTokens({ cacheSet: 0, cacheGet: 0 }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'cache:     0.0% of prompt tokens served from cache',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 NO caveat is rendered — a cold run needs no word', () => {
        // the clamp that keeps the caveat meaningful. a zero beside a zero is an
        // unremarkable first round; to grade it would spend the reader's attention
        // on every cold run and teach them to skip the line
        expect(stdout).not.toContain('a MEASURED zero');
      });

      then('the row itself is still rendered, with its figure', () => {
        expect(stdout).toContain('cache.set: 0');
      });

      then(
        '🔴 the zero-rate caveat names all three causes, the reach among them',
        () => {
          // one run cannot part a first round, a prefix aged past the reach, and a
          // warm miss — so the caveat must name each, or a reader treats a lapse
          // (a loss a shorter pause prevents) as the weather
          expect(stdout).toContain('a cold first run');
          expect(stdout).toContain('a prefix past the 66-minute reach');
          expect(stdout).toContain('a warm miss read alike here');
        },
      );
    });

    when('[t2] a cache WRITE was billed', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfTokens({ cacheSet: 50_000, cacheGet: 40_000 }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain('cache.set: 50.0k');
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 NO caveat is rendered — the term demonstrably fires', () => {
        expect(stdout).not.toContain('a MEASURED zero');
      });
    });
  });

  given('[case8] the LOCUS — where the target mass actually came from', () => {
    /**
     * .why = the gap the whole `--of run` breadth had: it rendered the two levers
     *        and a census by named INPUT, and a reader who learned that
     *        `targetFiles` is 87.6% of a megabyte still could not name one
     *        directory to prune. the rollup that first answered it was written BY
     *        HAND, which is the tell that the tool owed it
     *        (rule.require.report-both-cost-levers-with-trend-and-locus).
     */
    const asRunOfLocus = (input: {
      locus: { path: string; chars: number }[] | null;
    }): ReviewRunMeter => {
      const base = asRun({ attribution: 'attributed' });
      return {
        ...base,
        ...asRunPartsOfReadLocus({ base, locus: input.locus }),
      };
    };

    /**
     * .what = the scope and prompt a run carries where its locus was read from a parse
     * .why = 🔴 one re-parse of the prompt yields BOTH the per-input `sections` and the
     *        per-path `locus`, so on a read locus the target rows must sum to the locus
     *        mass, and the target count must match the files placed. a fixture where
     *        70.0k chars of locus sit beside `targetFiles 0` pins a report no real fold
     *        can mint (i018 r026 nitpick.1). the non-target rows absorb the rest of the
     *        100.0k, so the prompt total holds
     */
    const asRunPartsOfReadLocus = (input: {
      base: ReviewRunMeter;
      locus: { path: string; chars: number }[] | null;
    }): Pick<ReviewRunMeter, 'scope' | 'prompt'> => {
      // a read locus can only come from a parsed prompt — the compiled artifact
      // carries no per-target rows
      const prompt = {
        ...input.base.prompt!,
        source:
          input.locus === null ? ('compiled' as const) : ('parsed' as const),
        attribution: input.locus === null ? ('attributed' as const) : null,
        locus: input.locus,
      };

      // an unread or empty locus places no target mass: the base rows stand as they are
      const placed = input.locus ?? [];
      if (placed.length === 0) return { scope: input.base.scope, prompt };

      // a placed locus: its mass IS the target rows, and its files ARE the targets
      const mass = placed.reduce((sum, one) => sum + one.chars, 0);
      return {
        scope: input.base.scope && {
          ...input.base.scope,
          targetsCount: placed.length,
        },
        prompt: {
          ...prompt,
          targets: placed.length,
          sections: {
            ...SECTIONS_NIL,
            rules: 20_000,
            scaffold: prompt.chars - 20_000 - mass,
            targetFiles: mass,
          },
        },
      };
    };

    when('[t0] the targets cluster in two directories', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfLocus({
          locus: [
            { path: 'src/domain.operations/review/one.ts', chars: 40_000 },
            { path: 'src/domain.operations/review/two.ts', chars: 20_000 },
            { path: 'src/contract/cli/three.ts', chars: 10_000 },
          ],
        }),
        root: ROOT,
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'target mass by directory — 70.0k chars over 2 directories',
        );
        expect(stdout).toMatchSnapshot();
      });

      then('🔴 it names a DIRECTORY, which is what a reader ca prune', () => {
        // the census could only name `targetFiles`; a kind is not an address
        expect(stdout).toContain('src/domain.operations');
        expect(stdout).toContain('src/contract/cli');
      });

      then('the heaviest directory leads, never the alphabetical first', () => {
        // the question is "what is big enough to prune", so weight sets the order
        const lines = stdout.split('\n');
        const head = lines.findIndex((line) =>
          line.includes('target mass by directory'),
        );
        expect(lines[head + 1]).toContain('src/domain.operations');
      });

      then('each row carries its SHARE, never a bare char count', () => {
        // 60k of 70k target chars — a total with no share funds no decision
        expect(stdout).toContain('85.7%');
      });
    });

    when('[t1] the locus could not be read', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfLocus({ locus: null }),
        root: ROOT,
      });

      then('🔴 it reads UNREAD, and never "no directory carried mass"', () => {
        // the inversion this refuses: a run whose directories were never recorded
        // must not render as a run whose directories carried naught
        // (rule.forbid.failhide · hazard.a-status-read-cannot-report-absence)
        expect(stdout).toContain('🟡 UNREAD');
        expect(stdout).not.toContain('0 directories');
      });

      then('🔴 it names the ARTIFACT to look for, and invents no flag', () => {
        // the defect this refuses: an earlier draft of this message named
        // `--source parsed` — a flag `review._.cost` does not take. a fix that
        // cannot be run is WORSE than no fix named at all, since the reader spends
        // the round on the suggestion rather than on the cause. so the next move
        // names a FILE, which is real, and says plainly that no flag reaches it
        // (rule.require.errors-name-the-fix — the fix must be concrete AND exist)
        expect(stdout).toContain('input.prompt.md');
        expect(stdout).toContain('no flag of this command will help');
        expect(stdout).not.toContain('--source');
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          '├─ target mass by directory — not recorded\n   │  └─ 🟡 UNREAD',
        );
        // a bare absent mark after the separator reads as a doubled dash
        expect(stdout).not.toContain('target mass by directory — —');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t2] a pull-focus prompt sent paths and no payload', () => {
      const stdout = genReviewRunStdout({
        run: asRunOfLocus({ locus: [] }),
        root: ROOT,
      });

      then('🔴 an empty locus is a FACT, and reads apart from UNREAD', () => {
        // `[]` and `null` are the two states a single figure would flatten: one is
        // "this focus sends no payload", the other is "nobody recorded it"
        expect(stdout).toContain('no per-target mass to place');
        expect(stdout).not.toContain('🟡 UNREAD');
      });

      then('and it names the focus that caused it', () => {
        expect(stdout).toContain('--focus pull');
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          '├─ target mass by directory — no per-target mass to place',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case9] a refused run whose targets are split by named input', () => {
    /**
     * .why = the split render names a count beside a noun per input, and the
     *        smallest legal split holds ONE file in an input. `1 files` there makes
     *        a reader doubt the figure beside it, so the singular path is pinned
     */
    when('[t0] each input holds at most one file', () => {
      const stdout = genReviewRunStdout({
        run: { ...asRun({ attribution: 'attributed' }), prompt: null },
        root: ROOT,
        split: {
          targetsRecorded: 3,
          targetsGone: 0,
          locus: {
            targetFiles: [{ path: 'src/logic/edit.ts', chars: 4_000 }],
            'targetDiffs.additions': [
              { path: 'src/logic/added.ts', chars: 9_000 },
            ],
            'targetDiffs.deletions': [],
            'targetDiffs.mutations': [
              { path: 'src/logic/edit.ts', chars: 1_000 },
            ],
          },
        },
      });

      then('a single file reads `1 file`, never `1 files`', () => {
        expect(stdout).toContain('1 file —');
        expect(stdout).not.toContain('1 files');
      });

      then('an empty input still reads its plural', () => {
        expect(stdout).toContain('0 files —');
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'targets split: 14.0k chars (re-derived from the current worktree)',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case10] the lever block of any run', () => {
    when('[t0] it is rendered', () => {
      const stdout = genReviewRunStdout({
        run: asRun({ attribution: 'attributed' }),
        root: ROOT,
      });

      then('🔴 it names where the trend lives, since a run holds none', () => {
        // a breadth that omits a stat its peers carry must at least say where the
        // stat lives (rule.require.report-both-cost-levers-with-trend-and-locus)
        expect(stdout).toContain('trend: one run is one sample');
        expect(stdout).toContain('rhx review._.cost --of tree');
      });
    });
  });

  given('[case11] the two unmetered grades on the lever block', () => {
    /**
     * .why = `refused` proves no prompt was sent; `unknown` may have been charged.
     *        one caveat for both read "unknown … (grade = refused)", which contradicts
     *        itself, so each grade's levers are pinned as their own claim
     */
    when('[t0] a refused run is rendered', () => {
      const stdout = genReviewRunStdout({
        run: {
          ...asRun({ attribution: null }),
          grade: 'refused',
          tokens: null,
          cost: null,
          prompt: null,
        },
        root: ROOT,
      });

      then('its input lever reads a nil FACT, never unknown', () => {
        expect(stdout).toContain(
          'input:     0  (refused at validation — no prompt was sent)',
        );
        expect(stdout).not.toContain('unmeasured');
        expect(stdout).not.toContain('unknown, not $0');
      });

      then('🔴 its cost reads $0, a nil FACT', () => {
        expect(stdout).toContain(
          'cost: $0  (refused at validation — nil cost is a FACT)',
        );
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          'input:     0  (refused at validation — no prompt was sent)',
        );
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] an unknown run is rendered', () => {
      const stdout = genReviewRunStdout({
        run: {
          ...asRun({ attribution: null }),
          grade: 'unknown',
          tokens: null,
          cost: null,
        },
        root: ROOT,
      });

      then(
        'both levers read a bare mark, and the block keys it once with its grade',
        () => {
          expect(stdout).toContain(
            '│  ├─ input:     —\n   │  ├─ cache:     —\n   │  └─ — = unmeasured, not zero (grade = unknown)',
          );
        },
      );

      then('🔴 the lever caveat appears exactly once, never per row', () => {
        expect(stdout.match(/unmeasured, not zero/g)?.length).toEqual(1);
        expect(stdout.match(/\(grade = unknown\)/g)?.length).toEqual(2); // the key, and the tokens row
      });

      then('🔴 neither lever nor the cost renders as zero', () => {
        expect(stdout).not.toMatch(/(input|cache): {2}0/);
        expect(stdout).not.toMatch(/cost: \$/);
        expect(stdout.match(/unknown, not \$0/g)?.length).toEqual(1);
      });

      then('the whole render is pinned, rails and order included', () => {
        expect(stdout).toContain(
          '└─ — = unmeasured, not zero (grade = unknown)',
        );
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case12] a run whose spend is a whole dollar', () => {
    /**
     * .why = the run breadth once rendered spend through `asIsoPriceHuman`, which
     *        drops an all-zero fraction, so a whole-dollar run read `$1` here while
     *        the tree and grove columns read `$1.000000`. one render now serves all
     *        three breadths, and this case pins the run breadth to it
     */
    when('[t0] it is rendered for a human', () => {
      const stdout = genReviewRunStdout({
        run: {
          ...asRun({ attribution: 'attributed' }),
          cost: { total: asIsoPrice('USD 1'), cacheSaved: null },
        },
        root: ROOT,
      });

      then('the cost row carries the six digits every breadth shares', () => {
        expect(stdout).toContain('cost: $1.000000');
      });
    });
  });
});
