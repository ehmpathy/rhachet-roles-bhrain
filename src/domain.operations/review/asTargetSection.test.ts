import { given, then, when } from 'test-fns';

import { asTargetSection, type ReviewTarget } from './asTargetSection';

/**
 * .what = two added files and one edited file
 * .why = the kind groups part an edited body from the diffs; additions render as diffs
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

describe('asTargetSection', () => {
  given('[case1] one band of targets', () => {
    when('[t0] the section renders', () => {
      const section = asTargetSection({
        targets: TARGETS,
        focus: 'push',
        diffRange: null,
      });

      // the offset of a tag, guarded present, so an order check never passes over a -1
      const atPresent = (tag: string): number => {
        const at = section.indexOf(tag);
        expect(at).toBeGreaterThan(-1);
        return at;
      };

      then('every edited body leads every diff', () => {
        const body = atPresent(
          '<target.file path="src/contract/cli/learn.ts">',
        );
        expect(body).toBeLessThan(
          atPresent('<target.diff path=".behavior/v1/.fulcrums/case=F1.md"'),
        );
        expect(body).toBeLessThan(
          atPresent('<target.diff path=".behavior/v1/.seeds/case=S1.md"'),
        );
        expect(body).toBeLessThan(
          atPresent('<target.diff path="src/contract/cli/learn.ts" kind="~">'),
        );
      });

      then('the additions lead the mutation in the diff group', () => {
        const mutation = atPresent(
          '<target.diff path="src/contract/cli/learn.ts" kind="~">',
        );
        expect(
          atPresent('<target.diff path=".behavior/v1/.fulcrums/case=F1.md"'),
        ).toBeLessThan(mutation);
        expect(
          atPresent('<target.diff path=".behavior/v1/.seeds/case=S1.md"'),
        ).toBeLessThan(mutation);
      });

      then('the section bytes render as the reviewer reads them', () => {
        // the bands are snapped in `asTargetSectionsByBreadth`; this pins one band's own
        // bytes, so a change to the section render shows up at its own op
        expect(section).toMatchSnapshot();
      });
    });
  });
});
