import { given, then, when } from 'test-fns';

import { asCostLeverLines } from '@src/domain.operations/review/meter/asCostLeverLines';

describe('asCostLeverLines', () => {
  given('[case1] both levers, with no trend to report', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   ',
        figures: { input: '228.4k chars', cache: '44.7%' },
      });

      then(
        'it renders exactly three lines — a header and one per lever',
        () => {
          // a breadth that renders two levers must render BOTH or neither; a
          // partial block argues for the wrong optimization
          // (rule.require.report-both-cost-levers-with-trend-and-locus)
          expect(lines).toHaveLength(3);
        },
      );

      then('the header names the direction each lever is driven', () => {
        // the direction is the whole lesson: a reader who sees two numbers and
        // no arrows cannot tell which way is better
        expect(lines[0]).toContain('input DOWN');
        expect(lines[0]).toContain('cache UP');
      });

      then('each lever carries its own figure, input first', () => {
        expect(lines[1]).toContain('228.4k chars');
        expect(lines[2]).toContain('44.7%');
      });

      then('the whole block matches the snapshot', () => {
        // the rails are the contract — a human scans them, so they are pinned
        expect(lines).toEqual([
          '   ├─ levers — input DOWN · cache UP',
          '   │  ├─ input:     228.4k chars',
          '   │  └─ cache:     44.7%',
        ]);
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] both levers, with a trend on each', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   ',
        figures: { input: '228.4k chars', cache: '44.7%' },
        trend: {
          window: '6 rounds of 5.1.execution.from_vision',
          input: '↓ 58%',
          cache: '↑ 31.0pp',
        },
      });

      then(
        '🔴 the trend rides its own lever line, never a separate block',
        () => {
          // level and direction must read together; split across two blocks, a
          // reader must correlate them by position
          expect(lines).toHaveLength(3);
          expect(lines[1]).toContain('228.4k chars');
          expect(lines[1]).toContain('↓ 58%');
          expect(lines[2]).toContain('44.7%');
          expect(lines[2]).toContain('↑ 31.0pp');
        },
      );

      then('🔴 the header names the WINDOW the trend was read over', () => {
        // an unlabelled trend reads as "over the whole corpus" — the misread
        // that made this surface's first wire-up render two red verdicts for a
        // lever that had improved (`getAllBucketsOfLatestStone`)
        expect(lines[0]).toContain('trend over');
        expect(lines[0]).toContain('6 rounds of 5.1.execution.from_vision');
      });

      then('the whole block matches the snapshot', () => {
        expect(lines[1]).toEqual('   │  ├─ input:     228.4k chars   ↓ 58%');
        expect(lines[2]).toEqual('   │  └─ cache:     44.7%   ↑ 31.0pp');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case3] a prefix that places the block in a deeper tree', () => {
    when('[t0] the lines are rendered under a nested prefix', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   │  ',
        figures: { input: '1.0M chars', cache: '2.8%' },
      });

      then('every line carries the prefix, so the rails stay aligned', () => {
        for (const line of lines)
          expect(line.startsWith('   │  ')).toEqual(true);
      });

      then('the whole block matches the snapshot', () => {
        expect(lines[0]).toEqual('   │  ├─ levers — input DOWN · cache UP');
        expect(lines[2]).toEqual('   │  │  └─ cache:     2.8%');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case4] the section layout the grove renders', () => {
    when('[t0] the lines are rendered with a trend', () => {
      const lines = asCostLeverLines({
        layout: 'section',
        prefix: '   ',
        figures: {
          input: '25 prompt tokens/run',
          cache: 'absent of prompt tokens served from cache',
        },
        trend: { window: '3 days', input: '↓ 10.0% 🎉', cache: '→ flat' },
      });

      then('the header stands bare, with no branch glyph', () => {
        // the grove's block is a top-level section, never a child of one
        expect(lines[0]).toEqual(
          '   levers — input DOWN · cache UP (trend over 3 days)',
        );
      });

      then('the rows pad their labels to the grove total field', () => {
        expect(lines[1]).toEqual(
          '      ├─ input:     25 prompt tokens/run   ↓ 10.0% 🎉',
        );
        expect(lines[2]).toEqual(
          '      └─ cache:     absent of prompt tokens served from cache   → flat',
        );
      });

      then('the whole block matches the snapshot', () => {
        expect(lines).toHaveLength(3);
        expect(lines[0]).not.toContain('├─ levers');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case5] a breadth that holds no trend, and names where one lives',
    () => {
      when('[t0] the lines are rendered with a pointer', () => {
        const lines = asCostLeverLines({
          layout: 'branch',
          prefix: '   ',
          figures: { input: '228.4k chars', cache: '44.7%' },
          trendElsewhere: 'see --of tree',
        });

        then('the header carries the pointer, and no move is invented', () => {
          expect(lines[0]).toEqual(
            '   ├─ levers — input DOWN · cache UP (trend: see --of tree)',
          );
          expect(lines[1]).not.toContain('→');
          expect(lines[2]).not.toContain('→');
        });

        then('the whole block matches the snapshot', () => {
          expect(lines[1]).toEqual('   │  ├─ input:     228.4k chars');
          expect(lines[2]).toEqual('   │  └─ cache:     44.7%');
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });

      when('[t1] a real trend is ALSO supplied', () => {
        const lines = asCostLeverLines({
          layout: 'branch',
          prefix: '   ',
          figures: { input: '228.4k chars', cache: '44.7%' },
          trend: { window: '3 rounds', input: '↓ 5%', cache: '↑ 2.0pp' },
          trendElsewhere: 'see --of tree',
        });

        then('the trend wins — a pointer never shadows a measured move', () => {
          expect(lines[0]).toContain('trend over 3 rounds');
          expect(lines[0]).not.toContain('see --of tree');
        });

        then('the whole block matches the snapshot', () => {
          expect(lines[1]).toEqual('   │  ├─ input:     228.4k chars   ↓ 5%');
          expect(lines[2]).toEqual('   │  └─ cache:     44.7%   ↑ 2.0pp');
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] 🔴 a cache caveat beside a trend', () => {
    when('[t0] the lines are rendered', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   ',
        figures: { input: '228.4k chars', cache: '0.0%' },
        trend: { window: '3 rounds', input: '↓ 5%', cache: '→ flat' },
        caveats: { cache: '  🟡 warm and cached NAUGHT' },
      });

      then('the arrow sits beside its rate, and the caveat trails it', () => {
        expect(lines[2]).toEqual(
          '   │  └─ cache:     0.0%   → flat  🟡 warm and cached NAUGHT',
        );
      });

      then('the input row carries no caveat', () => {
        expect(lines[1]).toEqual('   │  ├─ input:     228.4k chars   ↓ 5%');
      });
    });
  });

  given('[case7] the prefix verdict row under the cache lever', () => {
    when('[t0] the verdicts are given with no footnote', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   ',
        figures: { input: '228.4k chars', cache: '44.7%' },
        verdicts:
          '1 served · 0 missed · 0 self-cached · 0 over-reach · 0 unshared',
      });

      then(
        'the cache row stays open and the prefix row closes the block',
        () => {
          expect(lines[2]).toEqual('   │  ├─ cache:     44.7%');
          expect(lines[3]).toEqual(
            '   │  └─ prefix:    1 served · 0 missed · 0 self-cached · 0 over-reach · 0 unshared',
          );
          expect(lines.length).toEqual(4);
        },
      );
    });

    when('[t1] the verdicts are given beside a footnote', () => {
      const lines = asCostLeverLines({
        layout: 'section',
        prefix: '   ',
        figures: { input: '—', cache: '—' },
        verdicts: 'absent  (no reviewer ran twice)',
        footnote: '— = unmeasured, not zero',
      });

      then(
        'the prefix row stays open and the footnote closes the block',
        () => {
          expect(lines[3]).toEqual(
            '      ├─ prefix:    absent  (no reviewer ran twice)',
          );
          expect(lines[4]).toEqual('      └─ — = unmeasured, not zero');
        },
      );
    });

    when('[t2] no verdicts are given', () => {
      const lines = asCostLeverLines({
        layout: 'branch',
        prefix: '   ',
        figures: { input: '228.4k chars', cache: '44.7%' },
      });

      then('the cache row closes the block, as before', () => {
        expect(lines[2]).toEqual('   │  └─ cache:     44.7%');
        expect(lines.length).toEqual(3);
      });
    });
  });
});
