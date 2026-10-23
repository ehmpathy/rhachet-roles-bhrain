import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

/**
 * .what = clamps for the `reviewed?` judge on exhausted lanes whose concerns all carry a stance
 * .why = a stance names its given by a path the driver's process built; the judge runs as a
 *        guard subprocess that builds its own. where the two disagree, every stance lapsed for
 *        the judge alone, and an exhausted lane conceded all `better` held the stone at
 *        `blockers exceed threshold (3 > 0)` with no lever left. the judge here is reached
 *        through a symlinked alias of the route — the smallest way to make the two paths differ.
 *
 * .note = the fixture: lane `calm` (l1, 0 blockers), lanes `intent` (l2, 1 blocker) and
 *         `friction` (l2, 2 blockers), each budget 3, judge `--allow-blockers 0`. three rounds
 *         exhaust both l2 lanes, so the givens of the third round are frozen.
 */
const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-exhausted-all-better',
);

const STONE = '1.vision';
const ROUNDS_TO_EXHAUST = 3;

type Stance = {
  slug: string;
  about: string;
  severity: 'better' | 'urgent' | null; // null = left undeclared
};

const STANCES_ALL_BETTER: Stance[] = [
  { slug: 'intent', about: 'blocker.1', severity: 'better' },
  { slug: 'friction', about: 'blocker.1', severity: 'better' },
  { slug: 'friction', about: 'blocker.2', severity: 'better' },
];

/**
 * .what = drive the fixture route to exhaustion, answer each round with the stances given
 * .note = `stancesLast` applies to the third round only, so a lane can be left owed at the end
 *         while every earlier round still clears the entrance gate
 */
const driveToExhaustion = async (input: {
  slug: string;
  stancesLast: Stance[];
}): Promise<{ tempDir: string; aliasDir: string }> => {
  const tempDir = genTempDirForRhachet({
    slug: input.slug,
    clone: ASSETS_DIR,
  });
  await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
  await execAsync(`git checkout -b vlad/test-${input.slug}`, { cwd: tempDir });

  for (let round = 1; round <= ROUNDS_TO_EXHAUST; round++) {
    // a round of reviews
    await invokeRouteSkill({
      skill: 'route.stone.set',
      args: { stone: STONE, route: '.', as: 'passed' },
      cwd: tempDir,
    });

    // the stances for this round; the last round may leave some owed
    const stances =
      round === ROUNDS_TO_EXHAUST ? input.stancesLast : STANCES_ALL_BETTER;

    // a `.taken` per given of a lane whose every concern carries a stance
    const slugsFull = ['intent', 'friction'].filter((slug) =>
      stances
        .filter((one) => one.slug === slug)
        .every((one) => one.severity !== null),
    );
    const peerDir = path.join(tempDir, '.reviews', 'peer');
    const givens = (await fs.readdir(peerDir)).filter((name) =>
      isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
    );
    for (const name of givens)
      await fs.writeFile(
        path.join(
          peerDir,
          getRouteGuardReviewPeerPathTaken({ pathGiven: name }),
        ),
        '[REPAIR] answered\n',
      );

    // the stances
    for (const stance of stances.filter((one) => one.severity !== null))
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: {
          stone: STONE,
          route: '.',
          as: 'conceded',
          with: stance.slug,
          about: stance.about,
          severity: stance.severity!,
        },
        cwd: tempDir,
      });
    for (const slug of slugsFull)
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: STONE, route: '.', as: 'absorbed', that: slug },
        cwd: tempDir,
      });

    // move the artifact hash, so a lane with budget left runs again
    await fs.writeFile(
      path.join(tempDir, 'src', 'feature.ts'),
      `export const feature = (): string => 'v${round}';\n`,
    );
  }

  // the same route, reached through a different absolute path
  const aliasDir = `${tempDir}.alias`;
  await fs.symlink(tempDir, aliasDir);
  return { tempDir, aliasDir };
};

const runJudge = (input: { route: string; cwd: string }) =>
  invokeRouteSkill({
    skill: 'route.stone.judge',
    args: {
      mechanism: 'reviewed?',
      stone: STONE,
      route: input.route,
      'allow-blockers': '0',
      'allow-nitpicks': '7',
    },
    cwd: input.cwd,
  });

/**
 * .what = rewrite every stance row's `given` to the absolute path the driver's process saw
 * .why = the form bhrain ≤ 0.42.1 wrote. a ledger that already exists must be read as is
 * .note = the driver's process saw the REALPATH — `process.cwd()` resolves symlinks — so the
 *         rows carry it, never the symlinked temp path the test holds
 */
const setStanceRowsAsAbsolute = async (input: { tempDir: string }) => {
  const pathLedger = path.join(input.tempDir, '.route', 'passage.jsonl');
  const dirReal = await fs.realpath(input.tempDir);
  const lines = (await fs.readFile(pathLedger, 'utf-8'))
    .split('\n')
    .filter((line) => line.trim().length > 0);
  const linesAbsolute = lines.map((line) => {
    const row = JSON.parse(line);
    if (row.status !== 'conceded' && row.status !== 'disputed') return line;
    return JSON.stringify({
      ...row,
      given: path.join(
        dirReal,
        '.reviews',
        'peer',
        path.basename(row.given),
      ),
    });
  });
  await fs.writeFile(pathLedger, `${linesAbsolute.join('\n')}\n`);
};

describe('driver.route.exhausted-all-better', () => {
  given(
    '[case1] two lanes exhausted at 3/3, every concern conceded `better`',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-all-better',
          stancesLast: STANCES_ALL_BETTER,
        });
        const judgeSame = await runJudge({ route: '.', cwd: tempDir });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const passedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const ledger = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        return { judgeSame, judgeAlias, passedAlias, ledger };
      });

      when('[t0] the judge runs through the path the stances were written under', () => {
        then('it passes', () => {
          expect(scene.judgeSame.stdout).toContain('passed: true');
          expect(scene.judgeSame.stdout).toContain(
            'reason: reviews pass (blockers: 0/0',
          );
          expect(scene.judgeSame.code).toEqual(0);
        });
      });

      when('[t1] the judge runs through a symlinked alias of the route', () => {
        then('it passes too — the path the judge sees does not orphan a stance', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.stdout).not.toContain(
            'blockers exceed threshold',
          );
          expect(scene.judgeAlias.code).toEqual(0);
        });
      });

      when('[t2] the driver runs `--as passed` through the alias', () => {
        then('no concern is demanded again', () => {
          expect(scene.passedAlias.stdout + scene.passedAlias.stderr).not.toContain(
            'undeclared',
          );
        });
      });

      when('[t3] the ledger is read', () => {
        then('each stance row names its given by filename, never by an absolute path', () => {
          const givens = scene.ledger
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line))
            .filter((row) => row.status === 'conceded')
            .map((row) => row.given as string);
          expect(givens.length).toBeGreaterThan(0);
          givens.forEach((one) => expect(one).toEqual(path.basename(one)));
        });
      });
    },
  );

  given(
    '[case5] the same walk, with stance rows in the absolute form bhrain ≤ 0.42.1 wrote',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-all-better-legacy',
          stancesLast: STANCES_ALL_BETTER,
        });
        await setStanceRowsAsAbsolute({ tempDir });
        const judgeSame = await runJudge({ route: '.', cwd: tempDir });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        return { judgeSame, judgeAlias };
      });

      when('[t0] the judge runs through the path the rows were written under', () => {
        then('it passes', () => {
          expect(scene.judgeSame.stdout).toContain('passed: true');
        });
      });

      when('[t1] the judge runs through a symlinked alias — the measured tree', () => {
        then('it passes, with no stance declared again', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.stdout).not.toContain(
            'blockers exceed threshold (3 > 0)',
          );
          expect(scene.judgeAlias.code).toEqual(0);
        });
      });
    },
  );

  given(
    '[case2] two lanes exhausted, friction blocker.1 conceded `urgent`, the rest `better`',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-urgent',
          stancesLast: [
            { slug: 'intent', about: 'blocker.1', severity: 'better' },
            { slug: 'friction', about: 'blocker.1', severity: 'urgent' },
            { slug: 'friction', about: 'blocker.2', severity: 'better' },
          ],
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const grantAlias = await invokeRouteSkill({
          skill: 'route.guard.budget',
          args: {
            for: 'review',
            add: '2',
            peer: 'friction',
            stone: STONE,
            route: aliasDir,
          },
          cwd: tempDir,
        });
        return { judgeAlias, grantAlias };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it holds on the urgent concession alone', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: false');
          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
          expect(scene.judgeAlias.code).toEqual(2);
        });
        then('it names the urgent lane and the budget lever, scoped to that lane', () => {
          expect(scene.judgeAlias.stderr).toContain(
            '✋ halted, an urgent concession stands — friction',
          );
          expect(scene.judgeAlias.stderr).toContain(
            `rhx route.guard.budget --for review --add 2 --peer friction --stone ${STONE}`,
          );
        });
      });

      when('[t1] the named budget command runs through the alias', () => {
        then('the grant is admitted — the urgent warrant is live', () => {
          expect(scene.grantAlias.code).toEqual(0);
        });
      });
    },
  );

  given(
    '[case3] two lanes exhausted, friction blocker.2 never declared',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-undeclared',
          stancesLast: [
            { slug: 'intent', about: 'blocker.1', severity: 'better' },
            { slug: 'friction', about: 'blocker.1', severity: 'better' },
            { slug: 'friction', about: 'blocker.2', severity: null },
          ],
        });
        const judgeSame = await runJudge({ route: '.', cwd: tempDir });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const passed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: '.', as: 'passed' },
          cwd: tempDir,
        });
        return { judgeSame, judgeAlias, passed };
      });

      when('[t0] the judge runs', () => {
        then('it holds on the one undeclared concern', () => {
          expect(scene.judgeSame.stdout).toContain('passed: false');
          expect(scene.judgeSame.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
          expect(scene.judgeSame.code).toEqual(2);
        });
      });

      when('[t1] the judge runs through a symlinked alias of the route', () => {
        then('it holds the same', () => {
          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
        });
      });

      when('[t2] the driver runs `--as passed`', () => {
        then('the halt names friction blocker.2 as owed', () => {
          const out = scene.passed.stdout + scene.passed.stderr;
          expect(out).toContain('friction');
          expect(out).toContain('blocker.2');
          expect(scene.passed.code).toEqual(2);
        });
      });
    },
  );
});
