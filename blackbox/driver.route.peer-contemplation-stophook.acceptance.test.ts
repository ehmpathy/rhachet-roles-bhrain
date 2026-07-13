import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-contemplation');

/**
 * .what = extracts the shared reply-prompt block from a surface's stdout
 * .why = the three surfaces wrap the block differently (the guard tree on
 *        passed/arrived, raw on the stophook), so full-stdout equality is not
 *        the guarantee — the guarantee is that the SHARED formatter block is
 *        byte-identical everywhere (i5-item9, one formatter three surfaces)
 */
const extractReplyPrompt = (stdout: string): string => {
  const start = stdout.indexOf('🦉 the reviewers await your reply');
  if (start === -1) return '<no reply-prompt found>';
  const rest = stdout.slice(start);
  const endMarker = rest.indexOf('--as contemplated');
  const endOfLine = rest.indexOf('\n', endMarker);
  return endOfLine === -1 ? rest : rest.slice(0, endOfLine);
};

/**
 * .what = acceptance test for the three-surface reply-prompt identity (usecase 11)
 * .why = the halt experience must be consistent no matter which action the
 *        driver took — stophook, --as arrived, and --as passed all render the
 *        SAME reply-prompt from ONE shared formatter
 */
describe('driver.route.peer-contemplation-stophook.acceptance', () => {
  given('[case1] a stone blocked on an absent contemplation', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-stophook',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] the driver reaches the halt via all three surfaces', () => {
      const result = useThen('each surface emits the reply-prompt', async () => {
        // surface A: --as passed (also persists the contemplation blocker)
        const passed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // surface B: --as arrived (aliases to passed)
        const arrived = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'arrived' },
          cwd: scene.tempDir,
        });
        // surface C: the stophook (route.drive onStop reads the persisted blocker)
        const stophook = await invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.', when: 'hook.onStop' },
          cwd: scene.tempDir,
        });
        return { passed, arrived, stophook };
      });

      then('all three surfaces block (exit 2)', () => {
        expect(result.passed.code).toEqual(2);
        expect(result.arrived.code).toEqual(2);
        expect(result.stophook.code).toEqual(2);
      });

      then('each surface renders the reply-prompt', () => {
        expect(result.passed.stdout).toContain('the reviewers await your reply');
        expect(result.arrived.stdout).toContain('the reviewers await your reply');
        expect(result.stophook.stdout).toContain(
          'the reviewers await your reply',
        );
      });

      then('the reply-prompt block is byte-identical across all three', () => {
        const a = extractReplyPrompt(result.passed.stdout);
        const b = extractReplyPrompt(result.arrived.stdout);
        const c = extractReplyPrompt(result.stophook.stdout);
        expect(a).not.toEqual('<no reply-prompt found>');
        expect(b).toEqual(a);
        expect(c).toEqual(a);
      });

      then('the shared reply-prompt block matches snapshot', () => {
        expect(
          sanitizeTimeForSnapshot(extractReplyPrompt(result.passed.stdout)),
        ).toMatchSnapshot();
      });
    });
  });
});
