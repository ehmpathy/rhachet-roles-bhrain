import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderRepoRoot } from './getRouteReminderRepoRoot';

/**
 * .what = integration cases for getRouteReminderRepoRoot — the one anchor every clone handle sits under
 * .why = the drive sync anchors on its route, the cli on its cwd, the daemon on its --repo-root.
 *        they agree only if every path inside one repo maps to one dir, and a path outside any repo
 *        maps to itself, absolute. these cases clamp both, against the real git lookup
 */
describe('getRouteReminderRepoRoot.integration', () => {
  given('[case1] a dir deep inside this git repo', () => {
    when(
      '[t0] the anchor is read from the subdir and from the repo root',
      () => {
        then('both map to the one git root', async () => {
          const repoRoot = await getGitRepoRoot({ from: process.cwd() });
          const route = path.join(repoRoot, 'src', 'domain.operations');
          expect(await getRouteReminderRepoRoot({ from: route })).toEqual(
            repoRoot,
          );
          expect(await getRouteReminderRepoRoot({ from: repoRoot })).toEqual(
            repoRoot,
          );
        });
      },
    );
  });

  given('[case2] a dir in no git repo, named by a relative path', () => {
    const scene = useBeforeAll(async () => {
      const dirAbsolute = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-anchor-'),
      );
      return {
        dirAbsolute,
        dirRelative: path.relative(process.cwd(), dirAbsolute),
      };
    });

    when('[t0] the anchor is read', () => {
      then('it is the dir itself, in absolute form', async () => {
        expect(
          await getRouteReminderRepoRoot({ from: scene.dirRelative }),
        ).toEqual(scene.dirAbsolute);
      });
    });
  });
});
