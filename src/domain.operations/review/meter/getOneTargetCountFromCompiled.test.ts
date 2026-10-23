import { given, then, when } from 'test-fns';

import { getOnePromptComposition } from '@src/domain.operations/review/getOnePromptComposition';
import { SECTION_OF_INPUT } from '@src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled';
import {
  getOneTargetCountFromCompiled,
  IS_TARGET_COUNT_INPUT,
} from '@src/domain.operations/review/meter/getOneTargetCountFromCompiled';

describe('getOneTargetCountFromCompiled', () => {
  given('[case1] the declared set, for the TARGET COUNT fold', () => {
    when('[t0] the count map is read', () => {
      then('🔴 every declared input states whether it carries a target', () => {
        // the same union the section fold is clamped against, so a tenth input
        // must name its verdict in BOTH maps or go red in one of them
        expect(Object.keys(IS_TARGET_COUNT_INPUT).sort()).toEqual(
          Object.keys(SECTION_OF_INPUT).sort(),
        );
      });

      then('only the rows whose block IS a target say so', () => {
        // an addition and a deletion carry no file block, so each counts its own
        // target. `targetDiffs.mutations` is deliberately false: a mutation rides
        // an edited target its `targetFiles` row already counts, so a second
        // count there reports one target twice
        const carries = Object.entries(IS_TARGET_COUNT_INPUT)
          .filter(([, yes]) => yes)
          .map(([name]) => name)
          .sort();
        expect(carries).toEqual([
          'targetDiffs.additions',
          'targetDiffs.deletions',
          'targetFiles',
          'targetPaths',
        ]);
      });
    });
  });

  given('[case2] one corpus, metered at BOTH foci', () => {
    /**
     * proof the clamp bites, per `rule.require.clamp-edge-cases`.
     *
     * the defect this catches shipped: the meter read `targetFiles.count`
     * alone, which is `0` by construction under `--focus pull` — where the
     * renderer sends a path list and no payload, so the real figure sits in
     * `targetPaths.count`.
     *
     * measured under the un-fixed read: `push` → 3, `pull` → 0. so a driver
     * who ran a pull review and priced it saw `N chars over 0 targets`, and
     * every pull run fell out of the grove-wide `N target files` census in
     * silence.
     *
     * .note = the two foci meter the same three targets, so the count must
     *         agree across them. that agreement is the whole assertion — a
     *         figure that moves with the render route is not a count of
     *         targets.
     */
    const asCompiledAt = (focus: 'push' | 'pull') => {
      const composition = getOnePromptComposition({
        focus,
        rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
        refs: [],
        conversation: [],
        targets: [
          { path: 'x.ts', content: 'X'.repeat(400), diff: 'D'.repeat(60) },
          { path: 'y.ts', content: 'Y'.repeat(200), diff: 'E'.repeat(40) },
          { path: 'z.ts', content: 'Z'.repeat(100), diff: 'F'.repeat(20) },
        ],
        promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(300)}`,
        promptTailVariable:
          focus === 'push'
            ? `tail${'D'.repeat(60)}${'E'.repeat(40)}${'F'.repeat(20)}${'X'.repeat(400)}${'Y'.repeat(200)}${'Z'.repeat(100)}`
            : 'tailx.tsy.tsz.ts',
      });
      return { rows: composition.inputs };
    };

    when('[t0] the target count is folded at each focus', () => {
      const atPush = asCompiledAt('push');
      const atPull = asCompiledAt('pull');

      then('🔴 a pull render counts its targets, never zero', () => {
        // the assertion that goes red under the un-fixed read
        expect(getOneTargetCountFromCompiled(atPull)).toEqual(3);
      });

      then('a push render counts the same three', () => {
        expect(getOneTargetCountFromCompiled(atPush)).toEqual(3);
      });

      then('🔴 the figure does not move with the render route', () => {
        expect(getOneTargetCountFromCompiled(atPull)).toEqual(
          getOneTargetCountFromCompiled(atPush),
        );
      });

      then('the two source rows are disjoint, so no sum double-counts', () => {
        // the premise the fold rests on: exactly one of the two carries the corpus
        expect(atPush.rows.targetPaths.count).toEqual(0);
        expect(atPull.rows.targetFiles.count).toEqual(0);
      });
    });
  });
});
