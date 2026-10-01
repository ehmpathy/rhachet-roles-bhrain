import { given, then, when } from 'test-fns';

import { formatGuardParseWarnings } from './formatGuardParseWarnings';
import type { GuardParseWarning } from './GuardParseWarning';

/**
 * .what = clamps the prose a driver reads when the parser DROPS a top-level guard key
 * .why = per F4 the parser stays permissive, so a dropped key cannot throw; this render is
 *        what parts a dropped prescription from a stone that declared none
 *
 * .note = the parser suite pins the structured flags; this pins the bytes a human reads
 * 🟡 .note = no production surface calls this render yet — case=4's fail-safe is unwired
 */
describe('formatGuardParseWarnings', () => {
  const GUARD = '.behavior/v2026_09_09.example/5.3.verification.guard';

  given('[case1] no dropped keys', () => {
    when('[t0] the advisory is rendered', () => {
      then('it emits NOT ONE byte', () => {
        // .why = no dropped key is the common case; a header with no rows would put a
        //    line on every guard read
        expect(formatGuardParseWarnings({ warnings: [] })).toEqual('');
      });
    });
  });

  given('[case2] a KNOWN key declared with no value', () => {
    const warn: GuardParseWarning = {
      type: 'key-empty',
      key: 'brain',
      guard: GUARD,
      line: 12,
    };

    when('[t0] the advisory is rendered', () => {
      then('the exact bytes a driver reads', () => {
        expect(
          formatGuardParseWarnings({ warnings: [warn] }),
        ).toMatchSnapshot();
      });

      then('it names the fix with a value a driver can PASTE', () => {
        // .why = an abstract `<slot>` names a vocabulary, never a fix
        expect(formatGuardParseWarnings({ warnings: [warn] })).toContain(
          'brain: claude-sonnet-5[1m]',
        );
      });

      then('it states what a verbatim paste WOULD DO', () => {
        // 🔴 .why = the value is a LIVE `/model` argument: a driver who blanked `brain:` to
        //    inherit and pastes it dispatches a switch they never chose. an `e.g.` hedge
        //    does not survive a paste; the consequence line does
        const rendered = formatGuardParseWarnings({ warnings: [warn] });
        expect(rendered).toContain('that value is an EXAMPLE');
        expect(rendered).toContain('dispatches `/model claude-sonnet-5[1m]`');
      });

      then('it offers the DELIBERATE-inherit path as a peer of the fix', () => {
        // .why = a blank key may mean "declare, forgot" or "inherit"; serve both readers
        expect(formatGuardParseWarnings({ warnings: [warn] })).toContain(
          'remove the `brain:` line, and inherit the brain deliberately',
        );
      });

      then('it carries NO "safe to ignore" hedge', () => {
        // .why = `brain:` is a key this build owns, so a blank one is never safe to ignore.
        //    asserted, since the near-miss arm's hedge invites a restore by symmetry
        expect(formatGuardParseWarnings({ warnings: [warn] })).not.toContain(
          'safe to ignore',
        );
      });
    });
  });

  given('[case3] a KNOWN alias of a key the parser applies', () => {
    const warn: GuardParseWarning = {
      type: 'key-alias',
      key: 'model',
      canonical: 'brain',
      value: 'claude-opus-5[1m]',
      guard: GUARD,
      line: 12,
    };

    when('[t0] the advisory is rendered', () => {
      then('the exact bytes a driver reads', () => {
        expect(
          formatGuardParseWarnings({ warnings: [warn] }),
        ).toMatchSnapshot();
      });

      then('it hands back the value it READ, never the example', () => {
        // .why = the driver already typed a value. to answer with a sample would make
        //    them re-derive what they wrote, and a rename is the whole fix here
        expect(formatGuardParseWarnings({ warnings: [warn] })).toContain(
          'brain: claude-opus-5[1m]',
        );
      });

      then('it says the value did NOT take', () => {
        // 🔴 .why = `model:`'s value is still DROPPED; "did you mean" alone reads as a style
        //    note beside a switch that worked
        expect(formatGuardParseWarnings({ warnings: [warn] })).toContain(
          'its value did not take',
        );
      });

      then('it carries NO "safe to ignore" hedge', () => {
        expect(formatGuardParseWarnings({ warnings: [warn] })).not.toContain(
          'safe to ignore',
        );
      });
    });

    when('[t1] the alias is declared with no value of its own', () => {
      then('it falls back to the example rather than an empty fix line', () => {
        expect(
          formatGuardParseWarnings({ warnings: [{ ...warn, value: '' }] }),
        ).toContain('brain: claude-sonnet-5[1m]');
      });
    });
  });

  given('[case4] an UNKNOWN key, one or two edits from a known one', () => {
    const warn: GuardParseWarning = {
      type: 'key-near-miss',
      key: 'brian',
      nearest: 'brain',
      guard: GUARD,
      line: 12,
    };

    when('[t0] the advisory is rendered', () => {
      then('the exact bytes a driver reads', () => {
        expect(
          formatGuardParseWarnings({ warnings: [warn] }),
        ).toMatchSnapshot();
      });

      then('it DOES carry the "safe to ignore" hedge', () => {
        // .why this arm alone = per F4 the key set is OPEN, so an unknown key may be a
        //    future one; the parser reports the drop and leaves the call to the reader
        expect(formatGuardParseWarnings({ warnings: [warn] })).toContain(
          'safe to ignore',
        );
      });
    });
  });

  given('[case5] two dropped keys in one guard', () => {
    const warns: GuardParseWarning[] = [
      { type: 'key-empty', key: 'brain', guard: GUARD, line: 12 },
      {
        type: 'key-near-miss',
        key: 'brian',
        nearest: 'brain',
        guard: GUARD,
        line: 14,
      },
    ];

    when('[t0] the advisories are rendered together', () => {
      then('the exact bytes a driver reads', () => {
        expect(formatGuardParseWarnings({ warnings: warns })).toMatchSnapshot();
      });

      then(
        'both render as branches of ONE `🗿 guard` tree, shut by a blank line',
        () => {
          // 🔴 .why ONE tree = flat `🗿 guard:` blocks stacked one per key read as prose, not
          //    as the treestruct every other surface renders (`S13`)
          // .why the blank line = a caller may prepend this onto other output; the
          //    terminator belongs to the tree, never to whoever concatenates it
          const rendered = formatGuardParseWarnings({ warnings: warns });
          expect(rendered.startsWith('🗿 guard\n   ├─ `brain:`')).toEqual(true);
          expect(rendered).toContain(
            '\n   │\n   └─ `brian:` is not a key i know',
          );
          expect(rendered.split('🗿').length - 1).toEqual(1);
          expect(rendered.endsWith('\n\n')).toEqual(true);
        },
      );

      then(
        'every block names the guard by BASENAME and its line number',
        () => {
          // .why basename = provenance for an in-place warn; the HALT's fix is "open this
          //    file", so it alone renders the full path
          const rendered = formatGuardParseWarnings({ warnings: warns });
          expect(rendered).toContain('at: 5.3.verification.guard:12');
          expect(rendered).toContain('at: 5.3.verification.guard:14');
          expect(rendered).not.toContain('.behavior/v2026_09_09.example');
        },
      );
    });
  });

  /**
   * .what = the fix line derives from the driver's OWN value, never a canned example
   * .why = a canned fix tells a driver who wrote `gpt-4o@latest` to paste a model they
   *        never chose. each row below is a different honest answer to "what do i paste"
   */
  given('[case6] a KNOWN key whose value is not a readable literal', () => {
    const asWarn = (value: string): GuardParseWarning => ({
      type: 'key-unreadable',
      key: 'brain',
      value,
      guard: GUARD,
      line: 12,
    });

    when('[t0] one stray character sits in an otherwise-valid slug', () => {
      const rendered = formatGuardParseWarnings({
        warnings: [asWarn('gpt-4o@latest')],
      });

      then('the exact bytes a driver reads', () => {
        expect(rendered).toMatchSnapshot();
      });

      then('it NAMES the refused character rather than the whole value', () => {
        // .why = the `read:` line echoes the value; it cannot show WHICH character offended
        expect(rendered).toContain('refused: `@`');
      });

      then('🔴 the fix is THEIR value repaired, never the example', () => {
        // .why = a canned `claude-sonnet-5[1m]` would be unrelated to the input
        //    (`rule.require.errors-name-the-fix`)
        expect(rendered).toContain('brain: gpt-4olatest');
        expect(rendered).not.toContain('claude-sonnet-5[1m]');
      });

      then(
        'and it tells them to CHECK the derived value before a paste',
        () => {
          // .why = a strip guesses intent: `gpt-4o@latest` yields `gpt-4olatest`, valid and
          //    possibly wrong
          expect(rendered).toContain('check that is the slug you meant');
        },
      );
    });

    when('[t1] the value carries a SPACE', () => {
      const rendered = formatGuardParseWarnings({
        warnings: [asWarn('gpt 4o')],
      });

      then('the exact bytes a driver reads', () => {
        expect(rendered).toMatchSnapshot();
      });

      then('the space is named so a reader can SEE it', () => {
        // .why a codepoint = a space inside backticks renders as an invisible gap
        expect(rendered).toContain('U+0020 (a space)');
      });

      then('🔴 it offers the FIRST word, never the two joined', () => {
        // 🔴 .why = a strip would fabricate `gpt4o`, a slug never written. `/model` takes ONE
        //    argument, so the fix picks one of the two supplied
        expect(rendered).toContain('`/model` takes ONE argument');
        expect(rendered).toContain('brain: gpt');
        expect(rendered).not.toContain('brain: gpt4o');
      });
    });

    when('[t2] no part of the value survives the set', () => {
      const rendered = formatGuardParseWarnings({ warnings: [asWarn('@@%%')] });

      then('the exact bytes a driver reads', () => {
        expect(rendered).toMatchSnapshot();
      });

      then('it falls back to the example, and says why', () => {
        // .why = an empty derivation is no fix; here alone the example beats a blank line
        expect(rendered).toContain('no part of your value survives the set');
        expect(rendered).toContain('brain: claude-sonnet-5[1m]');
      });
    });

    when('[t3] the value repeats one refused character', () => {
      then('the refusal names the character ONCE', () => {
        // .why = a reader repairs a character, never each occurrence of it
        const rendered = formatGuardParseWarnings({
          warnings: [asWarn('a@@b@c')],
        });
        expect(rendered).toContain('refused: `@` —');
      });
    });
  });
});
