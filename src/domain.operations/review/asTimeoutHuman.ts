import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = renders a timeout in the largest unit that states it exactly
 * .why = the subprocess kill and the brain-call deadline both report a timeout, and a
 *        human reads it to choose a new `RHACHET_REVIEW_TIMEOUT_MS`. a floored figure
 *        understates the bound (90s read as one minute), so the unit steps down until
 *        the figure is exact, and the noun agrees with the count
 */
export const asTimeoutHuman = (input: { ms: number }): string => {
  if (input.ms > 0 && input.ms % 60_000 === 0) {
    const minutes = input.ms / 60_000;
    return asCountedNoun({ count: minutes, one: 'minute', many: 'minutes' });
  }
  if (input.ms > 0 && input.ms % 1000 === 0) {
    const seconds = input.ms / 1000;
    return asCountedNoun({ count: seconds, one: 'second', many: 'seconds' });
  }
  return `${input.ms}ms`;
};
