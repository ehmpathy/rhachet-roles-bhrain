import { getError, given, then, when } from 'test-fns';

import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';
import { asTargetContentsWithDiffs } from '@src/domain.operations/review/asTargetContentsWithDiffs';

const asDiff = (input: Partial<FileDiff> & { path: string }): FileDiff => ({
  changeKind: 'edited',
  diff: `@@ diff for ${input.path} @@`,
  ...input,
});

describe('asTargetContentsWithDiffs', () => {
  given('[case1] a corpus sorted by cache stability', () => {
    // 🔴 the order is lever C's whole mechanism — the stable head of the target list
    //    must stay byte-identical round over round, so a repaired file sorts LAST
    const targets = ['stable/a.ts', 'stable/b.ts', 'repaired/z.ts'];

    when('[t0] the join runs', () => {
      const joined = asTargetContentsWithDiffs({
        targets,
        bodiesByPath: new Map([
          ['stable/a.ts', 'body a'],
          ['stable/b.ts', 'body b'],
          ['repaired/z.ts', 'body z'],
        ]),
        changeKindByPath: new Map(),
      });

      then('🔴 it preserves the ORDER ASKED, exactly', () => {
        // a reorder here would void the cache-stability sort at the last step
        // before the prompt, which is the whole of lever C
        expect(joined.map((one) => one.path)).toEqual(targets);
      });

      then('every target carries the body read for it', () => {
        expect(joined.map((one) => one.content)).toEqual([
          'body a',
          'body b',
          'body z',
        ]);
      });
    });
  });

  given('[case2] a DELETED target', () => {
    const deleted = asDiff({
      path: 'gone/removed.ts',
      changeKind: 'deleted',
      diff: '@@ -1,3 +0,0 @@',
    });

    when('[t0] the join runs, with NO body read for it', () => {
      const joined = asTargetContentsWithDiffs({
        targets: ['gone/removed.ts'],
        bodiesByPath: new Map(),
        changeKindByPath: new Map([['gone/removed.ts', deleted]]),
      });

      then('🔴 its content is NULL, never an empty string', () => {
        // `getOneTargetRenderPlan` answers `sendsFile: false` on the null, so the
        // target renders as a lone void tag. an empty string would render an empty
        // body tag and claim a read that never happened
        expect(joined[0]!.content).toEqual(null);
        expect(joined[0]!.content).not.toEqual('');
      });

      then('it still carries its diff and its changeKind', () => {
        expect(joined[0]!.diff).toEqual('@@ -1,3 +0,0 @@');
        expect(joined[0]!.changeKind).toEqual('deleted');
      });

      then('🔴 it does NOT throw for the absent body', () => {
        // the file is gone, so an absent read is the expected state here — the
        // throw below is for a target that should have been read and was not
        expect(joined).toHaveLength(1);
      });
    });
  });

  given('[case3] a changed target and a path-only target, side by side', () => {
    when('[t0] the join runs', () => {
      const joined = asTargetContentsWithDiffs({
        targets: ['changed/edited.ts', 'untouched/plain.ts'],
        bodiesByPath: new Map([
          ['changed/edited.ts', 'new body'],
          ['untouched/plain.ts', 'plain body'],
        ]),
        changeKindByPath: new Map([
          ['changed/edited.ts', asDiff({ path: 'changed/edited.ts' })],
        ]),
      });

      then('the changed one carries body AND diff', () => {
        expect(joined[0]).toMatchObject({
          path: 'changed/edited.ts',
          content: 'new body',
          diff: '@@ diff for changed/edited.ts @@',
          changeKind: 'edited',
        });
      });

      then('the path-only one carries a body and no diff', () => {
        // a target in scope by glob rather than by diff has no entry in the diff
        // map at all, and that is not an error
        expect(joined[1]).toMatchObject({
          path: 'untouched/plain.ts',
          content: 'plain body',
          diff: undefined,
          changeKind: undefined,
        });
      });
    });
  });

  given('[case4] a NON-deleted target whose body was never read', () => {
    when('[t0] the join runs', () => {
      then('🔴 it THROWS rather than sends an empty body', async () => {
        // every extant target was just read by `getAllFileContentsByGroup`, so a
        // miss means the read set and the join set disagree — a defect in the
        // caller's own plumbwork. to default it to '' would send an empty body for
        // a file that has content, and the prompt would look well-formed while it
        // reviewed naught (rule.forbid.failhide)
        const error = await getError(async () =>
          asTargetContentsWithDiffs({
            targets: ['read/missed.ts'],
            bodiesByPath: new Map(),
            changeKindByPath: new Map([
              ['read/missed.ts', asDiff({ path: 'read/missed.ts' })],
            ]),
          }),
        );

        expect(error.message).toContain('a read target has no content');
      });

      then(
        'the error names the path, so the disagreement is traceable',
        async () => {
          const error = await getError(async () =>
            asTargetContentsWithDiffs({
              targets: ['read/missed.ts'],
              bodiesByPath: new Map(),
              changeKindByPath: new Map(),
            }),
          );

          expect(error.message).toContain('read/missed.ts');
        },
      );
    });
  });

  given('[case5] an empty corpus', () => {
    when('[t0] the join runs', () => {
      then('it answers an empty list rather than throws', () => {
        expect(
          asTargetContentsWithDiffs({
            targets: [],
            bodiesByPath: new Map(),
            changeKindByPath: new Map(),
          }),
        ).toEqual([]);
      });
    });
  });
});
