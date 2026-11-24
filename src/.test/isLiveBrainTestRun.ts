/**
 * .what = whether a named live-brain flag (`BHRAIN_TEST_LIVE_<X>=1`) targets this jest run
 * .why = a live-brain test runs only where a named flag targets it, so the default run makes no
 *        live call and needs no llm key. only a targeted run sources the `ehmpath/test` keys, and
 *        it sources them strictly, so a flagged run with no keys fails at setup with the keyrack hint
 *
 * .note = an ungated live call in a default run fails loud on its absent key, never silent
 * .note = relative imports only: jest loads its globalSetup without the moduleNameMapper
 */
export const isLiveBrainTestRun = (input: {
  env: Record<string, string | undefined>;
}): boolean =>
  Object.entries(input.env).some(
    ([key, value]) => key.startsWith('BHRAIN_TEST_LIVE_') && value === '1',
  );
