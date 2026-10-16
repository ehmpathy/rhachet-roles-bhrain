import { given, then, when } from 'test-fns';

import { genLogDirName } from '@src/domain.operations/review/genLogDirName';
import { isReviewRunDir } from '@src/domain.operations/review/isReviewRunDir';

/**
 * .what = unit tests for the discriminator that parts a RUN path from a TREE path
 * .why = it is PURE — a claim about a name, never about the disk — so the unit grain
 *        is the only one where both answers are cheap to exercise, and the only one
 *        where a name that cannot exist on this machine can still be asked about
 */
describe('isReviewRunDir', () => {
  given('[case1] a path whose LAST segment this repo minted', () => {
    when('[t0] the name comes from the mint itself', () => {
      then('it is a run', () => {
        // 🔴 the name is GENERATED, never typed. a literal here would test that the
        // predicate admits a string somebody once copied, and would stay green the
        // day `genLogDirName` changed its shape — which is the exact drift the
        // predicate exists to prevent (it lives beside the mint for that reason)
        expect(
          isReviewRunDir({ at: `/tmp/t/.log/a/${genLogDirName()}` }),
        ).toEqual(true);
      });
    });

    when('[t1] the path ends with a separator', () => {
      then('it reads the same, because a shell completion appends one', () => {
        const name = genLogDirName();
        expect(isReviewRunDir({ at: `/tmp/t/${name}/` })).toEqual(
          isReviewRunDir({ at: `/tmp/t/${name}` }),
        );
      });
    });

    when('[t2] the path is RELATIVE', () => {
      then(
        'it is still a run — the predicate reads the name, not the root',
        () => {
          expect(
            isReviewRunDir({ at: `.log/bhrain/review/${genLogDirName()}` }),
          ).toEqual(true);
        },
      );
    });

    when('[t3] the path is the BARE name, with no dirs above it', () => {
      then('it is still a run', () => {
        expect(isReviewRunDir({ at: genLogDirName() })).toEqual(true);
      });
    });
  });

  given('[case2] a path that names a tree', () => {
    when('[t0] the everyday shapes a human types for --at', () => {
      then(
        'each reads as a tree, so the extant --at behavior is unchanged',
        () => {
          for (const at of [
            '.',
            '..',
            '/home/camper/git/ehmpathy/rhachet-roles-bhrain',
            '../other-worktree',
            '~/git/some-repo',
          ])
            expect(isReviewRunDir({ at })).toEqual(false);
        },
      );
    });

    when('[t1] the path names the log ROOT rather than a run inside it', () => {
      then('it is a TREE-shaped answer, never a run', () => {
        // ⚠️ the near-miss worth a clamp: the root HOLDS runs and is not one. read
        // as a run it would be metered `refused` — a MEASURED $0 over a directory
        expect(isReviewRunDir({ at: '/tmp/t/.log/bhrain/review' })).toEqual(
          false,
        );
      });
    });
  });

  given('[case3] a path a human HAND made inside the log root', () => {
    when('[t0] the scratch names a driver actually leaves behind', () => {
      then('none is a run, so none can be metered as one', () => {
        // 🔴 these sort INSIDE the log root beside real runs, and `zzz-debug` sorts
        // LAST. admitted, it would be read as a run and graded `refused`, which
        // renders `$0` — a measured nil over a dir that was never a review
        // (rule.forbid.failhide). same grammar, same reason, as the `latest` read
        for (const name of [
          'zzz-debug',
          'old',
          'tmp',
          '.gitignore',
          'backup-2026',
        ])
          expect(
            isReviewRunDir({ at: `/tmp/t/.log/bhrain/review/${name}` }),
          ).toEqual(false);
      });
    });

    when('[t1] a name that ALMOST matches the mint', () => {
      then('a stamp with no dot after it is refused', () => {
        // the mint is `<stamp>.<pid>.<uuid>`, so the `.` after the stamp is part of
        // the grammar. a bare stamp carries no pid and no uuid, so it is not unique
        // per lane — and the whole reason the suffixes exist is that it collides
        expect(
          isReviewRunDir({ at: '/tmp/t/2026-09-23T16-00-00-000Z' }),
        ).toEqual(false);
      });

      then('a stamp with the wrong separators is refused', () => {
        // a raw iso string carries `:` and `.`, which are illegal in a dir name on
        // some platforms — `genLogDirName` replaces them, and a name that did not go
        // through the mint did not get that treatment
        expect(
          isReviewRunDir({ at: '/tmp/t/2026-09-23T16:00:00.000Z.pid1.abc' }),
        ).toEqual(false);
      });

      then('a stamp that leads with a word is refused', () => {
        // the anchor is `^`, so a prefix defeats the match — and it must, because a
        // lexical sort over `run-2026-…` beside `2026-…` is not chronological
        expect(
          isReviewRunDir({
            at: '/tmp/t/run-2026-09-23T16-00-00-000Z.pid1.abc',
          }),
        ).toEqual(false);
      });
    });
  });

  given('[case4] the empty path', () => {
    when('[t0] --at is read as an empty string', () => {
      then('it is a tree, so the caller falls through to its tree read', () => {
        expect(isReviewRunDir({ at: '' })).toEqual(false);
      });
    });
  });
});
