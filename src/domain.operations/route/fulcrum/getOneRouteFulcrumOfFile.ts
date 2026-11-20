import * as fs from 'fs/promises';
import * as path from 'path';

import { asFulcrumParseOfFile } from './asFulcrumParseOfFile';
import type { RouteFulcrum } from './getAllRouteFulcrums';

/**
 * .what = reads one fulcrum file of a route into its entry
 * .why = a file whose name declares no case is still listed, as unreadable, so a misnamed entry
 *        is named at every gate rather than skipped
 */
export const getOneRouteFulcrumOfFile = async (input: {
  dir: string;
  file: { name: string; declared: { slug: string; title: string } | null };
}): Promise<RouteFulcrum> => ({
  path: path.join('.fulcrums', input.file.name),
  slug: input.file.declared?.slug ?? input.file.name,
  title: input.file.declared?.title ?? input.file.name,
  parse: asFulcrumParseOfFile({
    name: input.file.name,
    content: input.file.declared
      ? await fs.readFile(path.join(input.dir, input.file.name), 'utf8')
      : null,
  }),
});
