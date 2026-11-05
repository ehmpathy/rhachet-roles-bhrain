import { given, then, when } from 'test-fns';

import type { ReviewTarget } from './asTargetSection';
import { asTargetSectionsByBreadth } from './asTargetSectionsByBreadth';

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

describe('asTargetSectionsByBreadth', () => {
  given('[case1] a partition run whose shared files are additions', () => {
    when('[t0] the sections render with the shared set', () => {
      const sections = asTargetSectionsByBreadth({
        targets: TARGETS,
        focus: 'push',
        diffRange: null,
        shared: SHARED,
      });

      then(
        '🔴 every shared block rides the shared band, and no own block does',
        () => {
          for (const path of SHARED)
            expect(sections.shared).toContain(
              `<target.diff path="${path}" kind="+">`,
            );
          expect(sections.shared).not.toContain('src/contract/cli/learn.ts');
        },
      );

      then('the own band keeps its body ahead of its diff', () => {
        const narrow = sections.narrow ?? '';
        expect(
          narrow.indexOf('<target.file path="src/contract/cli/learn.ts">'),
        ).toBeGreaterThan(-1);
        expect(
          narrow.indexOf('<target.file path="src/contract/cli/learn.ts">'),
        ).toBeLessThan(
          narrow.indexOf(
            '<target.diff path="src/contract/cli/learn.ts" kind="~">',
          ),
        );
      });

      then('the sections match their snapshot', () => {
        expect(sections).toMatchSnapshot();
      });
    });

    when('[t1] two partitions render with the same shared set', () => {
      const other: ReviewTarget = {
        path: 'src/domain.operations/route/getRoute.ts',
        content: 'export const getRoute = 1;\n',
        diff: '@@ -0,0 +1 @@\n+export const getRoute = 1;\n',
        changeKind: 'edited',
      };
      const one = asTargetSectionsByBreadth({
        targets: TARGETS,
        focus: 'push',
        diffRange: null,
        shared: SHARED,
      });
      const two = asTargetSectionsByBreadth({
        targets: [TARGETS[0]!, TARGETS[1]!, other],
        focus: 'push',
        diffRange: null,
        shared: SHARED,
      });

      then('🔴 both carry byte-identical shared bands', () => {
        expect(one.shared.length).toBeGreaterThan(0);
        expect(two.shared).toEqual(one.shared);
      });

      then('their own bands differ', () => {
        expect(two.narrow).not.toEqual(one.narrow);
      });
    });
  });

  given('[case2] a whole run, with no shared set', () => {
    when('[t0] the sections render', () => {
      const sections = asTargetSectionsByBreadth({
        targets: TARGETS,
        focus: 'push',
        diffRange: null,
        shared: null,
      });

      then(
        'every target rides the shared band, and there is no own band',
        () => {
          expect(sections.narrow).toBeNull();
          expect(sections.shared).toContain('src/contract/cli/learn.ts');
          expect(sections.shared).toContain('.behavior/v1/.seeds/case=S1.md');
        },
      );
    });
  });

  given('[case3] a partition whose every target is shared', () => {
    when('[t0] the sections render', () => {
      const sections = asTargetSectionsByBreadth({
        targets: [TARGETS[0]!, TARGETS[1]!],
        focus: 'push',
        diffRange: null,
        shared: SHARED,
      });

      then('there is no own band', () => {
        expect(sections.narrow).toBeNull();
      });
    });
  });

  given('[case4] a partition run in pull focus', () => {
    when('[t0] the sections render with the shared set', () => {
      const sections = asTargetSectionsByBreadth({
        targets: TARGETS,
        focus: 'pull',
        diffRange: 'origin/main',
        shared: SHARED,
      });

      then('🔴 the shared paths ride the head, and only those', () => {
        // the partitions of one lane send the same head, so their rubric — which
        // trails it — stays a shared prefix too
        expect(sections.shared).toContain('- .behavior/v1/.seeds/case=S1.md');
        expect(sections.shared).not.toContain('src/contract/cli/learn.ts');
      });

      then("the partition's own paths ride the tail band", () => {
        expect(sections.narrow).toContain('- src/contract/cli/learn.ts');
        expect(sections.narrow).not.toContain('.behavior/v1/.seeds/case=S1.md');
      });

      then('each band names the diff range the brain runs against', () => {
        expect(sections.shared).toContain('`origin/main`');
        expect(sections.narrow).toContain('`origin/main`');
      });
    });

    when('[t1] two partitions with the same shared set render', () => {
      const one = asTargetSectionsByBreadth({
        targets: TARGETS,
        focus: 'pull',
        diffRange: 'origin/main',
        shared: SHARED,
      });
      const two = asTargetSectionsByBreadth({
        targets: [
          TARGETS[0]!,
          TARGETS[1]!,
          {
            path: 'src/contract/cli/other.ts',
            content: 'x',
            diff: null,
            changeKind: 'new',
          },
        ],
        focus: 'pull',
        diffRange: 'origin/main',
        shared: SHARED,
      });

      then('🔴 their head bands are byte-identical', () => {
        expect(two.shared).toEqual(one.shared);
      });
    });
  });
});
