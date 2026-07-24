import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';

/**
 * .what = integration cases for getAllPassageReportsRaw
 * .why = this is the ONE shared parser the three passage reads build on
 *        (getLatestPassageForStone, getAllLatestPassageByStone, getAllPassageReports).
 *        it must return entries VERBATIM in file order — no dedup, no re-bucket — so the
 *        three consumers can each apply their own reduction without a divergent parse.
 */
const genRouteWithPassage = async (input: {
  lines: object[];
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-passage-raw-'));
  const passagePath = path.join(route, '.route', 'passage.jsonl');
  await fs.mkdir(path.dirname(passagePath), { recursive: true });
  await fs.writeFile(
    passagePath,
    input.lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
  );
  return { route };
};

describe('getAllPassageReportsRaw.integration', () => {
  given('[case1] no passage file exists', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'all-raw-none-'));
      return { route };
    });

    when('[t0] the raw entries are read', () => {
      then('returns an empty list', async () => {
        const raw = await getAllPassageReportsRaw({ route: scene.route });
        expect(raw).toEqual([]);
      });
    });
  });

  given('[case2] a file with repeated + sticky-kind entries', () => {
    // the raw read must NOT dedup or re-bucket: every line comes back, in order
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '1.vision', status: 'blocked' },
          { stone: '1.vision', status: 'approved' },
          { stone: '2.plan', status: 'malfunction' },
          { stone: '1.vision', status: 'passed' },
        ],
      }),
    );

    when('[t0] the raw entries are read', () => {
      then('returns every entry verbatim, in file order', async () => {
        const raw = await getAllPassageReportsRaw({ route: scene.route });
        expect(raw).toHaveLength(4);
        expect(raw.map((r) => [r.stone, r.status])).toEqual([
          ['1.vision', 'blocked'],
          ['1.vision', 'approved'],
          ['2.plan', 'malfunction'],
          ['1.vision', 'passed'],
        ]);
      });
    });
  });
});
