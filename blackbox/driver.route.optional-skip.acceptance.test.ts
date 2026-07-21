import * as fs from 'fs/promises';
import * as path from 'path';

import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-optional-skip');

/**
 * .what = e2e proof of issue #325: a stone whose peer guard runs the REAL review skill with an
 *         empty rules glob under `--optional rules` PROCEEDS, rather than blocks.
 * .why = the isolated review acceptance tests prove the skill emits 0/0 + exit 0 on skip; the
 *        peer-budget tests prove a guard tallies a 0/0 reviewer as approved. this test wires
 *        the two together end-to-end — the real skill's skip output, read by a real guard,
 *        unblocks a real stone. this is the exact level the bug report lived at (r10 blocker.3).
 *
 * .note = the skip returns before any brain.choice.ask(), so the review invokes no LLM and is
 *         deterministic — no when.repeatably needed. brain packages are symlinked only because
 *         genContextBrain does in-process discovery (no network) before stepReview.
 */
describe('driver.route.optional-skip.acceptance', () => {
  given('[case1] a stone whose peer guard reviews with empty rules + --optional rules', () => {
    const scene = useBeforeAll(async () => {
      // .why = the route harness symlinks the driver role but not brain packages; the review
      //        skill's genContextBrain discovery needs them, so union both symlink sets here
      const tempDir = genTempDir({
        slug: 'route-optional-skip',
        clone: ASSETS_DIR,
        git: true,
        symlink: [
          {
            at: 'node_modules/rhachet-roles-bhrain/package.json',
            to: 'package.json',
          },
          { at: 'node_modules/rhachet-roles-bhrain/dist', to: 'dist' },
          {
            at: 'node_modules/rhachet-roles-bhrain/rhachet.repo.yml',
            to: 'rhachet.repo.yml',
          },
          { at: 'node_modules/.bin', to: 'node_modules/.bin' },
          { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
          { at: 'node_modules/.pnpm', to: 'node_modules/.pnpm' },
          {
            at: 'node_modules/rhachet-brains-fireworksai',
            to: 'node_modules/rhachet-brains-fireworksai',
          },
          {
            at: 'node_modules/rhachet-brains-anthropic',
            to: 'node_modules/rhachet-brains-anthropic',
          },
          {
            at: 'node_modules/rhachet-brains-openai',
            to: 'node_modules/rhachet-brains-openai',
          },
        ],
      });

      // link both roles: driver (route mechanics) + reviewer (the review skill the guard runs)
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('npx rhachet roles link --role reviewer', {
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] the driver passes the stone (guard runs the real review skill)', () => {
      const result = useThen('guard runs the empty-rules skip review', async () => {
        // ensure the subject artifact exists so the guard has a file to review
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = (): string => "v1";\n',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('the stone PROCEEDS — exit code 0 (skip unblocks the stone)', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('the reviewer is tallied as approved, not blocked or malfunctioned', () => {
        expect(result.stdout).toMatch(/approved/i);
        expect(result.stdout.toLowerCase()).not.toContain('malfunction');
      });

      then('the guard fan-out stdout matches its snapshot (time+temp sanitized)', () => {
        // .why = the contract's e2e output is snapshotted for PR vibecheck + drift detection
        //        (rule.require.test-coverage-by-grain); sanitizeTimeForSnapshot masks the
        //        volatile verdict timings + tempdir prefix so the snap stays deterministic
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
