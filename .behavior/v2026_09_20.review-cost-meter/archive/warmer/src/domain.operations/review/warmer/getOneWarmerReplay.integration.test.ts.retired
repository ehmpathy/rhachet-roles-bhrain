import * as fs from 'fs';
import { BadRequestError, getError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getOneWarmerReplay } from './getOneWarmerReplay';

/**
 * .what = writes a run's log dir, with or without the prompt head
 * .why = the filename is LITERAL here, never read from `NAME_OF_RUN_ARTIFACT`, so a
 *        rename of the map cannot drag the fixture along with it and stay green
 */
const setOneRunLogDir = (input: { cwd: string; head: boolean }): string => {
  const logDir = path.join(input.cwd, '.log', 'bhrain', 'review', 'run-1');
  fs.mkdirSync(logDir, { recursive: true });
  if (input.head)
    fs.writeFileSync(path.join(logDir, 'input.prompt.head.md'), '# rules\n');
  return logDir;
};

describe('getOneWarmerReplay', () => {
  given('[case1] a run that left its prompt head', () => {
    const scene = useBeforeAll(async () => ({
      logDir: setOneRunLogDir({
        cwd: genTempDir({ slug: 'warmer-replayable-head' }),
        head: true,
      }),
    }));

    when('[t0] the probe runs', () => {
      then('it is replayable, at the head path', () => {
        const result = getOneWarmerReplay({ logDir: scene.logDir });
        expect(result.replayable).toEqual(true);
        expect(result.pathOfHead).toContain('input.prompt.head.md');
      });
    });
  });

  given('[case2] a run that left no prompt head', () => {
    const scene = useBeforeAll(async () => ({
      logDir: setOneRunLogDir({
        cwd: genTempDir({ slug: 'warmer-replayable-absent' }),
        head: false,
      }),
    }));

    when('[t0] the probe runs', () => {
      then('it is not replayable, and names the path it did not find', () => {
        const result = getOneWarmerReplay({ logDir: scene.logDir });
        expect(result.replayable).toEqual(false);
        expect(result.pathOfHead).toContain('input.prompt.head.md');
      });
    });
  });

  /**
   * .what = a head that sits in a dir the probe may not traverse
   * .why = the clamp for the `existsSync` defect: `existsSync` answers false here,
   *        which refuses the warmer with "no prompt head" over a file that is present.
   *        a denial is a defect, never an absence, so the probe must surface it
   */
  given('[case3] a run whose log dir is barred', () => {
    const scene = useBeforeAll(async () => {
      // root reads a mode-000 dir, so no denial occurs — refuse by name
      if (process.getuid?.() === 0)
        throw new BadRequestError(
          'case3 needs a non-root user — root reads a mode-000 dir, so no denial occurs',
          { uid: 0, hint: 'run the integration suite as a non-root user' },
        );

      const logDir = setOneRunLogDir({
        cwd: genTempDir({ slug: 'warmer-replayable-barred' }),
        head: true,
      });
      fs.chmodSync(logDir, 0o000);
      return { logDir };
    });
    afterAll(() => fs.chmodSync(scene.logDir, 0o755));

    when('[t0] the probe runs', () => {
      then('it surfaces the denial rather than report the head absent', () => {
        const error = getError(() =>
          getOneWarmerReplay({ logDir: scene.logDir }),
        );
        expect(JSON.stringify(error)).toContain('EACCES');
      });
    });
  });
});
