import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getPassageStateWarnings } from './getPassageStateWarnings';

describe('getPassageStateWarnings.integration', () => {
  const scene = useBeforeAll(async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'test-passage-warn-'),
    );
    const routeDir = path.join(repoRoot, 'route');
    await fs.mkdir(path.join(routeDir, '.route'), { recursive: true });
    await fs.writeFile(
      path.join(routeDir, '.route', 'passage.jsonl'),
      [
        JSON.stringify({ stone: '5.1.passed', status: 'passed' }),
        JSON.stringify({ stone: '5.2.approved', status: 'approved' }),
      ].join('\n'),
    );
    return { repoRoot, routeDir };
  });

  afterAll(async () => {
    await fs.rm(scene.repoRoot, { recursive: true, force: true });
  });

  given('[case1] a stone that is already passed (N6)', () => {
    when('[t0] advisories are computed', () => {
      const result = useThen('they compute', async () => ({
        warnings: await getPassageStateWarnings({
          stone: '5.1.passed',
          route: scene.routeDir,
        }),
      }));

      then('one already-passed advisory is present', () => {
        expect(result.warnings).toEqual([
          { type: 'already-passed', stone: '5.1.passed' },
        ]);
      });
    });
  });

  given('[case2] a stone that is approved but not passed (i015)', () => {
    when('[t0] advisories are computed', () => {
      const result = useThen('they compute', async () => ({
        warnings: await getPassageStateWarnings({
          stone: '5.2.approved',
          route: scene.routeDir,
        }),
      }));

      then('one approved-not-passed advisory is present', () => {
        expect(result.warnings).toEqual([
          { type: 'approved-not-passed', stone: '5.2.approved' },
        ]);
      });
    });
  });

  given('[case3] a stone with no passage state', () => {
    when('[t0] advisories are computed', () => {
      const result = useThen('they compute', async () => ({
        warnings: await getPassageStateWarnings({
          stone: '9.fresh',
          route: scene.routeDir,
        }),
      }));

      then('there are no advisories', () => {
        expect(result.warnings).toEqual([]);
      });
    });
  });
});
