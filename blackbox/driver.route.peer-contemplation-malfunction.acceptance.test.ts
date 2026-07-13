import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-malfunction');

/**
 * .what = acceptance test that a malfunction outranks the contemplation gate (usecase 13)
 * .why = a reviewer whose verdict is unparseable is a malfunction; the guard
 *        cannot infer zero and cannot ask a driver to contemplate an unreadable
 *        critique. the malfunction halt must take priority — never a "contemplate
 *        this" prompt (design-note B5, precedence: malfunction > contemplation)
 */
describe('driver.route.peer-contemplation-malfunction.acceptance', () => {
  given('[case1] a stone gated on a reviewer that emits no numeric counts', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-malfunction',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-malfunction.sh', {
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] driver attempts --as passed', () => {
      const result = useThen('the guard runs the reviewer', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the stone is halted (non-zero), not passed', () => {
        expect(result.code).not.toEqual(0);
      });

      then('no contemplation reply-prompt is shown', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('the malfunction is surfaced', () => {
        const output = result.stdout + result.stderr;
        expect(output.toLowerCase()).toContain('malfunction');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
