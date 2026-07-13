import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-conversation-visibility',
);

/**
 * .what = acceptance test for the opt-in --conversation flag
 * .why = proves $conversation is a plain glob any executable consumes:
 *        - a reviewer WITH --conversation sees the prior .given + .taken and
 *          converges (drops a blocker the driver's .taken claims FIXED)
 *        - a reviewer WITHOUT the flag stays blind (re-raises)
 *        - a mock non-review executable proves the wish's "any skill" claim
 *
 * scenario:
 *   - guard has two peer reviewers: seer (--conversation) + blind (no flag)
 *   - a PRIOR generation is seeded: a blocker given + a FIXED taken for each
 *   - the guard re-runs both at the current hash → seer drops, blind holds
 */
describe('driver.route.conversation-visibility.acceptance', () => {
  given('[case1] a prior round with a FIXED .taken, two reviewers', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-conversation-visibility',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-conversation.sh', {
        cwd: tempDir,
      });

      // write the stone artifact
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );

      // seed a PRIOR generation (fake hash 00000000): a blocker given +
      // a FIXED taken for each reviewer, so the current round's conversation
      // is non-empty for the opt-in reviewer
      const peerDir = path.join(tempDir, '.reviews', 'peer');
      await fs.mkdir(peerDir, { recursive: true });
      const seed = async (slug: string, idx: number) => {
        // zero-padded i/r grammar (asStoneGuardCounter) — a real prior generation
        // would be written padded, so the seed must match to stay realistic
        const base = `1.execute._.review.i001.00000000.r00${idx}`;
        await fs.writeFile(
          path.join(peerDir, `${base}._.given.by_peer.${slug}.md`),
          '---\nblockers: 1\nnitpicks: 0\n---\nseer: the design lacks a bounded context\n\n## blockers\n- the design lacks a bounded context\n',
        );
        await fs.writeFile(
          path.join(peerDir, `${base}._.taken.by_self.${slug}.md`),
          '# taken\n\nFIXED via a bounded context.\n',
        );
      };
      await seed('seer', 1);
      await seed('blind', 2);

      return { tempDir, peerDir };
    });

    when('[t0] driver attempts --as passed, guard re-runs both reviewers', () => {
      const result = useThen('guard runs the reviewers', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // read the CURRENT-generation givens (exclude the seeded 00000000 hash)
        const files = await fs.readdir(scene.peerDir);
        const givenOf = async (slug: string) => {
          const name = files.find(
            (f) =>
              f.includes(`_.given.by_peer.${slug}.md`) &&
              !f.endsWith('.report.md') &&
              !f.includes('00000000'),
          )!;
          return fs.readFile(path.join(scene.peerDir, name), 'utf-8');
        };
        return {
          seer: await givenOf('seer'),
          blind: await givenOf('blind'),
        };
      });

      then('the opt-in seer saw the prior conversation (4 files)', () => {
        expect(result.seer).toContain('## conversation seen (4 files)');
        expect(result.seer).toContain('_.given.by_peer.seer.md');
        expect(result.seer).toContain('_.taken.by_self.seer.md');
      });

      then('the opt-in seer converged — dropped the blocker (0)', () => {
        expect(result.seer).toContain('blockers: 0');
        expect(result.seer).toContain("the driver's .taken claims FIXED");
      });

      then('the blind reviewer saw no conversation (0 files)', () => {
        expect(result.blind).toContain('## conversation seen (0 files)');
      });

      then('the blind reviewer held the blocker (1) — no convergence', () => {
        expect(result.blind).toContain('blockers: 1');
        expect(result.blind).toContain('the design lacks a bounded context');
      });

      then('seer given matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.seer)).toMatchSnapshot();
      });

      then('blind given matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.blind)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a first round with no prior generation', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-conversation-empty',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-conversation.sh', {
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] driver attempts --as passed with no prior conversation', () => {
      const result = useThen('guard runs the reviewers', async () => {
        const invoked = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        const peerDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(peerDir);
        const name = files.find(
          (f) =>
            f.includes('_.given.by_peer.seer.md') && !f.endsWith('.report.md'),
        )!;
        const seer = await fs.readFile(path.join(peerDir, name), 'utf-8');
        return { invoked, seer };
      });

      then('the opt-in seer handled an empty conversation gracefully', () => {
        expect(result.seer).toContain('## conversation seen (0 files)');
      });

      then('the guard did not crash (exit 2 is the contemplation block)', () => {
        expect(result.invoked.code).toEqual(2);
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.invoked.stdout)).toMatchSnapshot();
      });
    });
  });
});
