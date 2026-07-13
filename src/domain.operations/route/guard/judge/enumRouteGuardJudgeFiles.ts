import { enumRouteFiles } from '../artifact/enumRouteFiles';

/**
 * .what = enumerates judge guard files by semantic criteria
 * .why = centralizes glob pattern construction for judges
 *
 * filename pattern: .route/$stone.guard.judge.i$iter.$hash.j$idx.md
 */
export const enumRouteGuardJudgeFiles = async (input: {
  route: string;
  stone: string;
  iteration?: number;
  hash?: string;
  index?: number;
}): Promise<string[]> => {
  // construct glob from semantic inputs
  // pattern: .route/$stone.guard.judge.i$iter.$hash.j$idx.md
  let glob = `.route/${input.stone}.guard.judge.`;
  glob += input.iteration !== undefined ? `i${input.iteration}.` : 'i*.';
  glob += input.hash ? `${input.hash}.` : '*.';
  glob += input.index !== undefined ? `j${input.index}.` : 'j*.';
  glob += 'md';

  return enumRouteFiles({ route: input.route, glob });
};
