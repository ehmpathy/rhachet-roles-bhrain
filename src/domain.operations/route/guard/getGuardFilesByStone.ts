import * as path from 'path';

/**
 * .what = filters guard files to those a `--stone` argument targets, by BOUNDARY match
 * .why = `--stone 5.1` should select every `5.1.*` guard (e.g. `5.1.execution`) but NOT
 *   a lookalike-numeric `5.10.x`. a raw `startsWith` conflates them (the known
 *   `routeGuardBudget` divergence, i010.B/i011.B3); this boundary match — exact stone OR
 *   `stone + '.'` prefix — closes that hazard. shared at guard/ so a follow-up can
 *   migrate `routeGuardBudget` onto it and converge the two verbs on ONE match.
 *
 * .note = the stone name is the basename minus `.guard`, so `--stone 5.1.execution`
 *   matches `5.1.execution.guard` exactly.
 */
export const getGuardFilesByStone = (input: {
  guardFiles: string[];
  stone: string;
}): string[] =>
  input.guardFiles.filter((guardFile) => {
    const stoneName = path.basename(guardFile).replace(/\.guard$/, '');
    return stoneName === input.stone || stoneName.startsWith(input.stone + '.');
  });
