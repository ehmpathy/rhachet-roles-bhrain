import * as path from 'path';

/**
 * .what = the repo-local bin paths the `$rhx` and `$rhachet` guard vars expand to
 * .why = the review run and the judge run both expand these two vars; one source
 *        keeps the two expansions from drift
 */
export const asRuntimeGuardBinPaths = (input: {
  repoRoot: string;
}): { rhx: string; rhachet: string } => ({
  rhx: path.join(input.repoRoot, 'node_modules', '.bin', 'rhx'),
  rhachet: path.join(input.repoRoot, 'node_modules', '.bin', 'rhachet'),
});
