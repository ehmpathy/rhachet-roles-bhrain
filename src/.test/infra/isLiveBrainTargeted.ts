/**
 * .what = the env flag a dev sets to target a live-brain suite by name
 * .why = a live brain runs by default only for a safety guard. every other live-brain suite
 *        (a premium model, a billed cache measure) skips by default and in ci; a dev runs one
 *        on purpose, by name
 * .note = a comma list of names, or `all`. the names: `claude`, `cache`. e.g.
 *         RHACHET_LIVE_BRAIN=claude rhx git.repo.test --what integration --scope 'path://stepReview.caseBrain.claude-sonnet' --mode apply
 *         RHACHET_LIVE_BRAIN=cache rhx git.repo.test --what integration --scope 'path://stepReview.casePromptCache' --mode apply
 */
export const LIVE_BRAIN_FLAG = 'RHACHET_LIVE_BRAIN';

/**
 * .what = whether the env flag targets the named live brain
 * .why = one test of the flag for every live-brain suite, so each gates the same way
 */
export const isLiveBrainTargeted = (input: { brain: string }): boolean => {
  const names = (process.env[LIVE_BRAIN_FLAG] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  return names.includes('all') || names.includes(input.brain);
};
