import { given, then, when } from 'test-fns';

import { formatWrongPath } from './formatWrongPath';

describe('formatWrongPath', () => {
  const owed = '.behavior/v2026_03_08.feature/review/self/for.1._.design.md';
  const declared =
    '.behavior/v2026_03_08.feature/review/self/for.1._.r1.design.md';

  given('[case1] the driver named a path that is not the owed one', () => {
    const output = formatWrongPath({ owed, declared }).join('\n');

    when('[t0] format is called', () => {
      /**
       * 🔴 .why = this is the whole reason `--into` is required. a check with ONE operand
       *           reports a failure; it takes two to report a difference. before it, a wrong
       *           path surfaced as `the articulation is absent`, which names only where the
       *           guard looked and leaves the driver to guess what it read instead.
       */
      then('renders a DIFF — both operands, each labelled', () => {
        expect(output).toContain(`you named  = ${declared}`);
        expect(output).toContain(`it is owed = ${owed}`);
      });

      then('names the fix as a runnable command', () => {
        expect(output).toContain(
          `rhx mvsafe --from ${declared} --into ${owed}`,
        );
      });

      then('tells the driver what to do after the move', () => {
        expect(output).toContain('then promise again');
      });

      /**
       * .why = the D5 invariant. a driver told to slow down when their file sits at the
       *        wrong path learns the wrong lesson and pays a round trip for the right one.
       */
      then('does NOT reproach the driver for haste', () => {
        expect(output).not.toContain('patience, friend');
        expect(output).not.toContain('what is the rush');
        expect(output).not.toContain('pond barely rippled');
      });

      then('snapshot matches vision', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] no path was declared at all', () => {
    const output = formatWrongPath({ owed, declared: undefined }).join('\n');

    when('[t0] format is called', () => {
      then('still names the owed path', () => {
        expect(output).toContain(`it is owed = ${owed}`);
      });

      then('says plainly that none was named', () => {
        expect(output).toContain('you named  = (none)');
      });

      /**
       * .why = a move command needs a source. with none declared there is no file to move,
       *        so a `--from (none)` would be an instruction that cannot be run.
       */
      then('offers NO move command, since there is no source to move', () => {
        expect(output).not.toContain('rhx mvsafe');
        expect(output).not.toContain('(none) --into');
      });
    });
  });
});
