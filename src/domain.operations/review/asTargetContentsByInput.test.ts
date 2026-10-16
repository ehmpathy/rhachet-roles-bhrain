import { given, then, when } from 'test-fns';

import { asTargetContentsByInput } from './asTargetContentsByInput';

describe('asTargetContentsByInput', () => {
  given('[case1] an edited file that is present on disk but empty', () => {
    when('[t0] the targets are split under push focus', () => {
      const byInput = asTargetContentsByInput({
        targets: [
          {
            path: 'src/empty.ts',
            content: '',
            diff: '@@ -1 +0,0 @@\n-gone\n',
            changeKind: 'edited',
          },
          {
            path: 'src/full.ts',
            content: 'const a = 1;\n',
            diff: '@@ -0,0 +1 @@\n+const a = 1;\n',
            changeKind: 'edited',
          },
        ],
        focus: 'push',
      });

      then(
        '🔴 the empty file keeps its targetFiles row, as its block is sent',
        () => {
          expect(byInput.targetFiles).toEqual([
            { path: 'src/empty.ts', content: '' },
            { path: 'src/full.ts', content: 'const a = 1;\n' },
          ]);
        },
      );
    });
  });

  given('[case2] a deleted file, whose content is null', () => {
    when('[t0] the targets are split under push focus', () => {
      const byInput = asTargetContentsByInput({
        targets: [
          {
            path: 'src/gone.ts',
            content: null,
            diff: '@@ -1 +0,0 @@\n-gone\n',
            changeKind: 'deleted',
          },
        ],
        focus: 'push',
      });

      then('it holds no targetFiles row', () => {
        expect(byInput.targetFiles).toEqual([]);
      });

      then('it is listed as a deletion with an empty body', () => {
        expect(byInput['targetDiffs.deletions']).toEqual([
          { path: 'src/gone.ts', content: '' },
        ]);
      });
    });
  });
});
