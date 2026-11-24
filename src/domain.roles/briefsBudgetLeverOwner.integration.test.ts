import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the roles under sweep: each ships briefs that name the urgent budget grant
 */
const DIRS_OF_BRIEFS: string[] = [
  path.join(__dirname, 'driver', 'briefs'),
  path.join(__dirname, 'reviewer', 'briefs'),
];

/**
 * .what = the claims, retired by this repo, that a human grants an urgent budget
 * .why = the grant is the driver's: `route.guard.budget` checks no actor, only the
 *        three-conjunct gate. a brief that names a human as the grantor teaches the
 *        driver to wait on a lever no human holds, so each claim is pinned absent
 */
const PHRASES_RETIRED: string[] = [
  'human budget grant',
  'budget hit needs a human',
  'the human grants more',
  'a human may grant regardless',
  "a human's glance",
  'ask the human for budget',
];

/**
 * .what = every brief file (.md and .md.min) under the swept roles
 */
const getAllBriefPaths = async (): Promise<string[]> => {
  const entries = await Promise.all(
    DIRS_OF_BRIEFS.map(async (dir) =>
      (await fs.readdir(dir, { recursive: true }))
        .filter((name) => name.endsWith('.md') || name.endsWith('.md.min'))
        .map((name) => path.join(dir, name)),
    ),
  );
  return entries.flat();
};

describe('briefsBudgetLeverOwner', () => {
  given('[case1] the driver and reviewer briefs, as shipped', () => {
    const scene = useBeforeAll(async () => {
      const paths = await getAllBriefPaths();
      const briefs = await Promise.all(
        paths.map(async (filePath) => ({
          filePath: path.relative(__dirname, filePath),
          content: (await fs.readFile(filePath, 'utf-8')).toLowerCase(),
        })),
      );
      return { briefs };
    });

    when('[t0] each brief is swept for a retired grantor claim', () => {
      then('the sweep covers both roles', () => {
        const roles = new Set(
          scene.briefs.map((brief) => brief.filePath.split(path.sep)[0]),
        );
        expect([...roles].sort()).toEqual(['driver', 'reviewer']);
      });

      PHRASES_RETIRED.map((phrase) =>
        then(`no brief claims "${phrase}"`, () => {
          const hits = scene.briefs
            .filter((brief) => brief.content.includes(phrase.toLowerCase()))
            .map((brief) => brief.filePath);
          expect(hits).toEqual([]);
        }),
      );
    });
  });
});
