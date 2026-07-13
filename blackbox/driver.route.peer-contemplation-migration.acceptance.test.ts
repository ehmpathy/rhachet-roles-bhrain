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
 * .what = acceptance test for graceful in-flight migration (usecase 14)
 * .why = a stone mid-flight when this ships may hold a .given written under the
 *        old rules (no .taken ever expected). the gate is HASH-SCOPED, so a
 *        prior .given sits at a PRIOR hash and is treated as prior-generation —
 *        the guard re-runs at the current hash and the standard reply-prompt
 *        guides the driver. no hard-fail, no crash (design-note B9)
 */
describe('driver.route.peer-contemplation-migration.acceptance', () => {
  given('[case1] a stone that already holds a prior-hash .given from before', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-migration',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );

      // seed a prior .given at a fake PRIOR hash, with NO paired taken —
      // as if written before this feature shipped
      const peerDir = path.join(tempDir, '.reviews', 'peer');
      await fs.mkdir(peerDir, { recursive: true });
      await fs.writeFile(
        path.join(
          peerDir,
          '1.execute._.review.i001.bbbbbbbb.r001._.given.by_peer.architect.md',
        ),
        '---\nblockers: 1\nnitpicks: 0\n---\narchitect: the design lacks a bounded context\n\n## blockers\n- the design lacks a bounded context\n',
      );

      return { tempDir };
    });

    when('[t0] driver attempts --as passed', () => {
      const result = useThen('the guard re-runs at the current hash', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the stone does not hard-fail — a normal contemplation block (exit 2)', () => {
        // exit 2 = constraint (the standard contemplation gate), NOT exit 1
        // (a malfunction/crash from the prior-generation seeded given)
        expect(result.code).toEqual(2);
      });

      then('the standard reply-prompt guides the driver', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('the guide points at the current iteration, not the seeded prior hash', () => {
        // the articulate-into path is for the freshly re-run given, never bbbbbbbb
        expect(result.stdout).not.toContain('bbbbbbbb');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
