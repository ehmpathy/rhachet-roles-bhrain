import { given, then, when } from 'test-fns';

import { isGuardValueLiteral } from './isGuardValueLiteral';

describe('isGuardValueLiteral', () => {
  given('[case1] every real brain value this repo has ever declared', () => {
    /**
     * .why = an allowlist earns its keep only if it admits the values that actually occur.
     *        each row below is SAMPLED — from this repo's own guards, from `asGuardKey`'s
     *        extant clamps, and from rhachet's shipped brainslugs — never invented, so a
     *        pass here is evidence rather than a restatement of the regex
     */
    const CASES = [
      'opus',
      'sonnet',
      'claude-opus-5[1m]',
      'claude-sonnet-5[1m]',
      'claude-haiku-4-5-20251001',
      'anthropic/claude/sonnet',
      'openrouter/deepseek/flash',
      'vendor:model:v2',
      'vendor#v2',
    ];

    CASES.forEach((value) => {
      when(`[t0] the value is \`${value}\``, () => {
        then('it reads as a literal', () => {
          expect(isGuardValueLiteral({ value })).toEqual(true);
        });
      });
    });
  });

  given('[case2] the fabricated forms the extractor hands back TRUTHY', () => {
    /**
     * 🔴 .why = every row is a non-empty string, so a truthiness check alone would send
     *          `/model <row>` into the live clone, and no refusal comes back to read (F5)
     *
     * .note = they are listed as EXTRACTOR OUTPUT, never as guard lines. `brain: 'opus`
     *         yields `'opus` — the quote-strip regex needs a matched pair, so it no-ops —
     *         and that string is what this predicate is asked about
     */
    const CASES = [
      "'opus", // an unclosed single quote — the reviewers' own trace
      '"opus', // its double-quote twin
      'opus$(cat .brain)', // a command substitution
      '`whoami`', // its backtick form
      '$BRAIN', // a variable
      "\\'opus\\'", // an escaped pair
      'opus; rm -rf /', // a separator
      'a # b', // a space — `/model` takes ONE argument
    ];

    CASES.forEach((value) => {
      when(`[t0] the value is \`${value}\``, () => {
        then('it does NOT read as a literal, so the caller refuses it', () => {
          expect(isGuardValueLiteral({ value })).toEqual(false);
        });
      });
    });
  });

  given('[case3] the EMPTY value, which has an advisory of its own', () => {
    /**
     * 🔴 .why = `key-empty` already owns this class with its own prose and its own fix
     *          line. were this predicate to fail '' too, one `brain:` line would raise TWO
     *          advisories that name two different repairs — so the driver reads a
     *          contradiction on the one surface that exists to tell them what to do
     *
     * ⇒ the refusal of '' is the CALLER's truthiness check, which both call sites run
     *   first. this row is what keeps the two from a double fire
     */
    when('[t0] the value is the empty string', () => {
      then('it passes, and the caller`s truthiness check refuses it', () => {
        expect(isGuardValueLiteral({ value: '' })).toEqual(true);
      });
    });
  });
});
