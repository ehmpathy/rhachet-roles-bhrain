import * as path from 'path';

/**
 * .what = maps guard file paths to their stone names (basename minus the `.guard` ext)
 * .why = the no-match error (edge.2) lists the AVAILABLE stones so a driver can correct
 *   a mistyped `--stone`. a named producer keeps that hint honest (not an ad-hoc inline).
 */
export const getGuardStoneNames = (input: { guardPaths: string[] }): string[] =>
  input.guardPaths.map((guardPath) =>
    path.basename(guardPath).replace(/\.guard$/, ''),
  );
