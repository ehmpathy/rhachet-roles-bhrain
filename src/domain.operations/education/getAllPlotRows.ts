import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { asMarkdownTableRows } from './asMarkdownTableRows';

/**
 * .what = a pursuit's plot rows, keyed by column; empty when no plot or no course table exists
 * .why = the plot names each course in order, and what each builds on; the pursue judge, the
 *        plot order, and the pedigree each read it
 */
export const getAllPlotRows = (input: {
  pursuitRoute: string;
}): Array<Record<string, string>> => {
  const at = path.join(input.pursuitRoute, '1.courses.plot.yield.md');
  if (!existsSync(at)) return [];
  return (
    asMarkdownTableRows({
      markdown: readFileSync(at, 'utf-8'),
      columns: ['course'],
    }) ?? []
  );
};
