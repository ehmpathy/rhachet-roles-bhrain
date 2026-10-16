import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getOneReviewPartitionSplitVerdict } from './getOneReviewPartitionSplitVerdict';

/**
 * .what = the split verdict — no declaration, a split that holds, a split that cannot
 * .why = the derivation fuses the split, its costs, its refusal, and its warn lines into
 *        the one object `emitReviewPartitionSplitVerdict` acts on. the emit is pinned end
 *        to end; this pins the pure composition and its `null` branch at their own grain
 */
describe('getOneReviewPartitionSplitVerdict', () => {
  const targetContents = [
    { path: 'src/a/one.ts', content: 'export const one = 1;\n' },
    { path: 'src/b/two.ts', content: 'export const two = 2;\n' },
  ];
  const headContents = [{ path: 'rules/rule.md', content: '# a rule\n' }];

  given('[case1] no partition is declared', () => {
    when('[t0] the verdict is derived', () => {
      const verdict = getOneReviewPartitionSplitVerdict({
        partitions: [],
        targets: targetContents.map((file) => file.path),
        route: null,
        repairVia: null,
        targetContents,
        headContents,
        contextWindowTokens: 100_000,
      });

      then('it is null — there is no split to judge', () => {
        expect(verdict).toBeNull();
      });
    });
  });

  given('[case2] two partitions claim every target and fit the window', () => {
    when('[t0] the verdict is derived', () => {
      const verdict = getOneReviewPartitionSplitVerdict({
        partitions: asReviewPartitionsFromFlags({
          partition: ['a=src/a/**', 'b=src/b/**'],
        }),
        targets: targetContents.map((file) => file.path),
        route: null,
        repairVia: null,
        targetContents,
        headContents,
        contextWindowTokens: 100_000,
      });

      then('the split holds both partitions, in declared order', () => {
        expect(verdict?.split.partitions.map((one) => one.name)).toEqual([
          'a',
          'b',
        ]);
      });

      then('each partition is priced', () => {
        expect(verdict?.costs.partitions).toHaveLength(2);
      });

      then('no refusal is raised', () => {
        expect(verdict?.refusal).toBeNull();
      });
    });
  });

  given('[case3] a target sits in no declared partition', () => {
    when('[t0] the verdict is derived', () => {
      const verdict = getOneReviewPartitionSplitVerdict({
        partitions: asReviewPartitionsFromFlags({ partition: ['a=src/a/**'] }),
        targets: targetContents.map((file) => file.path),
        route: null,
        repairVia: null,
        targetContents,
        headContents,
        contextWindowTokens: 100_000,
      });

      then('the refusal names the unclaimed target', () => {
        expect(verdict?.refusal?.headline).toMatchSnapshot();
        expect(verdict?.refusal?.lines.join('\n')).toContain('src/b');
      });
    });
  });
});
