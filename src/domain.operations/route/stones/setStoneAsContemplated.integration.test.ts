import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';
import { setStoneAsContemplated } from './setStoneAsContemplated';

/**
 * .what = builds a temp route with a guarded stone + a current-hash given/taken
 * .why = setStoneAsContemplated needs a real stone, guard (peer slug), and given
 */
const genScene = async (): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'int-set-contempl-'));

  // stone artifact + stone file + guard with one peer reviewer
  await fs.writeFile(path.join(route, '1.vision.yield.md'), '# vision\n');
  await fs.writeFile(path.join(route, '1.vision.stone'), 'do the task\n');
  await fs.writeFile(
    path.join(route, '1.vision.guard'),
    `reviews:
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
  );

  // learn the current hash the gate will recompute
  const stones = await getAllStones({ route });
  const stone = findOneStoneByPattern({ stones, pattern: '1.vision' })!;
  const hashCurrent = await computeStoneReviewInputHash({ stone, route });

  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  // a current-hash given + the paired current-hash taken
  await fs.writeFile(
    path.join(
      reviewsDir,
      `1.vision._.review.i001.${hashCurrent}.r001._.given.by_peer.architect.md`,
    ),
    `2 blockers\n1 nitpicks\n`,
  );
  await fs.writeFile(
    path.join(
      reviewsDir,
      `1.vision._.review.i001.${hashCurrent}.r001._.taken.by_self.architect.md`,
    ),
    'fixed by X\n',
  );

  return { route };
};

/**
 * .what = integration coverage for setStoneAsContemplated's passage-entry write
 * .why = forward-motion-clears-blocker requires --as contemplated to write a
 *        passage entry (not only a .taken) so a stale halt clears. this touches
 *        the real filesystem (.route/passage.jsonl), so it lives here, not in the
 *        unit suite (rule.forbid.unit.remote-boundaries).
 */
describe('setStoneAsContemplated.integration', () => {
  given('[case1] forward motion clears a prior blocker', () => {
    const scene = useBeforeAll(async () => genScene());

    when(
      '[t0] a stone was escalated --as blocked, then --as contemplated',
      () => {
        then(
          'passage.jsonl gains a contemplated entry that supersedes the blocked halt',
          async () => {
            // seed a prior driver-wall escalation (blocked) as the latest entry
            const passagePath = path.join(
              scene.route,
              '.route',
              'passage.jsonl',
            );
            await fs.mkdir(path.dirname(passagePath), { recursive: true });
            await fs.writeFile(
              passagePath,
              JSON.stringify({ stone: '1.vision', status: 'blocked' }) + '\n',
            );

            const result = await setStoneAsContemplated({
              stone: '1.vision',
              route: scene.route,
              slug: 'architect',
            });
            expect(result.contemplated).toBe(true);

            // the LATEST passage entry is now 'contemplated' (forward motion supersedes)
            const content = await fs.readFile(passagePath, 'utf-8');
            const entries = content
              .trim()
              .split('\n')
              .map((line) => JSON.parse(line));
            const latest = entries[entries.length - 1];
            expect(latest.status).toEqual('contemplated');
            expect(latest.stone).toEqual('1.vision');
          },
        );
      },
    );
  });
});
