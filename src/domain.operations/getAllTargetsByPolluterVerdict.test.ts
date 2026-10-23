import { given, then, useThen, when } from 'test-fns';

import { getAllTargetsByPolluterVerdict } from './getAllTargetsByPolluterVerdict';

/**
 * .what = the polluter verdict over a corpus, and the COMPLEMENT it guarantees
 *
 * .why = 🔴 the reason this operation exists is an invariant its two inline
 *        predecessors could not hold: `kept` and `dropped` must PARTITION the corpus.
 *        as two `filter`s in an orchestrator, one could have drifted from the other's
 *        negation and left a target in neither half or in both — a silent scope
 *        change, since a review renders only `kept` and reports only `dropped`.
 *
 *        ⇒ so `[t1]` carries the weight here, and it is stated as set algebra rather
 *        than as a pair of expected lists: a list pins one corpus, where the partition
 *        is what must hold over every corpus.
 *
 * .note = `isTargetPolluter` owns which paths ARE polluters, and its own suite grades
 *         that. this grades what the verdict DOES with them, so the fixtures reach for
 *         the two shapes that suite already settles — a `.dream/` path and a plain
 *         `src/` one — rather than re-litigate the membership rule.
 */
describe('getAllTargetsByPolluterVerdict', () => {
  const TARGET_OF_SRC = 'src/domain.operations/review/stepReview.ts';
  const TARGET_OF_DREAM = '.dream/v2026_09_25.fix.some-defect.md';
  const TARGET_OF_LOCK = 'pnpm-lock.yaml';

  given('[case1] a corpus that rode in with polluters, under mode=drop', () => {
    const CORPUS = [TARGET_OF_SRC, TARGET_OF_DREAM, TARGET_OF_LOCK];

    when('[t0] no glob names them', () => {
      const verdict = useThen('it parts the corpus', () =>
        getAllTargetsByPolluterVerdict({
          targets: CORPUS,
          globs: ['src/**/*.ts'],
          mode: 'drop',
        }),
      );

      then('the polluters are dropped', () => {
        expect(verdict.dropped).toContain(TARGET_OF_DREAM);
        expect(verdict.dropped).toContain(TARGET_OF_LOCK);
      });

      then('the real subject survives', () => {
        expect(verdict.kept).toEqual([TARGET_OF_SRC]);
      });

      then('🔴 [t1] kept and dropped PARTITION the corpus', () => {
        // 🔴 the invariant the two inline filters could not hold. stated as algebra
        //    so it binds over any corpus, never only this one:
        //    - every target is in exactly one half  (no loss, no duplication)
        //    - neither half invents a target        (no fabrication)
        const rejoined = [...verdict.kept, ...verdict.dropped].sort();
        expect(rejoined).toEqual([...CORPUS].sort());
        expect(
          verdict.kept.filter((target) => verdict.dropped.includes(target)),
        ).toEqual([]);
      });

      then('and the by-name exemption is empty, never absent', () => {
        // the debug artifact records this list; an absence would read as "unknown"
        expect(verdict.askedForByName).toEqual([]);
      });
    });

    when('[t2] a specific glob names a polluter as the subject', () => {
      const verdict = useThen('it parts the corpus', () =>
        getAllTargetsByPolluterVerdict({
          targets: CORPUS,
          globs: ['.dream/*.md'],
          mode: 'drop',
        }),
      );

      then('🔴 the named polluter is KEPT — it is the declared subject', () => {
        expect(verdict.kept).toContain(TARGET_OF_DREAM);
        expect(verdict.dropped).not.toContain(TARGET_OF_DREAM);
      });

      then(
        'and it is named in the exemption list, so the keep is legible',
        () => {
          expect(verdict.askedForByName).toContain(TARGET_OF_DREAM);
        },
      );

      then('the polluter no glob named is still dropped', () => {
        expect(verdict.dropped).toEqual([TARGET_OF_LOCK]);
      });

      then('🔴 the partition still holds', () => {
        const rejoined = [...verdict.kept, ...verdict.dropped].sort();
        expect(rejoined).toEqual([...CORPUS].sort());
      });
    });
  });

  given('[case2] the same corpus under mode=keep', () => {
    const CORPUS = [TARGET_OF_SRC, TARGET_OF_DREAM, TARGET_OF_LOCK];

    when('[t0] the caller opted the verdict out', () => {
      const verdict = useThen('it answers', () =>
        getAllTargetsByPolluterVerdict({
          targets: CORPUS,
          globs: ['src/**/*.ts'],
          mode: 'keep',
        }),
      );

      then('🔴 the corpus passes through WHOLE, order intact', () => {
        // order matters downstream: the corpus is sorted by cache stability after
        // this, and a reshuffle here would break the prefix the sort protects
        expect(verdict.kept).toEqual(CORPUS);
      });

      then('🔴 dropped is EMPTY, never nil', () => {
        // the caller reads `.length` to decide whether to speak at all
        expect(verdict.dropped).toEqual([]);
      });

      then(
        'and the exemption list is empty too — no drop to exempt from',
        () => {
          expect(verdict.askedForByName).toEqual([]);
        },
      );
    });
  });

  given('[case3] an empty corpus', () => {
    when('[t0] mode=drop', () => {
      const verdict = useThen('it answers', () =>
        getAllTargetsByPolluterVerdict({
          targets: [],
          globs: ['src/**/*.ts'],
          mode: 'drop',
        }),
      );

      then('every half is empty, and none is nil', () => {
        expect(verdict.kept).toEqual([]);
        expect(verdict.dropped).toEqual([]);
        expect(verdict.askedForByName).toEqual([]);
      });
    });
  });
});
