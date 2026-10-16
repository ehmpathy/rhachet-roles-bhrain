import * as fs from 'fs/promises';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genReviewFileHeader } from '@src/domain.operations/review/genReviewFileHeader';
import { setReviewLaneOutcome } from '@src/domain.operations/review/setReviewLaneOutcome';

/**
 * .what = runs the leaf with stdout captured
 * .why = the tally on stdout is the guard's contract, so the test reads it byte for byte
 */
const runWithStdout = async (
  input: Parameters<typeof setReviewLaneOutcome>[0],
): Promise<{ outputAbsolute: string; stdout: string }> => {
  const lines: string[] = [];
  const spy = jest
    .spyOn(console, 'log')
    .mockImplementation((line: unknown) => void lines.push(String(line)));
  try {
    const { outputAbsolute } = await setReviewLaneOutcome(input);
    return { outputAbsolute, stdout: lines.join('\n') };
  } finally {
    spy.mockRestore();
  }
};

describe('setReviewLaneOutcome', () => {
  given('[case1] a lane whose spend was measured', () => {
    const cwd = genTempDir({ slug: 'lane-outcome-measured' });
    const logDir = path.join(
      cwd,
      '.log/bhrain/review/2026-10-08T00-00-00-000Z',
    );

    when('[t0] the lane ends', () => {
      const result = useThen('it writes and emits', async () =>
        runWithStdout({
          output: '.reviews/peer/report.md',
          cwd,
          logDir,
          body: '# blocker.1 — a real concern\n',
          summary: { blockersCount: 1, nitpicksCount: 2 },
          realized: {
            tokens: {
              input: 1000,
              inputCacheCreation: 200,
              inputCacheRead: 3000,
              output: 400,
            },
            cost: {
              input: asIsoPriceHuman('$0.01'),
              cacheWrite: asIsoPriceHuman('$0.002'),
              cacheRead: asIsoPriceHuman('$0.003'),
              output: asIsoPriceHuman('$0.004'),
              total: asIsoPriceHuman('$0.019'),
            },
            time: { seconds: 42 },
          },
        }),
      );

      then('it writes the report to --output, header first', async () => {
        expect(result.outputAbsolute).toEqual(
          path.join(cwd, '.reviews/peer/report.md'),
        );
        const written = await fs.readFile(result.outputAbsolute, 'utf-8');
        expect(written).toEqual(
          genReviewFileHeader({
            paths: {
              logsRelative: '.log/bhrain/review/2026-10-08T00-00-00-000Z',
              reviewRelative: '.reviews/peer/report.md',
            },
            summary: { blockersCount: 1, nitpicksCount: 2 },
          }) + '# blocker.1 — a real concern\n',
        );
      });

      then('it emits the two counts the guard reads', () => {
        expect(result.stdout).toContain('1 blocker');
        expect(result.stdout).toContain('2 nitpicks');
      });

      then('🔴 it states the time off the realized figures', () => {
        expect(result.stdout).toContain('42s');
      });

      then('the tally matches its snapshot', () => {
        expect(result.stdout.split(cwd).join('<cwd>')).toMatchSnapshot();
      });
    });
  });

  given('[case2] a lane whose spend was unmeasured', () => {
    const cwd = genTempDir({ slug: 'lane-outcome-unmeasured' });
    const logDir = path.join(
      cwd,
      '.log/bhrain/review/2026-10-08T00-00-01-000Z',
    );

    when('[t0] the lane ends', () => {
      const result = useThen('it writes and emits', async () =>
        runWithStdout({
          output: '.reviews/peer/report.md',
          cwd,
          logDir,
          body: '',
          summary: { blockersCount: 0, nitpicksCount: 0 },
          realized: { tokens: null, cost: null, time: { seconds: 7 } },
        }),
      );

      then('🔴 the cost renders absent, never low', () => {
        // no figure slot reads $0 — the `not $0` inside the caveat is the denial, never a figure
        expect(result.stdout).not.toMatch(/: \$\d/);
        expect(result.stdout).toContain(
          '├─ spend: unmeasured 🟡 the brain reported no usage — unknown, not $0',
        );
        expect(result.stdout.match(/unknown, not \$0/g)?.length).toEqual(1);
        expect(result.stdout).toContain('0 blockers');
        expect(result.stdout).toContain('0 nitpicks');
      });

      then('the tally matches its snapshot', () => {
        expect(result.stdout.split(cwd).join('<cwd>')).toMatchSnapshot();
      });
    });
  });
});
