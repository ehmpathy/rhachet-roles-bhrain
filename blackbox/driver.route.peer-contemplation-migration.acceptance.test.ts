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
 *        old rules, with no paired .taken. the debt is keyed to the REVIEWER, never
 *        to (reviewer, hash), so that prior given is still the architect's latest
 *        word and it still gates — an unanswered blocker does not expire merely
 *        because the artifact moved on. no hard-fail, no crash (design-note B9)
 *
 * 🔴 the anti-deadlock property this clamps, and the reason the assertion below
 *    demands the prior hash rather than forbids it:
 *
 *    the taken path is DERIVED from the given path — one infix is swapped and every
 *    other segment is kept verbatim — and the matcher accepts only that derived path.
 *    so for a carried prior-hash given, the one file that can ever discharge it also
 *    carries the prior hash. a prompt that named a CURRENT-hash path instead would
 *    send the driver to write a file the gate then refuses to see: a debt with no
 *    discharge, and the stone deadlocks. a guide that names `bbbbbbbbbbbbbbbbbb` is the fix.
 *
 * .note = this suite formerly asserted the opposite (`not.toContain(...)`) on the premise,
 *         stated in its own docblock, that "the gate is HASH-SCOPED". that premise is
 *         exactly what the reviewer-keyed debt removes, so the old assertion encoded the
 *         defect rather than the contract.
 *
 * ⚠️ .the fixture hash is 18 chars WIDE ON PURPOSE — `bbbbbbbbbbbbbbbbbb`, never `bbbbbbbb`.
 *
 *    `computeStoneReviewInputHash:54` takes shake256 at 9 bytes, and its own note says so:
 *    "9 bytes = 18 hex chars". so an 8-char hash is a width the engine can NEVER write, and
 *    this suite's whole premise is a given the OLD ENGINE left behind — a fixture the engine
 *    could not have produced does not model the scenario it claims to
 *    (r5 nitpick.2, i016).
 *
 *    the repeated single character is kept: it reads as a fixture at a glance, so a reader
 *    cannot mistake it for a captured real hash. width is what makes it a HASH; repetition
 *    is what makes it obviously SEEDED. both properties are wanted, and they do not conflict.
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
          '1.execute._.review.i001.bbbbbbbbbbbbbbbbbb.r001._.given.by_peer.architect.md',
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

      then('CLAMP: the guide names the seeded given own path — so the debt is dischargeable', () => {
        // .why = the matcher accepts only the path DERIVED from the given, so the one
        //        file that can discharge a carried prior-hash given also carries that
        //        prior hash. a current-hash path here would be unanswerable: the driver
        //        writes it, the matcher misses it, and the stone deadlocks with no exit.
        //        so the prior hash MUST appear, and specifically on `articulate into`
        expect(result.stdout).toContain('bbbbbbbbbbbbbbbbbb');
        expect(result.stdout).toMatch(
          /articulate into[\s\S]*1\.execute\._\.review\.i001\.bbbbbbbbbbbbbbbbbb\.r001\._\.taken\.by_self\.architect\.md/,
        );
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
