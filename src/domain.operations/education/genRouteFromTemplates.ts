import * as fs from 'fs/promises';
import * as path from 'path';

import { genFile } from '@src/domain.operations/learn/genFile';

import { asTemplateFilled } from './asTemplateFilled';

/**
 * .what = the file names a findsert wrote, parted into the ones it created and the ones it kept
 * .why = init reports both, so a driver sees which stones its edits survived in
 */
const asFilesPartedByCreation = (input: {
  results: Array<{ name: string; created: boolean }>;
}): { created: string[]; kept: string[] } => ({
  created: input.results.flatMap((r) => (r.created ? [r.name] : [])),
  kept: input.results.flatMap((r) => (r.created ? [] : [r.name])),
});

/**
 * .what = findsert every template of a dir into a route dir, each `$NAME` filled
 * .why = pursuit and course routes are both a fixed set of stones and guards; a re-run keeps
 *        each file already written, so a driver's edits to a stone survive
 */
export const genRouteFromTemplates = async (input: {
  templatesDir: string;
  routeDir: string;
  vars: Record<string, string>;
}): Promise<{ created: string[]; kept: string[] }> => {
  // the templates, in name order, so the output lists stones in route order
  const names = (await fs.readdir(input.templatesDir)).sort();
  await fs.mkdir(input.routeDir, { recursive: true });

  // findsert each one, filled
  const results = await Promise.all(
    names.map(async (name) => {
      const template = await fs.readFile(
        path.join(input.templatesDir, name),
        'utf-8',
      );
      const { created } = await genFile({
        at: path.join(input.routeDir, name),
        content: asTemplateFilled({ template, vars: input.vars }),
        idem: 'findsert',
      });
      return { name, created };
    }),
  );

  return asFilesPartedByCreation({ results });
};
