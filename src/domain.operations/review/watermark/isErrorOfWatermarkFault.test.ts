import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { isErrorOfWatermarkFault } from './isErrorOfWatermarkFault';
import { ReviewWatermarkParseError } from './ReviewWatermarkParseError';

/**
 * .what = a stand-in that bears the class name `with-simple-mutex` gives a hold timeout
 * .why = the classifier matches by NAME, never `instanceof`, so a same-named class is the
 *        whole fixture it needs
 */
class SimpleMutexAcquireTimeoutError extends ConstraintError {}

const TEST_CASES: Array<{
  description: string;
  error: unknown;
  expected: boolean;
}> = [
  {
    description:
      '🔴 the mutex wrap of a backend fault, whose message leads with the qualified header',
    error: new MalfunctionError(
      'withSimpleMutex: the cache backend faulted while it acquired the lock',
      { cause: new Error('EEXIST: file already exists, mkdir') },
    ),
    expected: true,
  },
  {
    description: 'a filesystem write refusal, wrapped one level down',
    error: Object.assign(new Error('wrap'), {
      cause: Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      }),
    }),
    expected: true,
  },
  {
    description: 'a watermark torn past valid json',
    error: new ReviewWatermarkParseError('the watermark is not valid json', {
      key: 'prime.abc',
    }),
    expected: true,
  },
  {
    description: 'a bare SyntaxError, which names no watermark',
    error: new SyntaxError('Unexpected end of JSON input'),
    expected: false,
  },
  {
    description: 'a malfunction of any other origin',
    error: new MalfunctionError('the review prompt could not be compiled'),
    expected: false,
  },
  {
    description: 'a plain error that only names the mutex mid-message',
    error: new Error('a caller asked about withSimpleMutex: once'),
    expected: false,
  },
  {
    description: 'a value that is not an error at all',
    error: 'withSimpleMutex: a string',
    expected: false,
  },
];

describe('isErrorOfWatermarkFault', () => {
  TEST_CASES.map((thisCase) =>
    given(`[case] ${thisCase.description}`, () => {
      when('[t0] it is classified', () => {
        then(`it reads ${thisCase.expected}`, () => {
          expect(isErrorOfWatermarkFault({ error: thisCase.error })).toEqual(
            thisCase.expected,
          );
        });
      });
    }),
  );

  given('[case] a hold that timed out, by class name', () => {
    when('[t0] it is classified', () => {
      then('it reads true', () => {
        expect(
          isErrorOfWatermarkFault({
            error: new SimpleMutexAcquireTimeoutError(
              'a hold could not be had',
            ),
          }),
        ).toEqual(true);
      });
    });
  });
});
