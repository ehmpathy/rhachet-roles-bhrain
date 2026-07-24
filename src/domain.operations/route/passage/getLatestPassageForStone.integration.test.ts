import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getLatestPassageForStone } from './getLatestPassageForStone';

/**
 * .what = integration cases for getLatestPassageForStone
 * .why = this op is the single source the disposition + blocker reads use; it MUST return
 *        the true chronological latest (raw file order), NOT the sticky-re-bucketed order
 *        that getAllPassageReports returns — else the approve-then-wait window shows a stale
 *        'blocked' after a human already approved (the r011 bug this op fixes)
 */
const genRouteWithPassage = async (input: {
  lines: object[];
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'latest-passage-'));
  const passagePath = path.join(route, '.route', 'passage.jsonl');
  await fs.mkdir(path.dirname(passagePath), { recursive: true });
  await fs.writeFile(
    passagePath,
    input.lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
  );
  return { route };
};

describe('getLatestPassageForStone.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'latest-none-'));
      return { route };
    });

    when('[t0] the latest passage is read', () => {
      then('returns null', async () => {
        const latest = await getLatestPassageForStone({
          stone: '1.vision',
          route: scene.route,
        });
        expect(latest).toBeNull();
      });
    });
  });

  given(
    '[case2] the approve-then-wait window: blocked(approval) then approved, no later write',
    () => {
      // the flagship flow the vision names: a human runs --as approved to clear an approval
      // block, then waits. the true-latest is 'approved'. getAllPassageReports would
      // re-bucket to [approved, blocked] and a .pop() would wrongly return 'blocked' — this
      // op reads raw file order, so it returns the true-latest 'approved'.
      const scene = useBeforeAll(async () =>
        genRouteWithPassage({
          lines: [
            { stone: '1.vision', status: 'blocked', blocker: 'approval' },
            { stone: '1.vision', status: 'approved' },
          ],
        }),
      );

      when('[t0] the latest passage is read', () => {
        then(
          'returns the chronological latest (approved, not the stale blocked)',
          async () => {
            const latest = await getLatestPassageForStone({
              stone: '1.vision',
              route: scene.route,
            });
            expect(latest?.status).toEqual('approved');
            expect(latest?.status).not.toEqual('blocked');
          },
        );
      });
    },
  );

  given('[case3] multiple stones interleaved', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '2.plan', status: 'arrived' },
          {
            stone: '1.vision',
            status: 'arrived',
            reason: 'entered guard reviews',
          },
        ],
      }),
    );

    when('[t0] the latest for 1.vision is read', () => {
      then('returns its last entry in file order (arrived)', async () => {
        const latest = await getLatestPassageForStone({
          stone: '1.vision',
          route: scene.route,
        });
        expect(latest?.status).toEqual('arrived');
      });
    });
  });
});
