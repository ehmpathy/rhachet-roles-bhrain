import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = create blocked.triggered marker file
 * .why = records that robot saw the nudge (enables two-step flow)
 */
export const setBlockedTriggeredReport = async (input: {
  stone: string;
  route: string;
}): Promise<{ path: string }> => {
  // ensure .route directory exists
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // compute triggered file path
  const triggeredPath = path.join(routeDir, `${input.stone}.blocked.triggered`);

  // write marker file (content is just the stone name for reference)
  await fs.writeFile(triggeredPath, `stone: ${input.stone}\n`);

  return { path: triggeredPath };
};
