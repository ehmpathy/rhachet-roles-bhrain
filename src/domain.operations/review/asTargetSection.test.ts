import { given, then, when } from 'test-fns';

import { asTargetSection, type ReviewTarget } from './asTargetSection';

/**
 * .what = the targets of one partition run: its OWN edited file, then the shared route
 *         files every partition carries, which this branch added
 * .why = the shape measured 2026-10-12 on `5.3.verification i004`, partition `14.cli` —
 *        the partition's own edited bodies rendered ahead of 1.07M chars of shared route
 *        additions, so the prefix the prime wrote ended at the first narrow byte
 */
const TARGETS: ReviewTarget[] = [
  {
    path: '.behavior/v1/.fulcrums/case=F1.md',
    content: 'fork one\n',
    diff: null,
    changeKind: 'new',
  },
  {
    path: '.behavior/v1/.seeds/case=S1.md',
    content: 'seed one\n',
    diff: null,
    changeKind: 'new',
  },
  {
    path: 'src/contract/cli/learn.ts',
    content: 'export const learn = 2;\n',
    diff: '@@ -1 +1 @@\n-export const learn = 1;\n+export const learn = 2;\n',
    changeKind: 'edited',
  },
];
const SHARED = [
  '.behavior/v1/.fulcrums/case=F1.md',
  '.behavior/v1/.seeds/case=S1.md',
];

describe('asTargetSection', () => {
  given('[case1] a partition run whose shared files are additions', () => {
    when('[t0] the section renders with the shared set', () => {
      const section = asTargetSection({
        targets: TARGETS,
        focus: 'push',
        shared: SHARED,
      });
      const at = (tag: string) => section.indexOf(tag);

      then('🔴 every shared block leads the partition own body', () => {
        const ownBody = at('<target.file path="src/contract/cli/learn.ts">');
        expect(ownBody).toBeGreaterThan(-1);
        for (const path of SHARED)
          expect(at(`<target.diff path="${path}" kind="+">`)).toBeLessThan(
            ownBody,
          );
      });

      then('the own band keeps its body ahead of its diff', () => {
        expect(
          at('<target.file path="src/contract/cli/learn.ts">'),
        ).toBeLessThan(
          at('<target.diff path="src/contract/cli/learn.ts" kind="~">'),
        );
      });

      then('the section matches its snapshot', () => {
        expect(section).toMatchSnapshot();
      });
    });

    when('[t1] two partitions render with the same shared set', () => {
      const other: ReviewTarget = {
        path: 'src/domain.operations/route/getRoute.ts',
        content: 'export const getRoute = 1;\n',
        diff: '@@ -0,0 +1 @@\n+export const getRoute = 1;\n',
        changeKind: 'edited',
      };
      const one = asTargetSection({
        targets: TARGETS,
        focus: 'push',
        shared: SHARED,
      });
      const two = asTargetSection({
        targets: [TARGETS[0]!, TARGETS[1]!, other],
        focus: 'push',
        shared: SHARED,
      });

      then('🔴 both open on the same shared bytes', () => {
        const sharedOfOne = one.slice(0, one.indexOf('<target.file'));
        expect(sharedOfOne.length).toBeGreaterThan(0);
        expect(two.startsWith(sharedOfOne)).toBe(true);
      });
    });
  });

  given('[case2] a whole run, with no shared set', () => {
    when('[t0] the section renders', () => {
      const section = asTargetSection({ targets: TARGETS, focus: 'push' });

      then('every edited body leads every diff, as one band', () => {
        expect(
          section.indexOf('<target.file path="src/contract/cli/learn.ts">'),
        ).toBeLessThan(
          section.indexOf(
            '<target.diff path=".behavior/v1/.fulcrums/case=F1.md"',
          ),
        );
      });
    });
  });
});
