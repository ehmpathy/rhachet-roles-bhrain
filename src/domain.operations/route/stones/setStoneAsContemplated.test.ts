import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';
import { setStoneAsContemplated } from './setStoneAsContemplated';

/**
 * .what = builds a temp route with a guarded stone + a current-hash given
 * .why = setStoneAsContemplated needs a real stone, guard (peer slug), and given
 */
const genScene = async (input: {
  taken: 'none' | 'current';
  blockers?: number;
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-set-contempl-'));

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

  // a current-hash given; blockers default to 2, or 0 for a clean reviewer
  const blockers = input.blockers ?? 2;
  await fs.writeFile(
    path.join(
      reviewsDir,
      `1.vision._.review.i001.${hashCurrent}.r001._.given.by_peer.architect.md`,
    ),
    `${blockers} blockers\n1 nitpicks\n`,
  );

  // optionally the paired current-hash taken
  if (input.taken === 'current')
    await fs.writeFile(
      path.join(
        reviewsDir,
        `1.vision._.review.i001.${hashCurrent}.r001._.taken.by_self.architect.md`,
      ),
      'fixed by X\n',
    );

  return { route };
};

describe('setStoneAsContemplated', () => {
  given('[case1] the .taken is absent', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'none' }));

    when('[t0] --as contemplated --that architect', () => {
      then('blocks with crystal-clear absent guidance', async () => {
        const result = await setStoneAsContemplated({
          stone: '1.vision',
          route: scene.route,
          slug: 'architect',
        });
        expect(result.contemplated).toBe(false);
        expect(result.emit?.stdout).toContain(
          'contemplation absent for reviewer architect',
        );
        expect(result.emit?.stdout).toContain('_.taken.by_self.architect.md');
      });
    });
  });

  given('[case2] the .taken is present at the current hash', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'current' }));

    when('[t0] --as contemplated --that architect', () => {
      then(
        'acknowledges the contemplation as a recorded response',
        async () => {
          const result = await setStoneAsContemplated({
            stone: '1.vision',
            route: scene.route,
            slug: 'architect',
          });
          expect(result.contemplated).toBe(true);
          expect(result.emit?.stdout).toContain('contemplated: architect');
          // a real .taken exists → the ack must claim the response is recorded
          expect(result.emit?.stdout).toContain('your response is recorded');
        },
      );
    });
  });

  given('[case4] a clean reviewer (0 blockers) with no .taken', () => {
    const scene = useBeforeAll(async () =>
      genScene({ taken: 'none', blockers: 0 }),
    );

    when('[t0] --as contemplated --that architect', () => {
      then(
        'acknowledges without a false "recorded" claim — no critique to answer',
        async () => {
          const result = await setStoneAsContemplated({
            stone: '1.vision',
            route: scene.route,
            slug: 'architect',
          });
          // clean reviewer is ready without a .taken (B7 / usecase 5)
          expect(result.contemplated).toBe(true);
          expect(result.emit?.stdout).toContain('contemplated: architect');
          // the ack must NOT claim a response was recorded — none was written
          expect(result.emit?.stdout).not.toContain(
            'your response is recorded',
          );
          expect(result.emit?.stdout).toContain('raised no blockers');
        },
      );
    });
  });

  given('[case3] an invalid --that slug', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'none' }));

    when('[t0] --as contemplated --that ghost', () => {
      then(
        'throws a BadRequestError that lists the valid peer slugs',
        async () => {
          await expect(
            setStoneAsContemplated({
              stone: '1.vision',
              route: scene.route,
              slug: 'ghost',
            }),
          ).rejects.toThrow('architect');
        },
      );
    });
  });
});
