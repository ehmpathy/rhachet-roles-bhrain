import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setStoneAsPromised } from './setStoneAsPromised';

/**
 * .what = integration coverage for setStoneAsPromised's passage-entry write
 * .why = forward-motion-clears-blocker requires --as promised to write a passage
 *        entry (not only a promise artifact) so a stale halt clears. this touches
 *        the real filesystem (.route/passage.jsonl), so it lives here, not in the
 *        unit suite (rule.forbid.unit.remote-boundaries).
 */
describe('setStoneAsPromised.integration', () => {
  given('[case1] forward motion clears a prior blocker', () => {
    when('[t0] a stone was escalated --as blocked, then --as promised', () => {
      const tempDir = path.join(os.tmpdir(), `int-set-promise-${Date.now()}-1`);

      then(
        'passage.jsonl gains a promised entry that supersedes the blocked halt',
        async () => {
          // seed a prior driver-wall escalation (blocked) as the latest entry
          const routeDir = path.join(tempDir, '.route');
          await fs.mkdir(routeDir, { recursive: true });
          await fs.writeFile(
            path.join(routeDir, 'passage.jsonl'),
            JSON.stringify({ stone: '1.vision', status: 'blocked' }) + '\n',
          );

          const stone = new RouteStone({
            name: '1.vision',
            path: '1.vision.stone',
            guard: null,
          });
          await setStoneAsPromised({
            stone,
            slug: 'slug-a',
            route: tempDir,
          });

          // the LATEST passage entry is now 'promised' (forward motion supersedes)
          const content = await fs.readFile(
            path.join(routeDir, 'passage.jsonl'),
            'utf-8',
          );
          const entries = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
          const latest = entries[entries.length - 1];
          expect(latest.status).toEqual('promised');
          expect(latest.stone).toEqual('1.vision');

          // cleanup
          await fs.rm(tempDir, { recursive: true, force: true });
        },
      );
    });
  });
});
