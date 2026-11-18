import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import {
  FULCRUM_VERDICT_LEDGER_NAME,
  getAllFulcrumVerdictRows,
} from './getAllFulcrumVerdictRows';

/**
 * .what = writes a verdict ledger with the given lines into a temp route
 */
const genRouteWithLedger = async (input: {
  slug: string;
  lines: string[];
}): Promise<{ route: string }> => {
  const route = genTempDir({ slug: input.slug });
  await fs.mkdir(path.join(route, '.fulcrums'), { recursive: true });
  await fs.writeFile(
    path.join(route, '.fulcrums', FULCRUM_VERDICT_LEDGER_NAME),
    `${input.lines.join('\n')}\n`,
  );
  return { route };
};

// .note = each result rides in an object: `useThen` holds a record, so a bare array or error
//         would lose its shape
describe('getAllFulcrumVerdictRows', () => {
  given('[case1] a ledger the lever wrote', () => {
    when('[t0] the rows are read', () => {
      const result = useThen('it reads each row', async () => {
        const scene = await genRouteWithLedger({
          slug: 'verdict-ledger-clean',
          lines: [
            '{"case":"F44","ruled":"upheld","on":"2026-11-17"}',
            '',
            '{"case":"F47","ruled":"conceded","on":"2026-11-17"}',
          ],
        });
        return { rows: await getAllFulcrumVerdictRows({ route: scene.route }) };
      });

      then('each row is returned, blank lines skipped', () => {
        expect(result.rows).toEqual([
          { case: 'F44', ruled: 'upheld', on: '2026-11-17' },
          { case: 'F47', ruled: 'conceded', on: '2026-11-17' },
        ]);
      });
    });
  });

  given('[case2] a route with no ledger', () => {
    when('[t0] the rows are read', () => {
      const result = useThen('it reads no rows', async () => ({
        rows: await getAllFulcrumVerdictRows({
          route: genTempDir({ slug: 'verdict-ledger-absent' }),
        }),
      }));

      then('no rows are returned', () => {
        expect(result.rows).toEqual([]);
      });
    });
  });

  given('[case3] a ledger with a line that is not json', () => {
    when('[t0] the rows are read', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithLedger({
          slug: 'verdict-ledger-malformed',
          lines: [
            '{"case":"F44","ruled":"upheld","on":"2026-11-17"}',
            '{"case":"F47",',
          ],
        });
        const error = await getError(
          getAllFulcrumVerdictRows({ route: scene.route }),
        );
        return { message: error.message.split(scene.route).join(`<route>`) };
      });

      then('the refusal names the line and how to restore it', () => {
        expect(result.message).toContain('unreadable row at line 2');
        expect(result.message).toContain('restore the line from git');
      });

      then('the refusal a human reads is pinned', () => {
        expect(result.message).toMatchSnapshot();
      });
    });
  });

  given('[case4] a ledger row with a verdict outside its closed set', () => {
    when('[t0] the rows are read', () => {
      const result = useThen('it is refused', async () => {
        const scene = await genRouteWithLedger({
          slug: 'verdict-ledger-shape',
          lines: ['{"case":"F44","ruled":"waived","on":"2026-11-17"}'],
        });
        const error = await getError(
          getAllFulcrumVerdictRows({ route: scene.route }),
        );
        return { message: error.message.split(scene.route).join(`<route>`) };
      });

      then('the row is never trusted as a proof', () => {
        expect(result.message).toContain('unreadable row at line 1');
      });

      then('the refusal a human reads is pinned', () => {
        expect(result.message).toMatchSnapshot();
      });
    });
  });
});
