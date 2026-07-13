import * as fs from 'fs/promises';
import * as path from 'path';

import { asStampContent } from './asStampContent';

/**
 * .what = upserts a {stoneName}.stamp file with the guard's final report
 * .why = stamps the peer-review report that the guard emits before passage,
 *        so folks can review the latest border-gate result without a guard re-run
 * .note = sits at the route root next to .guard/.stone/.yield (unsealed, git-tracked)
 * .note = upsert (last-writer-wins): always reflects the most recent guard run
 */
export const setStoneGuardStamp = async (input: {
  stone: { name: string };
  route: string;
  emit: { stdout: string; stderr?: string };
}): Promise<{ path: string }> => {
  // compose stamp content: stdout, plus stderr appended when present
  // .note = reuse the already-formatted emit strings; never re-format (single source of render)
  const stampContent = asStampContent({ emit: input.emit });

  // upsert the stamp at the route root
  const stampPath = path.join(input.route, `${input.stone.name}.stamp`);
  await fs.writeFile(stampPath, stampContent);

  return { path: stampPath };
};
