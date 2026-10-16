import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = findserts the route's `.route/` dir, where judge artifacts land
 * .why = the judge runner composes named acts; this names its one dir-create, the twin of
 *        `genPeerReviewsDir` for peer artifacts (rule.prefer.decomposable-architecture)
 */
export const genJudgeRouteDir = async (input: {
  route: string;
}): Promise<{ path: string }> => {
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });
  return { path: routeDir };
};
