import { ConstraintError } from 'helpful-errors';
import { SimpleMutexAcquireTimeoutError } from 'with-simple-mutex';

/**
 * .what = the error a failed hold surfaces as, with an acquire timeout named as a busy file
 * .why = the library's timeout is a ConstraintError that carries no settings path, so the cli
 *        would render it as a verb refusal; the toggle names the file, the cause (another
 *        settings writer held it past the whole wait), and the fix. every other error passes
 *        through as found
 * .note = the headline names the wait already spent, so a human never waits it out again
 *         before the rerun
 */
export const asTermsHookHoldFault = (input: {
  error: unknown;
  pathShown: string;
}): unknown => {
  if (!(input.error instanceof SimpleMutexAcquireTimeoutError))
    return input.error;
  return new ConstraintError(
    'another process held the settings file past a 2 min wait, so learn.terms.hook changed no file',
    {
      settings: input.pathShown,
      hint: 'rerun once the other rhx init, enroll, or toggle ends',
      waitedMse: input.error.metadata?.waitedMse,
    },
  );
};
