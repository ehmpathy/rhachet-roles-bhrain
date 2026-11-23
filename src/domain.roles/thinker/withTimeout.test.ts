import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
  given('[case1] a call that settles inside the threshold', () => {
    when('[t0] it is invoked', () => {
      then('its own answer returns', async () => {
        const logic = withTimeout(
          async (input: { n: number }, _: null) => input.n + 1,
          { threshold: { milliseconds: 500 } },
        );
        expect(await logic({ n: 1 }, null)).toEqual(2);
      });
    });
  });

  given('[case2] a call that runs past the threshold', () => {
    when('[t0] it is invoked', () => {
      then(
        'it rejects with a MalfunctionError that names the threshold',
        async () => {
          const logic = withTimeout(
            async (_input: { n: number }, _context: null) =>
              new Promise<number>((done) => setTimeout(() => done(1), 300)),
            { threshold: { milliseconds: 20 } },
          );
          const error = await getError(logic({ n: 1 }, null));
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain('ran past its threshold');
        },
      );
    });
  });
});
