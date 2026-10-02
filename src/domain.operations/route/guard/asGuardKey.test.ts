import { given, then, when } from 'test-fns';

import { asDeclaredGuardKey } from './asDeclaredGuardKey';
import { asGuardKeyValue } from './asGuardKeyValue';

/**
 * .what = pins the two transformers that read a `key: value` line
 * .why = they were extracted from an inline regex-and-trim pipeline inside the parser,
 *        which is decode friction in an operation a reader scans for narrative
 *        (`rule.forbid.inline-decode-friction`). extracted, each is a pure transformer —
 *        and `rule.require.test-coverage-by-grain` puts a transformer at the UNIT grain
 *
 * .note = they are pinned TOGETHER because neither is usable alone: the key decides
 *         whether a line is a declaration at all, and the value is read only once it is.
 *         one file per pair keeps the contract legible as the pair it is
 */
describe('asDeclaredGuardKey', () => {
  given('[case1] a top-level key line', () => {
    const CASES = [
      { line: 'brain: opus', key: 'brain' },
      { line: 'artifacts:', key: 'artifacts' },
      { line: 'model: claude-opus-5[1m]', key: 'model' },
      { line: 'brain:opus', key: 'brain' },
      { line: 'review_budget: 12', key: 'review_budget' },
      { line: 'near-miss: 1', key: 'near-miss' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`the key is \`${thisCase.key}\``, () => {
          expect(asDeclaredGuardKey({ line: thisCase.line })).toEqual(
            thisCase.key,
          );
        });
      });
    });
  });

  given('[case2] a key case a naive split would get wrong', () => {
    when('[t0] the key is upper or mixed case', () => {
      then(
        'it lowercases, so one spelt form reaches the near-miss check',
        () => {
          // .why = a `Brain:` that reached the detector as-is would be two edits from
          //        `brain` by pure string distance, so it would render as a near miss of
          //        the very key it already is
          expect(asDeclaredGuardKey({ line: 'Brain: opus' })).toEqual('brain');
          expect(asDeclaredGuardKey({ line: 'MODEL: opus' })).toEqual('model');
        },
      );
    });
  });

  given('[case3] a line that declares NO top-level key', () => {
    const CASES = [
      { line: '  brain: opus', why: 'it is indented, so it is nested' },
      { line: '  - slug: x', why: 'it is a list item inside another key' },
      { line: '# brain: opus', why: 'it is a comment' },
      { line: '', why: 'it is empty' },
      { line: '   ', why: 'it is whitespace' },
      { line: 'just prose with a colon: here', why: 'the key holds a space' },
      { line: '3rd: x', why: 'a key may not open with a digit' },
      { line: 'brain', why: 'there is no colon at all' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`it returns null — ${thisCase.why}`, () => {
          expect(asDeclaredGuardKey({ line: thisCase.line })).toEqual(null);
        });
      });
    });
  });

  given('[case4] the INDENT rule, which carries the load here', () => {
    // 🔴 .why = a peer review item carries its own `brain:`-adjacent keys nested under a
    //          `- ` entry. a detector blind to indent would read those as top-level
    //          declarations and warn on every guard that configures a reviewer
    when('[t0] a nested key sits under a peer review', () => {
      then('it is refused, so no advisory fires on a valid guard', () => {
        expect(asDeclaredGuardKey({ line: '    run: rhx review' })).toEqual(
          null,
        );
        expect(asDeclaredGuardKey({ line: '\tbrain: opus' })).toEqual(null);
      });
    });
  });
});

describe('asGuardKeyValue', () => {
  given('[case1] a value that needs no repair', () => {
    const CASES = [
      { line: 'brain: opus', value: 'opus' },
      { line: 'brain: claude-opus-5[1m]', value: 'claude-opus-5[1m]' },
      { line: 'brain:opus', value: 'opus' },
      { line: 'brain:    opus   ', value: 'opus' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`the value is \`${thisCase.value}\``, () => {
          expect(asGuardKeyValue({ line: thisCase.line })).toEqual(
            thisCase.value,
          );
        });
      });
    });
  });

  given('[case2] a value that carries a colon of its own', () => {
    // .why = the F10 verdict passes the brain-cli's own `/model` argument through
    //        verbatim, and this repo does not own that vocabulary — so a value with a
    //        colon in it must survive. a `split(':')[1]` would truncate it silently
    when('[t0] the value holds one or more colons', () => {
      then('every segment after the FIRST colon is kept', () => {
        expect(asGuardKeyValue({ line: 'brain: vendor:model:v2' })).toEqual(
          'vendor:model:v2',
        );
      });
    });
  });

  given('[case3] a quoted value', () => {
    const CASES = [
      { line: 'brain: "opus"', value: 'opus' },
      { line: "brain: 'opus'", value: 'opus' },
      { line: 'brain: "  opus  "', value: 'opus' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`the value is \`${thisCase.value}\``, () => {
          // 🔴 .why = the second trim is what makes the last row pass. the strip regex
          //          removes the quotes and hands back the inner whitespace, so with one
          //          trim alone `"  "` survives as a TRUTHY value — and a guard that
          //          declared an empty brain would dispatch `/model ` into the live clone
          expect(asGuardKeyValue({ line: thisCase.line })).toEqual(
            thisCase.value,
          );
        });
      });
    });
  });

  given('[case5] a value with a hand-written remark at its tail', () => {
    /**
     * 🔴 .why = a guard is hand-written, so `brain: opus # the hard stone` is what a hand
     *          writes. before this the whole tail rode into `/model`, which means a
     *          REMARK changed the brain that was requested — and the author could not
     *          see it, since the guard reads exactly as they meant it
     *
     * .note = the harm is worse than a failed switch. the outcome tag reads `requested`
     *         on a value the brain will refuse, so the record claims a switch that could
     *         never land (`rule.forbid.unexpected-defaults`)
     */
    const CASES = [
      { line: 'brain: opus # the hard stone', value: 'opus' },
      {
        line: 'brain: claude-opus-5[1m]  #  for verification',
        value: 'claude-opus-5[1m]',
      },
      { line: "brain: 'opus' # quoted, then remarked", value: 'opus' },
      { line: 'brain: # the whole value is a remark', value: '' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`the value is \`${thisCase.value}\``, () => {
          expect(asGuardKeyValue({ line: thisCase.line })).toEqual(
            thisCase.value,
          );
        });
      });
    });
  });

  given('[case6] a `#` that is part of the value, never a remark', () => {
    // 🔴 .why = the counter-bound, and it is what keeps case=5 from over-reach. the F10
    //          verdict passes the brain-cli's own vocabulary through verbatim, so a `#`
    //          inside a value is this repo's to carry rather than to judge. the yaml
    //          convention is what parts them: a remark opens on WHITESPACE then `#`
    const CASES = [
      { line: 'brain: vendor#v2', value: 'vendor#v2' },
      { line: "brain: 'a # b'", value: 'a # b' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        then(`the value is \`${thisCase.value}\``, () => {
          expect(asGuardKeyValue({ line: thisCase.line })).toEqual(
            thisCase.value,
          );
        });
      });
    });
  });

  given('[case4] a value that is empty, in every form it takes', () => {
    const CASES = ['brain:', 'brain: ', 'brain: "  "', "brain: '  '"];

    CASES.forEach((line) => {
      when(`[t0] the line is \`${line}\``, () => {
        then(
          'the value is the empty string, so the caller can refuse it',
          () => {
            // .why = one falsy value for the whole empty class, so the caller needs one
            //        check rather than four (rule.avoid.unnecessary-ifs)
            expect(asGuardKeyValue({ line })).toEqual('');
          },
        );
      });
    });
  });
});
