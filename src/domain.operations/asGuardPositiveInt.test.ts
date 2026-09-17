import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asGuardPositiveInt } from './asGuardPositiveInt';

/**
 * .what = the transformer's own clamps, at the grain of the transformer
 * .why = it had NONE. its two guard-key call sites are clamped through
 *        `parseStoneGuard.test.ts` (`[case14]`, `[case16]`), and the third — the
 *        `RHACHET_LEVEL_CONCURRENCY` override this feature authored — was
 *        exercised at exactly one acceptance case, and only with a VALID value.
 *
 * 🔴 .why that gap was the sharp one = the file's own docblock makes an explicit
 *     safety claim about the malformed path (*"a typo is refused loudly at the
 *     first pour rather than absorbed"*), and no test proved it. so the one
 *     caller this feature introduced was the one caller whose refusal was
 *     unproven — the exact hazard class the transformer exists to close, left
 *     open at the transformer's own newest seam (raised i005/r010, and
 *     independently re-prioritized by i005/r011)
 *
 * 🟡 .note = it is a UNIT test, and legitimately so — the transformer is pure,
 *         reads no disk, and spawns no process (`rule.forbid.unit.remote-boundaries`)
 */
describe('asGuardPositiveInt', () => {
  given('[case1] a well-formed positive integer', () => {
    when('[t0] it is read', () => {
      then('it returns the number', () => {
        expect(
          asGuardPositiveInt({ raw: '10', key: 'concurrency', at: 'x' }),
        ).toEqual(10);
      });

      then('one is the floor, and it is admitted', () => {
        expect(
          asGuardPositiveInt({ raw: '1', key: 'concurrency', at: 'x' }),
        ).toEqual(1);
      });

      then(
        'a large value is admitted — the bound is on SHAPE, never magnitude',
        () => {
          expect(
            asGuardPositiveInt({ raw: '9999', key: 'budget', at: 'x' }),
          ).toEqual(9999);
        },
      );
    });
  });

  /**
   * .why = `parseInt('abc', 10)` is `NaN`, and `NaN` is the worst of the
   *        malformed values: it does not bind at the wrong number, it makes
   *        every comparison against it FALSE. so a `NaN` budget never exhausts
   *        and a `NaN` concurrency never binds — each an unbounded ladder,
   *        reported nowhere
   */
  given('[case2] a non-numeric value', () => {
    when('[t0] it is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({
          raw: 'abc',
          key: 'concurrency',
          at: 'env RHACHET_LEVEL_CONCURRENCY',
        }),
      );

      then('it is refused, as a caller fault', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });

      then(
        'the message names the key, the site, and the value declared',
        () => {
          expect(error?.message).toContain('concurrency');
          expect(error?.message).toContain('env RHACHET_LEVEL_CONCURRENCY');
          expect(error?.message).toContain('abc');
        },
      );
    });
  });

  /**
   * .why = zero parses as a valid integer, so a shape-only check admits it —
   *        and a zero bound reads to a driver as every reviewer malfunctioned
   *        at once. the `< 1` clause is what refuses it, and this is its clamp
   */
  given('[case3] zero', () => {
    when('[t0] it is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: '0', key: 'budget', at: 'x' }),
      );

      then('it is refused — a bound of zero is not a bound', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  /**
   * .why = a negative also parses as a valid integer. it is caught by the
   *        `^[0-9]+$` test rather than by `< 1`, because the minus sign is not
   *        a digit — so this clamps the FIRST clause where `[case3]` clamps the
   *        second, and neither substitutes for the other
   */
  given('[case4] a negative value', () => {
    when('[t0] it is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: '-1', key: 'level', at: 'x' }),
      );

      then('it is refused', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  /**
   * 🔴 .why this pair is the reason the RAW text is tested, never `parseInt`'s
   *     answer = `parseInt` reads a PREFIX. it answers `2` for `2.5` and `1`
   *     for `1e3`, so a check on its ANSWER admits both and truncates them
   *     SILENTLY — the author declares `2.5` and the level pours `2`, with no
   *     line of output to say so. a silent truncation is worse than a refusal
   *     because it yields a run that works, at a number nobody chose
   */
  given('[case5] a value `parseInt` would silently truncate', () => {
    when('[t0] a fractional value is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: '1.5', key: 'concurrency', at: 'x' }),
      );

      then('it is refused, never rounded to 1', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });

      then('the message quotes the value AS DECLARED, never as parsed', () => {
        expect(error?.message).toContain('1.5');
      });
    });

    when('[t1] exponential notation is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: '1e3', key: 'budget', at: 'x' }),
      );

      then('it is refused, never truncated to 1', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });

    when('[t2] a suffixed value is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: '10ms', key: 'timeout', at: 'x' }),
      );

      then('it is refused — a prefix match is not a value', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  /**
   * .why = an env var set to `''` is `!== undefined`, so it REACHES the
   *        transformer rather than defers to the default. that is the one
   *        malformed shape a reader is most likely to produce by accident
   *        (`export RHACHET_LEVEL_CONCURRENCY=`), and `parseInt('')` is `NaN`
   */
  given('[case6] the empty and whitespace values an env var can carry', () => {
    when('[t0] an empty string is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({
          raw: '',
          key: 'concurrency',
          at: 'env RHACHET_LEVEL_CONCURRENCY',
        }),
      );

      then('it is refused, never absorbed as the default', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });

    when('[t1] a padded value is read', () => {
      const error = getError(() =>
        asGuardPositiveInt({ raw: ' 2 ', key: 'concurrency', at: 'x' }),
      );

      then('it is refused — this transformer does not trim', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  /**
   * .why = this refusal carries NO metadata argument, and that is the contract —
   *        so the assertion is that the rendered message is self-sufficient and
   *        free of a json dump, never that a parallel structured record exists.
   *
   * 🔴 .why no metadata = `HelpfulError` appends `JSON.stringify(metadata)` to the
   *     PUBLIC `.message` (see its constructor). every `route.ts` catch prints
   *     `error.message`, so any metadata passed here lands in the driver's stderr
   *     as a raw json blob beneath the sentence — which `rule.require.errors-name-the-fix`
   *     forbids: an error names the fix in prose, it does not hand over a dump.
   *
   *     ⚠️ an earlier draft of this suite asserted `original.metadata` on the
   *       ground that "the message is for a HUMAN, the record is for a LOG". the
   *       second consumer does not exist: this is a parse-time refusal that exits
   *       the cli, and no log pipeline reads it. so the record had exactly one
   *       reader — the renderer that must not print it.
   *
   *     ⇒ the three fields are therefore interpolated into the sentence itself
   *       (`[case2]`, `[case5]`), which is strictly more useful: a driver reads
   *       them with no json parse, and no consumer loses anything.
   *
   * 🟡 .the repo-wide half is NOT fixed here = ~12 prior errors across
   *     `stone.add`, `guard-upgrade`, and `route.set` still append a dump, pinned
   *     in their snapshots. to strip it at the render boundary would re-baseline
   *     four files this change never touched, so it is caught rather than ridden
   *     along: `.dream/v2026_09_10.fix.every-cli-error-appends-a-raw-json-context-dump.md`
   */
  given('[case7] a refusal a driver reads straight off stderr', () => {
    when('[t0] the rendered message is inspected', () => {
      const error = getError(() =>
        asGuardPositiveInt({
          raw: 'two',
          key: 'concurrency',
          at: 'env RHACHET_LEVEL_CONCURRENCY',
        }),
      );

      then(
        'it names the key, the site, and the declared value, in prose',
        () => {
          expect((error as Error).message).toContain('concurrency');
          expect((error as Error).message).toContain(
            'env RHACHET_LEVEL_CONCURRENCY',
          );
          expect((error as Error).message).toContain('"two"');
        },
      );

      then('the PUBLIC message carries no json dump', () => {
        // 🔴 the public `.message` is what every `route.ts` catch prints. to assert
        //    `original.message` here would pass under a metadata argument and let
        //    the dump reach the driver anyway — so this reads the rendered string
        expect((error as Error).message).not.toContain('{');
      });
    });
  });
});
