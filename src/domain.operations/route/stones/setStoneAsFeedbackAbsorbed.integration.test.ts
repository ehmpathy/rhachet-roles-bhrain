import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';
import { setStoneAsConcernAbsorbed } from './setStoneAsConcernAbsorbed';
import { setStoneAsFeedbackAbsorbed } from './setStoneAsFeedbackAbsorbed';

/**
 * .what = absorbs every concern this scene's given raised — three concedes
 * .why = the composition gate (define.invariant.review.peer.absorb) refuses --as absorbed
 *        while any concern stands un-absorbed. the given raises 2 blockers + 1 nitpick, so
 *        the feedback act is reachable only after all three carry a disposition.
 */
const concedeAllConcerns = async (input: { route: string }): Promise<void> => {
  for (const about of ['blocker.1', 'blocker.2', 'nitpick.1']) {
    await setStoneAsConcernAbsorbed({
      stone: '1.vision',
      route: input.route,
      as: 'conceded',
      with: 'architect',
      about,
      severity: 'better',
    });
  }
};

/**
 * .what = builds a temp route with a guarded stone + a current-hash given/taken
 * .why = setStoneAsFeedbackAbsorbed needs a real stone, guard (peer slug), and given
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
 * .what = integration coverage for setStoneAsFeedbackAbsorbed's passage-entry write
 * .why = forward-motion-clears-blocker requires --as absorbed to write a
 *        passage entry (not only a .taken) so a stale halt clears. this touches
 *        the real filesystem (.route/passage.jsonl), so it lives here, not in the
 *        unit suite (rule.forbid.unit.remote-boundaries).
 */
describe('setStoneAsFeedbackAbsorbed.integration', () => {
  given('[case1] forward motion clears a prior blocker', () => {
    const scene = useBeforeAll(async () => genScene());

    when('[t0] a stone was escalated --as blocked, then --as absorbed', () => {
      then(
        'passage.jsonl gains an absorbed entry that supersedes the blocked halt',
        async () => {
          // seed a prior driver-wall escalation (blocked) as the latest entry
          const passagePath = path.join(scene.route, '.route', 'passage.jsonl');
          await fs.mkdir(path.dirname(passagePath), { recursive: true });
          await fs.writeFile(
            passagePath,
            JSON.stringify({ stone: '1.vision', status: 'blocked' }) + '\n',
          );

          // absorb every concern first — the composition gate requires it before the
          // feedback-grain --as absorbed act (define.invariant.review.peer.absorb)
          await concedeAllConcerns({ route: scene.route });

          const result = await setStoneAsFeedbackAbsorbed({
            stone: '1.vision',
            route: scene.route,
            slug: 'architect',
          });
          expect(result.absorbed).toBe(true);

          // the LATEST passage entry is now 'absorbed' (forward motion supersedes)
          const content = await fs.readFile(passagePath, 'utf-8');
          const entries = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
          const latest = entries[entries.length - 1];
          expect(latest.status).toEqual('absorbed');
          expect(latest.stone).toEqual('1.vision');
        },
      );
    });
  });

  // 🔴 the clamp for the COMPOSITION gate (rule.require.clamp-edge-cases): --as absorbed is
  //    refused while any concern of that reviewer's given stands un-absorbed. red before the
  //    gate (the .taken was present, so the old code returned absorbed:true), green after.
  given(
    '[case2] the composition gate refuses feedback while a concern is un-absorbed',
    () => {
      const scene = useBeforeAll(async () => genScene());

      when(
        '[t0] --as absorbed runs with the .taken present but no concern absorbed',
        () => {
          then('it throws, and lists the un-absorbed concerns', async () => {
            const error = await getError(
              setStoneAsFeedbackAbsorbed({
                stone: '1.vision',
                route: scene.route,
                slug: 'architect',
              }),
            );
            expect(error).toBeTruthy();
            expect(error.message).toContain(
              'absorb each concern before you absorb',
            );
            expect(error.message).toContain('architect');
            expect(error.message).toContain('blocker.1');
            expect(error.message).toContain('blocker.2');
            expect(error.message).toContain('nitpick.1');
          });
        },
      );

      when('[t1] every concern is absorbed first, THEN --as absorbed', () => {
        then('the gate opens and the feedback is absorbed', async () => {
          await concedeAllConcerns({ route: scene.route });
          const result = await setStoneAsFeedbackAbsorbed({
            stone: '1.vision',
            route: scene.route,
            slug: 'architect',
          });
          expect(result.absorbed).toBe(true);
        });
      });
    },
  );
});
