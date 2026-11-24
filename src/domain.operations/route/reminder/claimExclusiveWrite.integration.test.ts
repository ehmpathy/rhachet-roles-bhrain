import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { claimExclusiveWrite } from './claimExclusiveWrite';

/**
 * .what = integration cases for the atomic claim beneath the pid handle and the crash-log slot
 * .why = a claim must publish its body whole or not at all: a file that exists before its body lands
 *        is a torn handle, and a torn handle wedges the clone's reminder. the claim also elects one
 *        writer, and leaves no temp file behind on a win or a loss
 */
describe('claimExclusiveWrite.integration', () => {
  given('[case1] an empty dir', () => {
    const scene = useBeforeAll(async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'claim-exclusive-'));
      return { dir, target: path.join(dir, 'x.pid') };
    });

    when('[t0] the first claim runs', () => {
      const result = useBeforeAll(async () =>
        claimExclusiveWrite({ path: scene.target, body: '4242' }),
      );

      then('it claims the path', () => {
        expect(result).toEqual({ claimed: true });
      });

      then('the target holds the whole body', async () => {
        expect(await fs.readFile(scene.target, 'utf-8')).toEqual('4242');
      });

      then('no temp file is left beside it', async () => {
        expect(await fs.readdir(scene.dir)).toEqual(['x.pid']);
      });
    });

    when('[t1] a second claim runs on the claimed path', () => {
      const result = useBeforeAll(async () =>
        claimExclusiveWrite({ path: scene.target, body: '9999' }),
      );

      then('it loses the claim', () => {
        expect(result).toEqual({ claimed: false });
      });

      then('the winner body is left as it was', async () => {
        expect(await fs.readFile(scene.target, 'utf-8')).toEqual('4242');
      });

      then('no temp file is left beside it', async () => {
        expect(await fs.readdir(scene.dir)).toEqual(['x.pid']);
      });
    });
  });

  given('[case2] many claims at once on one path', () => {
    const scene = useBeforeAll(async () => {
      const dir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'claim-exclusive-race-'),
      );
      return { dir, target: path.join(dir, 'x.pid') };
    });

    when('[t0] twenty claims race', () => {
      const result = useBeforeAll(async () => {
        const bodies = Array.from({ length: 20 }, (_, index) =>
          String(1000 + index),
        );
        const outcomes = await Promise.all(
          bodies.map((body) =>
            claimExclusiveWrite({ path: scene.target, body }),
          ),
        );
        return { bodies, outcomes };
      });

      then('exactly one claim wins', () => {
        expect(
          result.outcomes.filter((outcome) => outcome.claimed),
        ).toHaveLength(1);
      });

      then('the target holds one whole body of the racers', async () => {
        expect(result.bodies).toContain(
          await fs.readFile(scene.target, 'utf-8'),
        );
      });

      then('no temp file is left beside it', async () => {
        expect(await fs.readdir(scene.dir)).toEqual(['x.pid']);
      });
    });
  });
});
