import { given, then, when } from 'test-fns';

import { getAllTargetsExtant } from '@src/domain.operations/review/getAllTargetsExtant';

describe('getAllTargetsExtant', () => {
  given('[case1] a corpus with one deleted target', () => {
    const targets = ['src/a.ts', 'src/gone.ts', 'src/b.ts'];
    const changeKindByPath = new Map([
      ['src/a.ts', { changeKind: 'modified' }],
      ['src/gone.ts', { changeKind: 'deleted' }],
      ['src/b.ts', { changeKind: 'new' }],
    ]);

    when('[t0] the read set is derived', () => {
      const extant = getAllTargetsExtant({ targets, changeKindByPath });

      then('the deleted target is held out', () => {
        expect(extant).toEqual(['src/a.ts', 'src/b.ts']);
      });

      then('a new target is KEPT — only `deleted` is refuted', () => {
        expect(extant).toContain('src/b.ts');
      });
    });
  });

  given('[case2] a target the diff map never mentioned', () => {
    // a target enumerated by `--paths` alone has no diff entry, and is plainly on disk
    const targets = ['src/only-by-path.ts'];
    const changeKindByPath = new Map<string, { changeKind: string }>();

    when('[t0] the read set is derived', () => {
      const extant = getAllTargetsExtant({ targets, changeKindByPath });

      then('it is KEPT — the check refutes on a KNOWN deletion only', () => {
        // 🔴 the inverse would drop every `--paths`-only target from the prompt
        expect(extant).toEqual(['src/only-by-path.ts']);
      });
    });
  });

  given('[case3] every target deleted', () => {
    when('[t0] the read set is derived', () => {
      const extant = getAllTargetsExtant({
        targets: ['src/a.ts', 'src/b.ts'],
        changeKindByPath: new Map([
          ['src/a.ts', { changeKind: 'deleted' }],
          ['src/b.ts', { changeKind: 'deleted' }],
        ]),
      });

      then('the read set is empty, and no read is attempted', () => {
        expect(extant).toEqual([]);
      });
    });
  });
});
