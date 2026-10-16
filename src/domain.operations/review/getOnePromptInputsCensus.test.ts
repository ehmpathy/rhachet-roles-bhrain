import { given, then, when } from 'test-fns';

import { SECTIONS_NIL } from '@src/domain.objects/Reviewer/PromptSectionChars';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

import { getOnePromptInputsCensus } from './getOnePromptInputsCensus';

/**
 * .what = one run whose prompt was read, with a chosen locus
 * .why = the fold reads only `prompt`; every other field is held at its unread form
 */
const asRun = (input: {
  dir: string;
  locus: { path: string; chars: number }[] | null;
}): ReviewRunMeter => ({
  dir: input.dir,
  identity: null,
  head: null,
  brain: null,
  provider: null,
  grade: 'unknown',
  defect: null,
  scope: null,
  tokens: null,
  cost: null,
  prompt: {
    chars: 100,
    targets: input.locus?.length ?? 0,
    sections: { ...SECTIONS_NIL, scaffold: 100 },
    source: 'compiled',
    attribution: 'attributed',
    locus: input.locus,
  },
});

describe('getOnePromptInputsCensus', () => {
  given('[case1] runs that placed their target mass, some on one path', () => {
    const census = getOnePromptInputsCensus({
      runs: [
        asRun({
          dir: '/r1',
          locus: [
            { path: 'src/a.ts', chars: 10 },
            { path: 'src/b.ts', chars: 5 },
          ],
        }),
        asRun({ dir: '/r2', locus: [{ path: 'src/a.ts', chars: 7 }] }),
      ],
    });

    when('[t0] the locus is folded', () => {
      then(
        '🔴 a path sent in two rounds is ONE row with its mass summed',
        () => {
          expect(census.locus.targets).toEqual([
            { path: 'src/a.ts', chars: 17 },
            { path: 'src/b.ts', chars: 5 },
          ]);
        },
      );

      then('every run that recorded a locus is counted as placed', () => {
        expect(census.locus.placed).toEqual(2);
      });
    });
  });

  given(
    '[case2] a run that predates the locus row, beside one that has it',
    () => {
      const census = getOnePromptInputsCensus({
        runs: [
          asRun({ dir: '/r1', locus: null }),
          asRun({ dir: '/r2', locus: [{ path: 'src/a.ts', chars: 7 }] }),
        ],
      });

      when('[t0] the locus is folded', () => {
        then(
          '🔴 the unplaced run is left out and counted apart, never folded as zero',
          () => {
            expect(census.read).toEqual(2);
            expect(census.locus.placed).toEqual(1);
            expect(census.locus.targets).toEqual([
              { path: 'src/a.ts', chars: 7 },
            ]);
          },
        );
      });
    },
  );

  given('[case3] a run whose walk placed no target', () => {
    const census = getOnePromptInputsCensus({
      runs: [asRun({ dir: '/r1', locus: [] })],
    });

    when('[t0] the locus is folded', () => {
      then('it is PLACED, with no rows — a fact, not an absence', () => {
        expect(census.locus).toEqual({ placed: 1, targets: [] });
      });
    });
  });
});
