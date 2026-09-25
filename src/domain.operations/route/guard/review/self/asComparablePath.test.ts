import { given, then, when } from 'test-fns';

import { asComparablePath } from './asComparablePath';

describe('asComparablePath', () => {
  const owed =
    '.behavior/v2026_03_08.feature/review/self/for.1.vision._.all-done.md';

  given('[case1] a path the driver typed with a `./` at the head', () => {
    when('[t0] both operands are cast', () => {
      /**
       * .why = the driver types `--into` by hand; the guard computes its own. a `./` at the
       *        head is a difference in how the path is written, never in where it points —
       *        and a mismatch verdict on it would refuse a promise whose file is correct.
       */
      then('compares equal to the computed path', () => {
        expect(asComparablePath(`./${owed}`)).toEqual(asComparablePath(owed));
      });
    });
  });

  given('[case2] a path with a slash at the end', () => {
    when('[t0] both operands are cast', () => {
      /**
       * .why = the arm with no caller reach today, and the one a test is therefore owed for:
       *        every other written form is exercised through
       *        `getSelfReviewChallengeDecision`, so this is the only place the cut is
       *        falsifiable.
       */
      then('compares equal to the same path with none', () => {
        expect(asComparablePath('review/self/')).toEqual(
          asComparablePath('review/self'),
        );
      });

      then('a run of slashes is cut whole', () => {
        expect(asComparablePath('review/self///')).toEqual('review/self');
      });
    });
  });

  given('[case3] two paths that point at different files', () => {
    when('[t0] both operands are cast', () => {
      /**
       * 🔴 .why = the cut must not make two real destinations compare equal. a looser rule —
       *           strip every slash, or lowercase the value — would pass `[case1]` and
       *           `[case2]` while it hid a genuine mismatch, which is the verdict this
       *           operation exists to let the guard render.
       */
      then('they stay different', () => {
        expect(asComparablePath('review/self/for.1.vision._.a.md')).not.toEqual(
          asComparablePath('review/self/for.1.vision._.b.md'),
        );
      });

      then('a `./` at the head does not erase a real difference', () => {
        expect(asComparablePath('./review/self/a.md')).not.toEqual(
          asComparablePath('./review/self/b.md'),
        );
      });
    });
  });

  given('[case4] a path that is already in comparable form', () => {
    when('[t0] the cast is applied', () => {
      /**
       * .why = the guard casts its OWN computed path too, so a cast that altered a canonical
       *        path would make the two operands disagree on every call.
       */
      then('the value is unchanged', () => {
        expect(asComparablePath(owed)).toEqual(owed);
      });

      then('the cast is idempotent', () => {
        expect(asComparablePath(asComparablePath(`./${owed}/`))).toEqual(
          asComparablePath(`./${owed}/`),
        );
      });
    });
  });

  /**
   * 🔴 .why = the three variances the two regexes did NOT catch, found by two independent
   *           lanes in one round (i009 r010 + r011). each names the owed file, and each
   *           rendered a `challenge:mismatch` whose diff showed two paths a reader cannot
   *           tell apart — a refusal of correct work, which is the one outcome this cast
   *           exists to prevent.
   * .note = asserted against `owed` rather than against a literal, so the clamp binds the
   *         written form to the SAME destination the guard computes. a literal would pin what
   *         the cast says and stay green if the cast and the computed path stopped to agree.
   */
  given('[case5] a path written with interior variance', () => {
    when('[t0] both operands are cast', () => {
      then('a doubled interior slash compares equal', () => {
        expect(asComparablePath(owed.replace('/self/', '/self//'))).toEqual(
          asComparablePath(owed),
        );
      });

      then('a `..` segment that returns to the owed dir compares equal', () => {
        expect(
          asComparablePath(owed.replace('/self/', '/self/../self/')),
        ).toEqual(asComparablePath(owed));
      });

      then('a `.` segment compares equal', () => {
        expect(asComparablePath(owed.replace('/self/', '/self/./'))).toEqual(
          asComparablePath(owed),
        );
      });

      /**
       * 🔴 .why = the cut must still refuse a `..` that lands somewhere else. a rule that
       *           merely deleted dot segments would pass every case above while it made two
       *           real destinations compare equal, which is the mismatch verdict's whole job.
       */
      then('a `..` that lands elsewhere stays different', () => {
        expect(asComparablePath('review/self/../peer/a.md')).not.toEqual(
          asComparablePath('review/self/a.md'),
        );
      });
    });
  });

  /**
   * 🔴 .why = `route` is NOT always route-relative. `getSelfReviewArticulationPath` joins
   *           whatever `--route` holds, and every route dir a test builds is an absolute
   *           tmpdir path. so the driver's `./` prefix lands on an absolute remainder, and
   *           `.//abs/path` is read by posix as the RELATIVE `abs/path` — the slash at the
   *           head is dropped, the two operands disagree, and the owed file renders
   *           `challenge:mismatch`.
   * 🔴 .what it clamps = the ORDER, never the output. the strip must run BEFORE the posix
   *           cast. `[case1]` cannot see the difference — its base is relative, so it is
   *           green under either order — which is why this case is owed beside it.
   * .note = measured 2026-09-20: folded into the posix call, this goes red, and so does
   *         `getSelfReviewChallengeDecision [case3][t1]`.
   */
  given('[case6] a `./` typed at the head of an ABSOLUTE path', () => {
    const owedAbsolute = `/tmp/route-abcd/${owed}`;

    when('[t0] both operands are cast', () => {
      then('the slash at the head survives, so it compares equal', () => {
        expect(asComparablePath(`./${owedAbsolute}`)).toEqual(
          asComparablePath(owedAbsolute),
        );
      });

      then('the cast of an absolute path alters it not at all', () => {
        expect(asComparablePath(owedAbsolute)).toEqual(owedAbsolute);
      });
    });
  });
});
