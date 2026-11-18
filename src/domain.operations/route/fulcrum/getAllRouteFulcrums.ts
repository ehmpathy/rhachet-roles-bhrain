import * as fs from 'fs/promises';
import * as path from 'path';

import { asAllFulcrumFilesDeclared } from './asAllFulcrumFilesDeclared';
import { asAllFulcrumsCaseUnique } from './asAllFulcrumsCaseUnique';
import type { FulcrumFrontmatterParse } from './asFulcrumFrontmatter';
import { getOneRouteFulcrumOfFile } from './getOneRouteFulcrumOfFile';

/**
 * .what = one fulcrum entry on a route, with its frontmatter parse
 * .why = the gate, the linter, the dispute state, and the verdict lever each read every entry;
 *        one shape for all
 */
export interface RouteFulcrum {
  /**
   * the entry's path, relative to the route dir — the form a human reads and a dispute cites
   */
  path: string;
  /**
   * the case id from the file name (`case=F44-<slug>` → `F44`), so an entry with no readable
   * frontmatter can still be named. a file whose name declares no case reads as its own name
   */
  slug: string;
  /**
   * the title from the file name (`case=F44-rename-table` → `rename-table`), which the halt
   * prints beside the case so a human knows the subject before the file is opened
   */
  title: string;
  parse: FulcrumFrontmatterParse;
}

/**
 * .what = reads and parses every fulcrum entry of a route
 * .why = invariant 5 makes the fulcrum file the one home of a deferral; every enforcer reads it
 *        here, so no enforcer can read a different set of entries than another
 */
export const getAllRouteFulcrums = async (input: {
  route: string;
}): Promise<RouteFulcrum[]> => {
  // a route with no .fulcrums dir has no fulcrums
  const dir = path.join(input.route, '.fulcrums');
  const names = await fs
    .readdir(dir)
    .catch((error: NodeJS.ErrnoException): string[] => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });

  // read each entry; a file whose name declares no case is still listed, as unreadable
  const fulcrums = await Promise.all(
    asAllFulcrumFilesDeclared({ names }).map((file) =>
      getOneRouteFulcrumOfFile({ dir, file }),
    ),
  );

  // two files under one case id are each named unreadable, never resolved by order
  return asAllFulcrumsCaseUnique({ fulcrums });
};
