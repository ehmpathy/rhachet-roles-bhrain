import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllLatestPassageByStone } from './getAllLatestPassageByStone';

/**
 * .what = integration cases for getAllLatestPassageByStone
 * .why = the hook pre-check scans this to detect hard-stop halts; it MUST return true
 *        chronological last-per-stone (raw file order), NOT the sticky-re-bucketed output
 *        of getAllPassageReports — else a `[malfunction, approved]` stone yields a false
 *        malfunction halt after a human already approved
 */
const genRouteWithPassage = async (input: {
  lines: object[];
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-latest-passage-'));
  const passagePath = path.join(route, '.route', 'passage.jsonl');
  await fs.mkdir(path.dirname(passagePath), { recursive: true });
  await fs.writeFile(
    passagePath,
    input.lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
  );
  return { route };
};

describe('getAllLatestPassageByStone.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(
        path.join(os.tmpdir(), 'all-latest-none-'),
      );
      return { route };
    });

    when('[t0] the latest-per-stone is read', () => {
      then('returns an empty list', async () => {
        const latest = await getAllLatestPassageByStone({ route: scene.route });
        expect(latest).toEqual([]);
      });
    });
  });

  given('[case2] a stone with [malfunction, approved] in that order', () => {
    // the false-positive scenario: a human ran --as approved AFTER a malfunction. the true
    // latest is 'approved'. getAllPassageReports would emit BOTH an approved row and a
    // malfunction row; this op returns only the true-latest 'approved'.
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'malfunction' },
          { stone: '1.vision', status: 'approved' },
        ],
      }),
    );

    when('[t0] the latest-per-stone is read', () => {
      then('the one row is approved (no stale malfunction row)', async () => {
        const latest = await getAllLatestPassageByStone({ route: scene.route });
        expect(latest).toHaveLength(1);
        expect(latest[0]?.status).toEqual('approved');
        expect(latest.some((r) => r.status === 'malfunction')).toBe(false);
      });
    });
  });

  given('[case3] multiple stones, each with its own latest', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '2.plan', status: 'malfunction' },
          { stone: '1.vision', status: 'arrived' },
        ],
      }),
    );

    when('[t0] the latest-per-stone is read', () => {
      then('each stone reports its last file-order entry', async () => {
        const latest = await getAllLatestPassageByStone({ route: scene.route });
        const byStone = new Map(latest.map((r) => [r.stone, r.status]));
        expect(byStone.get('1.vision')).toEqual('arrived');
        expect(byStone.get('2.plan')).toEqual('malfunction');
      });
    });
  });
});
