import { given, then, when } from 'test-fns';

import { getAllTargetsJoined } from '@src/domain.operations/review/getAllTargetsJoined';

describe('getAllTargetsJoined', () => {
  given('[case1] only `--diffs` was requested', () => {
    when(
      '[t0] the paths source is empty because it was never asked for',
      () => {
        then('the diff set stands, whole', () => {
          expect(
            getAllTargetsJoined({
              fromDiffs: ['a.ts', 'b.ts'],
              fromPaths: [],
              diffsRequested: true,
              pathsRequested: false,
              join: 'intersect',
            }),
          ).toEqual(['a.ts', 'b.ts']);
        });
      },
    );
  });

  given('[case2] only `--paths` was requested', () => {
    when('[t0] the diff source is empty because it was never asked for', () => {
      then('the path set stands, whole', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: [],
            fromPaths: ['a.ts'],
            diffsRequested: false,
            pathsRequested: true,
            join: 'intersect',
          }),
        ).toEqual(['a.ts']);
      });
    });
  });

  given('[case3] 🔴 BOTH were requested, and `--paths` matched no file', () => {
    /**
     * 🔴 the case the whole extraction exists for, and the one a reader gets
     * backwards. `fromPaths: []` here is byte-identical to `[case1]`'s — and it
     * must produce the OPPOSITE answer.
     *
     * in `[case1]` the caller never asked for paths, so the diff set is the whole
     * corpus. here the caller asked to intersect WITH a glob, and that glob
     * matched no file — so the corpus is empty, and the review has no subject.
     *
     * ⚠️ to fold the two together would review the entire diff under a glob the
     * caller wrote to narrow it, in silence (rule.forbid.failhide).
     */
    when('[t0] the join is an intersect', () => {
      then('the corpus is EMPTY, never the whole diff', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: ['a.ts', 'b.ts'],
            fromPaths: [],
            diffsRequested: true,
            pathsRequested: true,
            join: 'intersect',
          }),
        ).toEqual([]);
      });
    });

    when('[t1] the join is a union', () => {
      then('the diff set stands — a union adds, it does not narrow', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: ['a.ts', 'b.ts'],
            fromPaths: [],
            diffsRequested: true,
            pathsRequested: true,
            join: 'union',
          }),
        ).toEqual(['a.ts', 'b.ts']);
      });
    });
  });

  given('[case4] both were requested and both matched', () => {
    when('[t0] the join is an intersect', () => {
      then('only the files BOTH sources named survive', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: ['a.ts', 'b.ts', 'c.ts'],
            fromPaths: ['b.ts', 'c.ts', 'd.ts'],
            diffsRequested: true,
            pathsRequested: true,
            join: 'intersect',
          }),
        ).toEqual(['b.ts', 'c.ts']);
      });

      then('the DIFF order is the one preserved', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: ['c.ts', 'a.ts'],
            fromPaths: ['a.ts', 'c.ts'],
            diffsRequested: true,
            pathsRequested: true,
            join: 'intersect',
          }),
        ).toEqual(['c.ts', 'a.ts']);
      });
    });

    when('[t1] the join is a union', () => {
      then('every file either source named appears exactly once', () => {
        expect(
          getAllTargetsJoined({
            fromDiffs: ['a.ts', 'b.ts'],
            fromPaths: ['b.ts', 'c.ts'],
            diffsRequested: true,
            pathsRequested: true,
            join: 'union',
          }),
        ).toEqual(['a.ts', 'b.ts', 'c.ts']);
      });

      then('🟡 a source that repeats a file is deduped too', () => {
        // 🟡 the one behavior the extraction CHANGED, and it changed it toward
        // safety: the inline form short-circuited an empty diff set straight to
        // `fromPaths`, undeduped. a target listed twice is compiled into the
        // prompt twice, and the census then counts its bytes twice — so a dedupe
        // that always runs is strictly the safer shape
        expect(
          getAllTargetsJoined({
            fromDiffs: [],
            fromPaths: ['a.ts', 'a.ts', 'b.ts'],
            diffsRequested: true,
            pathsRequested: true,
            join: 'union',
          }),
        ).toEqual(['a.ts', 'b.ts']);
      });
    });
  });
});
