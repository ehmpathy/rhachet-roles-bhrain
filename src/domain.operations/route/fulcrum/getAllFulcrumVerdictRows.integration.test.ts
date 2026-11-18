import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { FULCRUM_VERDICT_LEDGER_NAME } from './FULCRUM_VERDICT_LEDGER_NAME';
import { getAllFulcrumVerdictRows } from './getAllFulcrumVerdictRows';
import { getAllFulcrumVerdictRowsOrDefect } from './getAllFulcrumVerdictRowsOrDefect';

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

const LINE_F44 = JSON.stringify({
  case: 'F44',
  ruled: 'upheld',
  on: '2026-11-17',
  seen: 'hash-read',
});
const LINE_F47 = JSON.stringify({
  case: 'F47',
  ruled: 'conceded',
  on: '2026-11-17',
  seen: 'hash-read',
});

// .note = each result rides in an object: `useThen` holds a record, so a bare array or error
//         would lose its shape
describe('getAllFulcrumVerdictRows', () => {
  given('[case1] a ledger the lever wrote', () => {
    when('[t0] the rows are read', () => {
      const result = useThen('it reads each row', async () => {
        const scene = await genRouteWithLedger({
          slug: 'verdict-ledger-clean',
          lines: [LINE_F44, '', LINE_F47],
        });
        return { rows: await getAllFulcrumVerdictRows({ route: scene.route }) };
      });

      then('each row is returned, blank lines skipped', () => {
        expect(result.rows).toEqual([
          { case: 'F44', ruled: 'upheld', on: '2026-11-17', seen: 'hash-read' },
          {
            case: 'F47',
            ruled: 'conceded',
            on: '2026-11-17',
            seen: 'hash-read',
          },
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
          lines: [LINE_F44, '{"case":"F47",'],
        });
        const error = await getError(
          getAllFulcrumVerdictRows({ route: scene.route }),
        );
        const readout = await getAllFulcrumVerdictRowsOrDefect({
          route: scene.route,
        });
        return {
          message: error.message.split(scene.route).join(`<route>`),
          readout,
        };
      });

      then('the refusal names the line and how to restore it', () => {
        expect(result.message).toContain('unreadable row at line 2');
        expect(result.message).toContain('restore the line from git');
      });

      then('the defect reader returns it as data, never a throw', () => {
        expect(result.readout.rows).toEqual(null);
        expect(result.readout.defect).toContain('unreadable row at line 2');
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
          lines: [
            JSON.stringify({
              case: 'F44',
              ruled: 'waived',
              on: '2026-11-17',
              seen: 'hash-read',
            }),
          ],
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

  given('[case5] a ledger row with no content hash', () => {
    when('[t0] the rows are read', () => {
      then(
        '🔴 the row is never trusted: a verdict must bind to what the human read',
        async () => {
          const scene = await genRouteWithLedger({
            slug: 'verdict-ledger-unseen',
            lines: [
              JSON.stringify({
                case: 'F44',
                ruled: 'upheld',
                on: '2026-11-17',
              }),
            ],
          });
          const error = await getError(
            getAllFulcrumVerdictRows({ route: scene.route }),
          );
          expect(error.message).toContain('unreadable row at line 1');
        },
      );
    });
  });
});
