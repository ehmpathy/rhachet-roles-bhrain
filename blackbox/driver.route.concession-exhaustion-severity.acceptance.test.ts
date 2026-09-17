import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

/**
 * .what = writes the .taken response the absorb gate demands, ahead of the disposition call
 * .why = a concede/dispute call records the per-concern disposition; the .taken file is a
 *        SEPARATE requirement the absorb gate checks (a real response, not just a verdict) —
 *        the dispute-passage journey fixture proves this shape (it writes its taken file
 *        before disputing, never after)
 */
const writeTakenResponse = async (input: {
  tempDir: string;
  body: string;
}): Promise<void> => {
  const peerDir = path.join(input.tempDir, '.reviews', 'peer');
  const entries = await fs.readdir(peerDir);
  const nameGiven = entries.find((name) =>
    isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
  )!;
  await fs.writeFile(
    path.join(
      peerDir,
      getRouteGuardReviewPeerPathTaken({ pathGiven: nameGiven }),
    ),
    input.body,
  );
};

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-concession-exhaustion',
);

/**
 * .what = the DRIVEN concession-exhaustion journey, end to end through the REAL disposition
 *         + tally code: a lane rejects → the driver concedes its one blocker (graded better
 *         or urgent) → absorbs → budget runs out → the two severities land OPPOSITELY — a
 *         `better` concession sheds the tally and the stone PASSES with no human touched, an
 *         `urgent` one halts and asks a human for a budget grant
 *
 * .why = this composition was NEVER live-dogfooded before this test: a repo-wide walk of
 *        this route's own passage ledger found zero occurrences of either concession-
 *        exhaustion marker (`concessions await the round that confirms them` /
 *        `an urgent concession earned a round`) across every real exhaustion event this
 *        route produced during this feature's own build. the disposition/tally logic
 *        (`asRouteStoneDisposition.ts`, `getStoneConcededLaneSlugs.ts`,
 *        `setStoneAsPassed.ts`) had unit coverage but no acceptance-grain proof that the
 *        composition actually settles a real stone the way its own code comments claim
 *        (`rule.require.acceptance-journey-coverage`).
 *
 * .note = zero brain cost — the lane is a deterministic mock shell reviewer that always
 *         raises exactly one blocker, and the judge is the real `rhx route.stone.judge`,
 *         so the arithmetic under test is production code on every machine.
 *
 * 🔴 the lane raises its blocker on EVERY run, by construction, and its budget is 1 — so
 *    the ONLY way past the second round is the severity of the concession the driver
 *    declared, never a code fix.
 */
describe('driver.route.concession-exhaustion-severity.acceptance', () => {
  given('[case1] every skipped lane carries a live BETTER concession', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'concession-exhaustion-better',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      await execAsync('git checkout -b vlad/test-concession-exhaustion-better', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the driver arrives — the lane spends its one round', () => {
      const result = useThen('the round runs', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the stone is held — one blocker, no stance yet', () => {
        expect(result.code).not.toEqual(0);
      });

      then('the round-1 emit is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'round 1 holds — the lane blocks, one round of budget spent',
        );
      });
    });

    when(
      '[t1] the driver answers, concedes the blocker as BETTER, and absorbs',
      () => {
        const result = useThen('the absorb is accepted', async () => {
          // the .taken response is owed FIRST — a concede call refuses to record
          // against a given with no answer on file yet
          await writeTakenResponse({
            tempDir: scene.tempDir,
            body: '[REPAIR] tech debt — no shipped harm. fixed on the next pass.\n',
          });
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1.vision',
              route: '.',
              as: 'conceded',
              with: 'lane',
              about: 'blocker.1',
              severity: 'better',
            },
            cwd: scene.tempDir,
          });
          return invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1.vision',
              route: '.',
              as: 'absorbed',
              that: 'lane',
            },
            cwd: scene.tempDir,
          });
        });

        then('the absorb is accepted', () => {
          expect(result.code).toEqual(0);
        });
      },
    );

    when(
      '[t2] the driver drives on — budget is exhausted, every skipped lane is BETTER',
      () => {
        const result = useThen('the stone lands with no human', async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.vision', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          }),
        );

        then(
          '🔴 the stone PASSES — the better concession sheds the tally',
          () => {
            // the lane still raises its blocker every run and has zero budget left. the
            // ONLY reason the residual clears is the tally exclusion S16 grants a live
            // `better` concession, so this assertion IS the composition
            expect(result.code).toEqual(0);
          },
        );

        then('no human-wait language appears anywhere in the output', () => {
          const combined = (result.stdout + result.stderr).toLowerCase();
          expect(combined).not.toContain('ask a human');
          expect(combined).not.toContain('grants the approval');
          expect(combined).not.toContain('urgent concession');
        });

        then('the passage ledger records passed, not exhausted', async () => {
          const content = await fs.readFile(
            path.join(scene.tempDir, '.route', 'passage.jsonl'),
            'utf-8',
          );
          const rows = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line) as Record<string, unknown>);
          expect(rows[rows.length - 1]!.status).toEqual('passed');
          expect(rows.some((row) => row.status === 'exhausted')).toEqual(
            false,
          );
        });

        then('the final emit is pinned', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
            'a better concession sheds the tally — the stone passes, no human touched',
          );
        });
      },
    );
  });

  given('[case2] every skipped lane carries a live URGENT concession', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'concession-exhaustion-urgent',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', {
        cwd: tempDir,
      });
      await execAsync('git checkout -b vlad/test-concession-exhaustion-urgent', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the driver arrives — the lane spends its one round', () => {
      const result = useThen('the round runs', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the stone is held — one blocker, no stance yet', () => {
        expect(result.code).not.toEqual(0);
      });

      then('the round-1 emit is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'round 1 holds — the lane blocks, one round of budget spent',
        );
      });
    });

    when(
      '[t1] the driver answers, concedes the blocker as URGENT, and absorbs',
      () => {
        const result = useThen('the absorb is accepted', async () => {
          // the .taken response is owed FIRST — a concede call refuses to record
          // against a given with no answer on file yet
          await writeTakenResponse({
            tempDir: scene.tempDir,
            body: '[REPAIR] ships nameable harm — fixed on the next pass.\n',
          });
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1.vision',
              route: '.',
              as: 'conceded',
              with: 'lane',
              about: 'blocker.1',
              severity: 'urgent',
            },
            cwd: scene.tempDir,
          });
          return invokeRouteSkill({
            skill: 'route.stone.set',
            args: {
              stone: '1.vision',
              route: '.',
              as: 'absorbed',
              that: 'lane',
            },
            cwd: scene.tempDir,
          });
        });

        then('the absorb is accepted', () => {
          expect(result.code).toEqual(0);
        });
      },
    );

    when(
      '[t2] the driver drives on — budget is exhausted, the concession is URGENT',
      () => {
        const result = useThen('the stone halts for a human', async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.vision', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          }),
        );

        then(
          '🔴 the stone is HELD — an urgent concession is a human wait, not a push',
          () => {
            // opposite of case1's t2: the SAME shape (one exhausted lane, one live
            // concession), and only the SEVERITY differs. that one bit is the whole
            // reason this halts where case1 passed
            expect(result.code).not.toEqual(0);
          },
        );

        then('the emit asks a human for a budget grant', () => {
          const combined = result.stdout + result.stderr;
          expect(combined).toContain('approve as-is — a human must grant');
          expect(combined).toContain('increase budget — yours to spend');
        });

        then('the emit warns that an urgent concession stands', () => {
          const combined = result.stdout + result.stderr;
          expect(combined).toContain('urgent concession');
        });

        then('the passage ledger records exhausted, not passed', async () => {
          const content = await fs.readFile(
            path.join(scene.tempDir, '.route', 'passage.jsonl'),
            'utf-8',
          );
          const rows = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line) as Record<string, unknown>);
          expect(rows[rows.length - 1]!.status).toEqual('exhausted');
        });

        then('the halt emit is pinned', () => {
          expect(
            sanitizeTimeForSnapshot(result.stdout + result.stderr),
          ).toMatchSnapshot(
            'an urgent concession halts — a human is warned and asked for a budget grant',
          );
        });
      },
    );
  });
});
