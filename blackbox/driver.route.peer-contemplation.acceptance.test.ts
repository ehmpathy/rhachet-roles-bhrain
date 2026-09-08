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
 * .what = writes the `.taken` paired to architect's LATEST `.given`, then acks it
 * .why  = the taken path is DERIVED from the given, so the only path the matcher
 *         accepts is the one derived from whichever given the gate currently holds
 *         open. across a hash move there are several givens for one slug, and only
 *         the latest is owed — so the answer must be aimed, never guessed
 */
const answerArchitectsLatestGiven = async (input: {
  tempDir: string;
  body: string;
}) => {
  const reviewsDir = path.join(input.tempDir, '.reviews', 'peer');
  const files = await fs.readdir(reviewsDir);
  const givenName = files
    .filter(
      (f) =>
        f.includes('_.given.by_peer.architect.md') && !f.endsWith('.report.md'),
    )
    .sort()
    .pop()!;
  const takenName = givenName.replace(
    '._.given.by_peer.',
    '._.taken.by_self.',
  );
  await fs.writeFile(path.join(reviewsDir, takenName), input.body);
  return invokeRouteSkill({
    skill: 'route.stone.set',
    args: {
      stone: '1.execute',
      route: '.',
      as: 'contemplated',
      that: 'architect',
    },
    cwd: input.tempDir,
  });
};

/**
 * .what = acceptance test for the peer-review contemplation gate
 * .why = proves a driver must articulate a .taken response to every peer
 *        critique that holds blockers before the stone may progress; a clean
 *        reviewer needs no response
 *
 * scenario:
 *   - guard has two peer reviewers: architect (1 blocker) + mechanic (clean)
 *   - judge allows 1 blocker, so judges pass and the contemplation gate engages
 *   - the driver is blocked until it writes architect's .taken (mechanic skipped)
 */
describe('driver.route.peer-contemplation.acceptance', () => {
  given('[case1] a stone gated on architect (1 blocker) + mechanic (clean)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });

      // write the stone artifact
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      return { tempDir };
    });

    when('[t0] driver attempts --as passed with no .taken', () => {
      const result = useThen('guard runs reviews, blocks on contemplation', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names architect and awaits a reply', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('the clean mechanic is NOT listed (clean-skip)', () => {
        // only reviewers that hold blockers require contemplation
        expect(result.stdout).not.toContain('slug = mechanic');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver signals --as contemplated before the .taken exists', () => {
      const result = useThen('guard blocks with absent guidance', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('names the exact absent .taken path and why', () => {
        expect(result.stdout).toContain(
          'contemplation absent for reviewer architect',
        );
        expect(result.stdout).toContain('_.taken.by_self.architect.md');
        expect(result.stdout).toContain('the .taken file IS that engagement');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] driver writes the .taken then signals --as contemplated', () => {
      const result = useThen('guard acknowledges the contemplation', async () => {
        // find architect's given, derive + write its paired taken
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const givenName = files.find(
          (f) =>
            f.includes('_.given.by_peer.architect.md') &&
            !f.endsWith('.report.md'),
        )!;
        const takenName = givenName.replace(
          '._.given.by_peer.',
          '._.taken.by_self.',
        );
        await fs.writeFile(
          path.join(reviewsDir, takenName),
          '# taken\n\nfixed via a bounded context.\n',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.execute',
            route: '.',
            as: 'contemplated',
            that: 'architect',
          },
          cwd: scene.tempDir,
        });
      });

      then('is acknowledged (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('confirms the contemplation was recorded', () => {
        expect(result.stdout).toContain('contemplated: architect');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] driver attempts --as passed with architect answered', () => {
      const result = useThen('the stone progresses', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('passes (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('the stone is allowed passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * 🔴 .what = the EDIT ESCAPE, closed — at the real linked-role blackbox grain.
   *
   * .why = this is the wish's headline claim, and it is the one a driver would actually
   *        reach for: a blocker lands, and rather than an answer the driver edits the code
   *        and re-runs. under the old `(slug, hash)` key that edit moved the artifact hash
   *        and the debt died with it, so the edit WAS a door. under the reviewer-keyed debt
   *        the door is shut.
   *
   * ⚠️ this differs from the two cases that already exist, and the difference is the point:
   *    - `[case1][t0]` proves the gate refuses a FRESH debt — no edit involved
   *    - `…-migration [case1][t0]` proves a carried debt still gates, from a SEEDED prior
   *      given — the hash move is fabricated, never performed
   *    - ⇒ this case performs a REAL edit, so the hash move is produced by the engine rather
   *      than staged by the fixture. that is what makes it the negative path of the journey
   *      instead of a restatement of it (r004 blocker.1, i025)
   */
  given('[case2] a driver that edits the artifact rather than answers', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-edit-escape',
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

    when('[t0] the first pass attempt raises a blocker', () => {
      const result = useThen('the gate refuses and names the debt', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('is blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the reply-prompt names architect', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'edit-escape - [t0] the debt is raised',
        );
      });
    });

    when('[t1] the driver EDITS the artifact and re-runs, with no answer', () => {
      const result = useThen('the gate still refuses', async () => {
        // a real edit — the engine recomputes the artifact hash from this content
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthe work under review, now with a bounded context.\n',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('🔴 the edit does NOT buy passage — still blocked (exit 2)', () => {
        expect(result.code).toEqual(2);
      });

      then('the debt survived the hash move — architect is still owed', () => {
        expect(result.stdout).toContain('the reviewers await your reply');
        expect(result.stdout).toContain('architect');
      });

      then('the guide still names a .taken path the driver can actually write', () => {
        // the taken path is DERIVED from the given, so whichever hash the carried given
        // holds, the path the halt prints is the one the matcher will accept
        expect(result.stdout).toMatch(
          /articulate into[\s\S]*_\.taken\.by_self\.architect\.md/,
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'edit-escape - [t1] the edit does not discharge the debt',
        );
      });
    });

    when('[t2] the driver answers the CARRIED debt', () => {
      const outcome = useThen('the round it held shut now runs', async () => {
        const acked = await answerArchitectsLatestGiven({
          tempDir: scene.tempDir,
          body: '# taken\n\n[REPAIR] the bounded context is now declared.\n',
        });
        const passed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        return { acked, passed };
      });

      then('the contemplation is acknowledged (exit 0)', () => {
        // ⚠️ asserted rather than discarded — a swallowed non-zero here would make
        //    the halt below look like a gate defect when it was a bad ack
        //    (`rule.forbid.failhide`, code.test)
        expect(outcome.acked.code).toEqual(0);
        expect(outcome.acked.stdout).toContain('contemplated: architect');
      });

      then('🔴 still blocked (exit 2) — but for a NEW reason', () => {
        // the answer bought ENTRY to the round, never passage. the round then ran
        // for the first time since the edit, at the moved hash, and the reviewer
        // raised a fresh critique — which is itself unanswered, and correctly gates
        expect(outcome.passed.code).toEqual(2);
      });

      then('the reviewer SPOKE this time — the round was not refused', () => {
        // the tell that the entrance gate opened: the guard reached the reviewers.
        // under [t1] it never did
        expect(outcome.passed.stdout).toMatch(/r1: architect/);
        expect(outcome.passed.stdout).toContain(
          'the reviewers await your reply',
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(outcome.passed.stdout)).toMatchSnapshot(
          'edit-escape - [t2] the answer buys entry, never passage',
        );
      });
    });

    when('[t3] the driver answers the FRESH critique too', () => {
      const result = useThen('the door finally opens', async () => {
        await answerArchitectsLatestGiven({
          tempDir: scene.tempDir,
          body: '# taken\n\n[REPAIR] answered at the moved hash.\n',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('✅ passes (exit 0) — the ANSWER was the door, never the edit', () => {
        expect(result.code).toEqual(0);
      });

      then('the stone is allowed passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'edit-escape - [t3] the answer discharges the debt',
        );
      });
    });
  });
});
