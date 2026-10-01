import { given, then, when } from 'test-fns';

import { formatRouteDriveWhere } from './formatRouteDriveWhere';

/**
 * .what = pins the `where do we go?` bucket, which SIX drive surfaces splice into their
 *         own trees (drive, exhausted, malfunction, blocked, mixed halt, budget exhausted)
 * .why = it is the single source those six now share, so a defect here lands on every
 *        halt at once. a pure transformer, at the UNIT grain per
 *        `rule.require.test-coverage-by-grain`
 *
 * 🔴 .why the GLYPHS are asserted and not merely the values = the whole point of one
 *    source is that the tree is drawn identically on all six surfaces. an assert on
 *    `toContain('stone = 1.vision')` would pass on a build whose elbow was wrong, which is
 *    exactly the blemish `rule.forbid.snapshot-visual-blemishes` names and exactly what a
 *    reader notices first
 */
describe('formatRouteDriveWhere', () => {
  given('[case1] a stone with no prescribed brain', () => {
    // 🔴 .why = every extant route in every repo takes this branch, so it is the arm with
    //          the widest blast radius by a wide margin (case=10)
    when('[t0] the bucket is rendered', () => {
      const lines = formatRouteDriveWhere({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        brain: null,
        effort: null,
      });

      then('it is exactly the three lines the pre-feature build drew', () => {
        // 🔴 .why an EQUALITY assert on the whole array = case=10's bound is BYTE identity
        //    with the build before this feature. not "near enough", not "plus a blank
        //    row" — an equality assert is the only shape that proves no line was added to
        //    a route that never asked for one
        expect(lines).toEqual([
          `   ├─ where do we go?`,
          `   │  ├─ route = .behavior/v2026_09_03.example`,
          `   │  └─ stone = 1.vision`,
        ]);
      });

      then('the elbow sits on `stone`, since it is last', () => {
        expect(lines[2]).toContain('└─');
        expect(lines[1]).toContain('├─');
      });

      then('the word `brain` appears nowhere at all', () => {
        // 🔴 .why = an omitted line must leave NO trace — not a blank row, not an empty
        //          `brain = `. that is what makes the omission invisible rather than a gap
        expect(lines.join('\n')).not.toContain('brain');
      });
    });
  });

  given('[case2] a stone that runs on a named brain', () => {
    when('[t0] the bucket is rendered', () => {
      const lines = formatRouteDriveWhere({
        route: '.behavior/v2026_09_03.example',
        stone: '2.criteria',
        brain: 'claude-opus-5[1m]',
        effort: null,
      });

      then(
        'the brain is a LINE in the bucket, never a section above it',
        () => {
          // 🔴 .why an EQUALITY assert = the defect this replaced was a whole tree prepended
          //    ABOVE the drive — the brain, its reviewers, and the stone that last set it.
          //    a `toContain` would pass with that tree back in place; only equality refuses
          //    it. "which brain?" is the same KIND of question as "which route?", so it is
          //    read in the same glance, in the same shape
          expect(lines).toEqual([
            `   ├─ where do we go?`,
            `   │  ├─ route = .behavior/v2026_09_03.example`,
            `   │  ├─ stone = 2.criteria`,
            `   │  └─ brain = claude-opus-5[1m]`,
          ]);
        },
      );

      then('the elbow MOVED from `stone` to `brain`', () => {
        // 🟡 the elbow belongs to whichever line is last. a build that appended the brain
        //    without demotion of `stone` would draw two `└─` in one bucket
        expect(lines[2]).toContain('├─');
        expect(lines[3]).toContain('└─');
        expect(lines.filter((line) => line.includes('└─'))).toHaveLength(1);
      });

      then('the brain sits BELOW the stone, never above it', () => {
        const output = lines.join('\n');
        expect(output.indexOf('stone =')).toBeLessThan(
          output.indexOf('brain ='),
        );
      });
    });
  });

  given('[case3] the two shapes, read as a pair', () => {
    when('[t0] one route is rendered with and without a brain', () => {
      const without = formatRouteDriveWhere({
        route: '.',
        stone: '2.criteria',
        brain: null,
        effort: null,
      });
      const with_ = formatRouteDriveWhere({
        route: '.',
        stone: '2.criteria',
        brain: 'sonnet',
        effort: null,
      });

      then('the brain costs exactly ONE line, never a section', () => {
        // 🔴 .why = the size of the delta IS the fix. the build this replaced cost four
        //          lines and a blank separator above the drive body
        expect(with_.length - without.length).toEqual(1);
      });

      then('the first two lines are byte-identical across both', () => {
        // .why = the header and the route are facts about the drive, not about the brain,
        //        so no brain state may perturb them
        expect(with_.slice(0, 2)).toEqual(without.slice(0, 2));
      });
    });
  });

  given('[case4] a stone that declares BOTH a choice and an effort', () => {
    // the exploded `brain:` + `choice:` + `effort:` form — the shape a guard reaches for
    // when it wants to re-price a stone on both axes at once
    when('[t0] the bucket is rendered', () => {
      const lines = formatRouteDriveWhere({
        route: '.',
        stone: '2.criteria',
        brain: 'opus[1m]',
        effort: 'medium',
      });

      then(
        '`brain` is a bare parent over `choice =` and `effort =` as peers',
        () => {
          // 🔴 .why an EQUALITY assert = choice and effort are two properties of one brain, so
          //    they sit at one rank beneath it (S15). `brain = <choice>` over `effort =` would
          //    read the effort as a child of the choice
          expect(lines).toEqual([
            `   ├─ where do we go?`,
            `   │  ├─ route = .`,
            `   │  ├─ stone = 2.criteria`,
            `   │  └─ brain`,
            `   │     ├─ choice = opus[1m]`,
            `   │     └─ effort = medium`,
          ]);
        },
      );

      then('the continuation under `brain` is SPACES, never a `│`', () => {
        // 🟡 `brain` is the last row wherever it renders, so naught hangs below it but its
        //    own children — a `│` there would draw a branch to a peer that cannot exist
        expect(lines.slice(4)).toEqual([
          `   │     ├─ choice = opus[1m]`,
          `   │     └─ effort = medium`,
        ]);
      });
    });
  });

  given('[case5] a stone that declares an effort ALONE', () => {
    // the exploded form with `effort:` and no `choice:` — the driver re-prices the stone
    // without a switch of brains, so the inherited choice stands
    when('[t0] the bucket is rendered', () => {
      const lines = formatRouteDriveWhere({
        route: '.',
        stone: '2.criteria',
        brain: null,
        effort: 'high',
      });

      then(
        'the `brain` node renders BARE, with the effort its only child',
        () => {
          // 🔴 .why no `choice =` row = no choice was declared, so none is named. the effort
          //    still hangs from the parent it belongs under
          expect(lines).toEqual([
            `   ├─ where do we go?`,
            `   │  ├─ route = .`,
            `   │  ├─ stone = 2.criteria`,
            `   │  └─ brain`,
            `   │     └─ effort = high`,
          ]);
        },
      );

      then('no empty `brain = ` is ever drawn', () => {
        expect(lines.join('\n')).not.toContain('brain = ');
      });
    });
  });

  given('[case6] a route path that wants a display cast', () => {
    when('[t0] the repo root is the route', () => {
      const lines = formatRouteDriveWhere({
        route: '.',
        stone: '1.vision',
        brain: null,
        effort: null,
      });

      then('the route renders through `asRouteDisplayPath`', () => {
        // .why = the cast is the bucket's, so all six surfaces inherit it rather than each
        //        re-derive a display form
        expect(lines[1]).toEqual(`   │  ├─ route = .`);
      });
    });
  });
});
