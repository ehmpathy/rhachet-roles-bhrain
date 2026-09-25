import { given, then, when } from 'test-fns';

import { getStrayFlagRefusal } from './getStrayFlagRefusal';

/**
 * .what = unit coverage for the flag-ownership table
 * .why = it is a pure table lookup, and until i014 its ONLY coverage was
 *        `stepRouteStoneSet.test.ts [case6b]`, which builds a temp route, a stone, a guard, and
 *        a full context to exercise it. `rule.require.test-coverage-by-grain` asks a pure
 *        transformer for a unit test with none of that — this is it.
 *
 * 🟡 .note = `[case6b]` is KEPT, never replaced. it proves the orchestrator still THROWS, which
 *            is a different claim from "the table computes the right refusal". the two grains
 *            answer two questions, and the extraction is what let each ask its own.
 */
describe('getStrayFlagRefusal', () => {
  given('[case1] a verb that owns the flag it was passed', () => {
    when('[t0] --that on --as promised', () => {
      then('returns null — the common case is silent', () => {
        expect(
          getStrayFlagRefusal({ as: 'promised', flags: { that: 'all-done' } }),
        ).toEqual(null);
      });
    });

    when('[t1] --into on --as promised', () => {
      then('returns null', () => {
        expect(
          getStrayFlagRefusal({ as: 'promised', flags: { into: 'a/path.md' } }),
        ).toEqual(null);
      });
    });

    when('[t2] every absorption flag on --as conceded', () => {
      then('returns null', () => {
        expect(
          getStrayFlagRefusal({
            as: 'conceded',
            flags: {
              with: 'arch',
              about: 'blocker.1',
              why: 'f.md',
              severity: 'better',
            },
          }),
        ).toEqual(null);
      });
    });

    when('[t3] no flags at all, on a verb that takes none', () => {
      then('returns null — an absent flag is never a stray one', () => {
        expect(getStrayFlagRefusal({ as: 'passed', flags: {} })).toEqual(null);
      });
    });
  });

  given('[case2] a verb that does NOT own the flag it was passed', () => {
    when('[t0] --into on --as passed', () => {
      const refusal = getStrayFlagRefusal({
        as: 'passed',
        flags: { into: 'a/path.md' },
      });

      then('it names the flag', () => {
        expect(refusal?.flag).toEqual('--into');
      });

      then('the message names the verbs that DO own it', () => {
        expect(refusal?.message).toContain(
          '--into is only accepted for --as promised',
        );
      });

      then('the message names the verb the driver actually typed', () => {
        // .why = "only accepted for X" alone leaves the driver to recall what they typed.
        //        the echo is what makes a mistyped verb visible without a scrollback
        expect(refusal?.message).toContain('you passed --as passed');
      });

      then('the message hands back a RUNNABLE command', () => {
        // .why = rule.require.errors-name-the-fix — a refusal that names no fix has done
        //        half its job. and the taught command carries --that, which --as promised
        //        also requires, so the hint is not itself refused at the boundary (r9 b1)
        expect(refusal?.message).toContain(
          '--as promised --that <slug> --into <path-you-wrote-to>',
        );
      });
    });

    /**
     * 🔴 .what = the LAYER boundary, which this case has asserted since i014 and mis-titled
     *            until i018.
     *
     * 🔴 .why = `--as disputed --severity` IS refused — one layer down, by
     *           `setStoneAsConcernAbsorbed`, with copy that states the domain rule:
     *           *"a severity grades a CONCESSION's harm — a dispute concedes naught, so it has
     *           none."* this table is not that layer. it asks the FAMILY question — *"is this
     *           flag in the verb's family at all?"* — and for `disputed` the honest answer is
     *           yes. ⇒ `null` is correct, and the old title *"it is refused"* named the
     *           SYSTEM's answer while the assertion named this OPERATION's.
     *
     * 🔴 .note = `repo-rules` nitpick.1 at i018 read that gap as drift and asked for
     *            `allowedFor: ['conceded']`. it was tried, and it made the experience WORSE:
     *            the table runs first, so its generic family refusal shadowed the deeper
     *            operation's better copy. `driver.route.absorption.acceptance.test.ts [case5]`
     *            went red on both its message assertion and its snapshot, and the narrow row
     *            was reverted.
     *
     * ⚠️ .note = so the TITLE is corrected rather than the assertion. a case whose title and
     *            assertion disagree is worse than an absent one — it counts as coverage in a
     *            grep, it goes green forever, and the sentence a future reader trusts is the
     *            title.
     *
     * .note = the deep refusal's own coverage is `driver.route.absorption.acceptance.test.ts`
     *         `[case5] --as disputed WITH a --severity`, which pins its whole message.
     */
    when('[t1] --severity on --as disputed', () => {
      then('is in the FAMILY, so THIS table is silent about it', () => {
        expect(
          getStrayFlagRefusal({
            as: 'disputed',
            flags: { severity: 'better' },
          }),
        ).toEqual(null);
      });
    });
  });

  /**
   * 🔴 .what = the case that tests the TABLE rather than an instance.
   *
   * 🔴 .why = `--as absorbed` owns `--that` and does NOT own `--into`. a special-case `if`
   *           for `--into` — the shape that shipped three times and forgot the fourth flag —
   *           passes a verb that legitimately takes one flag and not the other only by
   *           accident. this case is the one that goes red if the table degrades back into a
   *           chain of per-flag checks.
   */
  given('[case3] one verb that owns SOME of the flags passed', () => {
    when('[t0] --as absorbed --that X --into Y', () => {
      const refusal = getStrayFlagRefusal({
        as: 'absorbed',
        flags: { that: 'arch', into: 'a/path.md' },
      });

      then('the OWNED flag is not what is refused', () => {
        expect(refusal?.flag).not.toEqual('--that');
      });

      then('the UNOWNED flag is', () => {
        expect(refusal?.flag).toEqual('--into');
      });
    });
  });

  /**
   * 🔴 .why = the property that makes the table worth its shape: a flag ABSENT from it is
   *           refused everywhere, so a new flag must opt in to ACCEPTANCE rather than to
   *           validation. this clamps the default rather than any one flag's row.
   */
  given('[case4] the default for a flag nobody listed', () => {
    when('[t0] a verb is handed a flag the table does not know', () => {
      then(
        'the table refuses only what it lists — an unlisted key is inert',
        () => {
          // .note = an unknown KEY cannot reach this operation: the input type names the six
          //         flags, so a seventh is a compile error rather than a silent pass. that is
          //         the opt-in-to-acceptance property, enforced by the type rather than a check
          expect(
            getStrayFlagRefusal({
              as: 'passed',
              flags: {} as Parameters<typeof getStrayFlagRefusal>[0]['flags'],
            }),
          ).toEqual(null);
        },
      );
    });
  });
});
