import { existsSync, readdirSync } from 'fs';
import * as path from 'path';

import { asCoordinateValue } from './asCoordinateValue';

/**
 * .what = the values of every `$key=$value` entry in a dir, in name order
 * .why = `.agent/` names each repo and role by coordinate, so the linked roles are read off the
 *        dir names alone, with no manifest to trust
 */
const getAllCoordinateValuesOfDir = (input: {
  dir: string;
  key: string;
}): string[] =>
  readdirSync(input.dir)
    .sort()
    .flatMap((name) => asCoordinateValue({ name, key: input.key }) ?? []);

/**
 * .what = the role links one repo dir holds: one `{ repo, slug }` per `role=$slug` dir
 */
const getAllRoleLinksOfRepo = (input: {
  agentDir: string;
  repo: string;
}): Array<{ repo: string; slug: string }> =>
  getAllCoordinateValuesOfDir({
    dir: path.join(input.agentDir, `repo=${input.repo}`),
    key: 'role',
  }).map((slug) => ({ repo: input.repo, slug }));

/**
 * .what = the role slugs held under `.agent/repo=$repo/`, per repo
 * .why = linked and native roles are known by these dirs alone
 * .note = reads rhachet's `.agent/` layout by hand: rhachet exports no role-lookup contract
 *         this repo can call, so the layout is the contract
 */
export const getAllAgentRoleLinks = (input: {
  repoRoot: string;
}): Array<{ repo: string; slug: string }> => {
  const agentDir = path.join(input.repoRoot, '.agent');
  if (!existsSync(agentDir)) return [];
  return getAllCoordinateValuesOfDir({ dir: agentDir, key: 'repo' }).flatMap(
    (repo) => getAllRoleLinksOfRepo({ agentDir, repo }),
  );
};
