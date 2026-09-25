import { given, then, when } from 'test-fns';

import { formatNoAskOnRecord } from './formatNoAskOnRecord';

describe('formatNoAskOnRecord', () => {
  given('[case1] a promise arrived with no ask on record', () => {
    const output = formatNoAskOnRecord({
      stone: '1.vision',
      slug: 'all-done',
    }).join('\n');

    when('[t0] format is called', () => {
      then('names both operands of the absent key', () => {
        expect(output).toContain('stone = 1.vision');
        expect(output).toContain('slug  = all-done');
      });

      /**
       * 🔴 .why = the driver's file may be perfect. what is absent is the ASK it would
       *           answer, and a message that named a path or a haste would send them to
       *           re-check work that is already correct.
       */
      then('names no path and no haste', () => {
        expect(output).not.toContain('review/self/');
        expect(output).not.toContain('rush');
        expect(output).not.toContain('patience');
      });

      /**
       * .why = the whole confrontation is that two gates COULD NOT RUN. a driver who is
       *        not told that reads the refusal as arbitrary.
       */
      then('states which two gates cannot run, and why', () => {
        expect(output).toContain('freshness bar has no date');
        expect(output).toContain('haste cue has no start');
      });

      /**
       * 🔴 .why = the one move is `--as passed`, never another promise. a message that ends
       *           at the diagnosis costs the driver a round trip to discover that.
       */
      then('names the exact command that mints the ask', () => {
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as passed',
        );
      });

      then('names the step that follows it', () => {
        expect(output).toContain('then promise again');
      });

      then('snapshot matches vision', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] a different stone and slug', () => {
    when('[t0] format is called', () => {
      /**
       * .why = the command is the part a driver copies. a hard-coded stone in it would
       *        send every driver to re-ask for `1.vision`, whatever they were promised on.
       */
      then('the command carries the caller stone, never a fixed one', () => {
        const output = formatNoAskOnRecord({
          stone: '3.1.blueprint',
          slug: 'design',
        }).join('\n');

        expect(output).toContain(
          'rhx route.stone.set --stone 3.1.blueprint --as passed',
        );
        expect(output).toContain('slug  = design');
      });
    });
  });
});
