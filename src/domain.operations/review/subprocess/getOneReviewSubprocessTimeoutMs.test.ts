import { given, then, when } from 'test-fns';

import { getOneReviewSubprocessTimeoutMs } from './getOneReviewSubprocessTimeoutMs';

const ENV_OF_OVERRIDE = 'RHACHET_REVIEW_TIMEOUT_MS';

/**
 * .what = runs the read under a chosen override, then restores the env
 */
const asTimeoutMsUnder = (input: { override: string | undefined }): number => {
  const prior = process.env[ENV_OF_OVERRIDE];
  // .note = deliberate mutation: the override is a process env read, scoped to this call
  if (input.override === undefined) delete process.env[ENV_OF_OVERRIDE];
  if (input.override !== undefined)
    process.env[ENV_OF_OVERRIDE] = input.override;
  try {
    return getOneReviewSubprocessTimeoutMs({ timeout: { minutes: 3 } });
  } finally {
    if (prior === undefined) delete process.env[ENV_OF_OVERRIDE];
    if (prior !== undefined) process.env[ENV_OF_OVERRIDE] = prior;
  }
};

describe('getOneReviewSubprocessTimeoutMs', () => {
  given('[case1] no override is set', () => {
    when('[t0] the bound is read', () => {
      then('it is the duration the caller declared', () => {
        expect(asTimeoutMsUnder({ override: undefined })).toEqual(180_000);
      });
    });
  });

  given('[case2] the human set an override', () => {
    when('[t0] the bound is read', () => {
      then('the override wins over the declared duration', () => {
        expect(asTimeoutMsUnder({ override: '45000' })).toEqual(45_000);
      });
    });
  });
});
