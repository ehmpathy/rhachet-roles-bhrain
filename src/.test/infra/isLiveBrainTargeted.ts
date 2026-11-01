/**
 * .what = the env flag a dev sets to target a live-brain suite by name
 * .why = a live brain that needs an oauth token never runs by default. ci holds no such token,
 *        so these suites skip there; a dev runs one on purpose, by name
 * .note = a comma list of names, or `all`. e.g.
 *         RHACHET_LIVE_BRAIN=claude rhx git.repo.test --what integration --scope 'path://stepReview.caseBrain.claude-sonnet' --mode apply
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
