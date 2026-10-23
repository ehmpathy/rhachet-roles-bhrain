import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asStoneNotFoundError } from './asStoneNotFoundError';

describe('asStoneNotFoundError', () => {
  given('[case1] a mistyped stone on --as conceded', () => {
    when('[t0] the refusal is composed', () => {
      const error = asStoneNotFoundError({
        act: 'conceded',
        route: '.behavior/v2026_01_01.demo',
        pattern: '5.1.exec',
        stones: [{ name: '1.vision' }, { name: '5.1.execution' }],
      });

      then('it is a constraint the driver fixes', () => {
        expect(error).toBeInstanceOf(ConstraintError);
      });

      then('it names the act and the pattern', () => {
        expect(error.message).toContain(
          'stone not found for --as conceded: 5.1.exec',
        );
      });

      then('it names every valid stone', () => {
        expect(error.message).toContain('1.vision');
        expect(error.message).toContain('5.1.execution');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
