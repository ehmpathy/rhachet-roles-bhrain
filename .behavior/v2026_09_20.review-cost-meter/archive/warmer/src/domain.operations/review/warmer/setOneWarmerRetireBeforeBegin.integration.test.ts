import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { NAME_OF_WARMER_ROWS } from './setOneWarmerPokeRow';
import { setOneWarmerRetireBeforeBegin } from './setOneWarmerRetireBeforeBegin';
import type { WarmerClock } from './WarmerClock';

/**
 * .what = a clock pinned to one instant
 * .why = the row's `at` is the measurement, so the test pins it to assert it exactly
 */
const CLOCK_OF_TEST: WarmerClock = {
  now: () => new Date('2026-10-09T12:00:00.000Z'),
  sleep: async () => undefined,
};

describe('setOneWarmerRetireBeforeBegin', () => {
  given('[case1] a warmer whose plan could not begin', () => {
    const scene = useBeforeAll(async () => {
      const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'warmer-retire-'));
      const logDir = path.join(cwd, '.log/bhrain/review/run-1');
      return { cwd, logDir };
    });

    when('[t0] the retire is recorded', () => {
      const ledger = useBeforeAll(async () => {
        setOneWarmerRetireBeforeBegin(
          {
            cwd: scene.cwd,
            reviewer: 'demo-lane',
            logDir: scene.logDir,
            why: 'the warmer could not boot its brain, so it cost naught — offline',
          },
          { clock: CLOCK_OF_TEST },
        );
        const rows = fs
          .readFileSync(path.join(scene.logDir, NAME_OF_WARMER_ROWS), 'utf-8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as Record<string, unknown>);
        return { rows };
      });

      then(
        '🔴 the ledger holds exactly one terminal retire row at attempt 0',
        () => {
          expect(ledger.rows).toEqual([
            {
              at: '2026-10-09T12:00:00.000Z',
              reviewer: 'demo-lane',
              attempt: 0,
              act: 'retire',
              why: 'the warmer could not boot its brain, so it cost naught — offline',
              measured: null,
            },
          ]);
        },
      );
    });
  });
});
