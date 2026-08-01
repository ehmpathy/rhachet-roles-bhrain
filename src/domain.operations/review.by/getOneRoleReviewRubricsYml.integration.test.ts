import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useThen, when } from 'test-fns';

import { getOneRoleReviewRubricsYml } from './getOneRoleReviewRubricsYml';

/**
 * .what = builds a temp repo-root with a role dir under .agent
 * .why = the communicator globs .agent/repo=*​/role=$role relative to cwd; a tempdir gives a
 *        hermetic layout so the test never depends on the real installed roles.
 */
const genTempRoleDir = async (input: {
  repo: string;
  role: string;
  rubricsYml?: string;
}): Promise<string> => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'review-by-yml-'));
  const roleDir = path.join(
    root,
    '.agent',
    `repo=${input.repo}`,
    `role=${input.role}`,
  );
  const reviewsDir = path.join(roleDir, 'briefs', 'reviews');
  await fs.mkdir(reviewsDir, { recursive: true });
  if (input.rubricsYml !== undefined)
    await fs.writeFile(path.join(reviewsDir, 'rubrics.yml'), input.rubricsYml);
  return root;
};

describe('getOneRoleReviewRubricsYml', () => {
  given('[case1] a role dir with a rubrics.yml', () => {
    const scene = useThen('the temp layout exists', async () => {
      const cwd = await genTempRoleDir({
        repo: 'ehmpathy',
        role: 'mechanic',
        rubricsYml:
          'rubrics:\n  - slug: mech-failhides\n    rules: [.agent/a.md]\n',
      });
      return { cwd };
    });

    when('[t0] the role is looked up', () => {
      const found = useThen('it resolves the yml', async () =>
        getOneRoleReviewRubricsYml({ role: 'mechanic', cwd: scene.cwd }),
      );

      then('it returns the rubrics.yml path', () => {
        expect(found.path).toContain(
          path.join('role=mechanic', 'briefs', 'reviews', 'rubrics.yml'),
        );
      });

      then('it returns the raw yml content', () => {
        expect(found.raw).toContain('slug: mech-failhides');
      });
    });
  });

  given('[case2] no role dir for the slug', () => {
    const scene = useThen('a repo with a different role exists', async () => {
      const cwd = await genTempRoleDir({
        repo: 'ehmpathy',
        role: 'mechanic',
        rubricsYml: 'rubrics: []',
      });
      return { cwd };
    });

    when('[t0] an absent role is looked up', () => {
      then('it throws role-not-found', async () => {
        // getError rethrows if NO error is thrown, so an unexpected pass fails loud — it does
        // not swallow like a hand-rolled try/catch would (rule.forbid.failhide)
        const error = await getError(
          getOneRoleReviewRubricsYml({ role: 'nonexistent', cwd: scene.cwd }),
        );
        expect(error.message).toContain(
          'role not found at .agent/repo=*/role=nonexistent',
        );
      });
    });
  });

  given('[case3] a role dir without a rubrics.yml', () => {
    const scene = useThen('the role dir exists but has no yml', async () => {
      const cwd = await genTempRoleDir({ repo: 'ehmpathy', role: 'architect' });
      return { cwd };
    });

    when('[t0] the role is looked up', () => {
      then('it throws rubrics-not-found', async () => {
        const error = await getError(
          getOneRoleReviewRubricsYml({ role: 'architect', cwd: scene.cwd }),
        );
        expect(error.message).toContain(
          'rubrics.yml not found for role architect',
        );
      });
    });
  });
});
