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
  sanitizeTimeForSnapshot,
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
  severity: 'better' | 'urgent' | 'disputed' | null; // null = left undeclared
};

/**
 * .what = whether a stance is declared (carries a severity, or a dispute)
 * .why = narrows the type, so the declare call needs no non-null assertion
 */
const isStanceDeclared = (
  stance: Stance,
): stance is Stance & { severity: 'better' | 'urgent' | 'disputed' } =>
  stance.severity !== null;

// the fulcrum a dispute cites, written into each temp route
const FULCRUM_PATH = '.fulcrums/F1-held.md';

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
}): Promise<{ tempDir: string; aliasDir: string }> =>
  driveToExhaustionUnderGuard({ ...input, scheme: SCHEME_DEFAULT });

/**
 * .what = the guard for the lower-level scene: `intent` drops to l1 beside `calm`, and `friction`
 *         stays at l2 with a budget of 1
 * .why = an urgent concession on an l1 lane is the case a bare `--add` would miss — a bare add
 *        lands on the latest level. l1 exhausts at round 3; friction's budget of 1 lets it exhaust
 *        in round 4, the one round its level runs
 */
const GUARD_LOWER_LEVEL = [
  'artifacts:',
  '  - src/**/*.ts',
  '',
  'reviews:',
  '  peer:',
  '    - slug: calm',
  '      run: bash $route/.test/mock-review-lane.sh --blockers 0 --nitpicks 1',
  '      budget: 3',
  '      level: 1',
  '    - slug: intent',
  '      run: bash $route/.test/mock-review-lane.sh --blockers 1 --nitpicks 0',
  '      budget: 3',
  '      level: 1',
  '    - slug: friction',
  '      run: bash $route/.test/mock-review-lane.sh --blockers 2 --nitpicks 0',
  '      budget: 1',
  '      level: 2',
  '',
  'judges:',
  '  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 7',
  '',
].join('\n');

/**
 * .what = how a scene is driven: its guard, its round count, and how many final rounds take
 *         `stancesLast`
 * .why = in the lower-level scene, l1 exhausts at round 3 and l2 runs only at round 4, so each
 *        lane's last given lands in a different round
 */
type DriveScheme = {
  guard: string | null; // null = the fixture's own guard
  rounds: number;
  roundsUnderStancesLast: number;
};

const SCHEME_DEFAULT: DriveScheme = {
  guard: null,
  rounds: ROUNDS_TO_EXHAUST,
  roundsUnderStancesLast: 1,
};

const SCHEME_LOWER_LEVEL: DriveScheme = {
  guard: GUARD_LOWER_LEVEL,
  rounds: ROUNDS_TO_EXHAUST + 1,
  roundsUnderStancesLast: 2,
};

/**
 * .what = drive the fixture route to exhaustion under a scheme
 * .note = a stance applies only to a lane that ran in that round — a lane with no new given has
 *         naught to declare on
 */
const driveToExhaustionUnderGuard = async (input: {
  slug: string;
  stancesLast: Stance[];
  scheme: DriveScheme;
}): Promise<{ tempDir: string; aliasDir: string }> => {
  const tempDir = genTempDirForRhachet({
    slug: input.slug,
    clone: ASSETS_DIR,
  });
  if (input.scheme.guard !== null)
    await fs.writeFile(
      path.join(tempDir, `${STONE}.guard`),
      input.scheme.guard,
    );
  await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
  await execAsync(`git checkout -b vlad/test-${input.slug}`, { cwd: tempDir });
  await fs.mkdir(path.join(tempDir, path.dirname(FULCRUM_PATH)), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(tempDir, FULCRUM_PATH),
    '# F1 — held, for the council\n',
  );

  // serial by nature: each round's reviews read the artifact the prior round edited
  const rounds = Array.from({ length: input.scheme.rounds }, (_, i) => i + 1);
  for (const round of rounds) {
    // a round of reviews
    await invokeRouteSkill({
      skill: 'route.stone.set',
      args: { stone: STONE, route: '.', as: 'passed' },
      cwd: tempDir,
    });

    // the lanes that ran this round: each has a given no prior round answered
    const peerDir = path.join(tempDir, '.reviews', 'peer');
    const namesInDir = await fs.readdir(peerDir);
    const givens = namesInDir.filter((name) =>
      isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
    );
    const givensNew = givens.filter(
      (name) =>
        !namesInDir.includes(
          getRouteGuardReviewPeerPathTaken({ pathGiven: name }),
        ),
    );
    const slugsRan = ['calm', 'intent', 'friction'].filter((slug) =>
      givensNew.some((name) => name.includes(`.given.by_peer.${slug}.`)),
    );

    // the stances for this round, on the lanes that ran; the last rounds may leave some owed
    const isRoundLast =
      round > input.scheme.rounds - input.scheme.roundsUnderStancesLast;
    const stances = (
      isRoundLast ? input.stancesLast : STANCES_ALL_BETTER
    ).filter((one) => slugsRan.includes(one.slug));

    // a `.taken` per given of a lane whose every concern carries a stance
    const slugsFull = ['intent', 'friction']
      .filter((slug) => slugsRan.includes(slug))
      .filter((slug) =>
        stances.filter((one) => one.slug === slug).every(isStanceDeclared),
      );
    for (const name of givens)
      await fs.writeFile(
        path.join(
          peerDir,
          getRouteGuardReviewPeerPathTaken({ pathGiven: name }),
        ),
        '[REPAIR] answered\n',
      );

    // the stances: a dispute cites the fulcrum; a concession carries its grade
    for (const stance of stances.filter(isStanceDeclared))
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: {
          stone: STONE,
          route: '.',
          with: stance.slug,
          about: stance.about,
          ...(stance.severity === 'disputed'
            ? { as: 'disputed', why: FULCRUM_PATH }
            : { as: 'conceded', severity: stance.severity }),
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

/**
 * .what = run the `reviewed?` judge on the stone, at the guard's own thresholds
 * .why = the judge is the reader under test; `route` and `cwd` vary so a case can read the same
 *        ledger through the real dir or through its symlinked alias
 */
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
const setStanceRowsAsAbsolute = async (input: {
  tempDir: string;
  scope: 'all' | 'first'; // first = only the first stance row, so the ledger holds both forms
}) => {
  const pathLedger = path.join(input.tempDir, '.route', 'passage.jsonl');
  const dirReal = await fs.realpath(input.tempDir);
  const lines = (await fs.readFile(pathLedger, 'utf-8'))
    .split('\n')
    .filter((line) => line.trim().length > 0);
  const indexFirstStance = lines.findIndex((line) =>
    ['conceded', 'disputed'].includes(JSON.parse(line).status),
  );
  const linesAbsolute = lines.map((line, index) => {
    const row = JSON.parse(line);
    if (row.status !== 'conceded' && row.status !== 'disputed') return line;
    if (input.scope === 'first' && index !== indexFirstStance) return line;
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

/**
 * .what = one cli result as snapshot-safe text: exit code, stdout, stderr
 * .why = every journey step is snapped (rule.require.snapshot-every-journey-step), and the temp
 *        route, its symlinked alias, and its realpath vary per run, so each is masked to `[ROUTE]`
 *        before the time masks apply
 */
const asJourneySnap = (input: {
  result: { code: number; stdout: string; stderr: string };
  dirs: string[];
}): string =>
  sanitizeTimeForSnapshot(
    input.dirs.reduce(
      (text, dir) => text.split(dir).join('[ROUTE]'),
      [
        `code: ${input.result.code}`,
        '--- stdout',
        input.result.stdout.trim(),
        '--- stderr',
        input.result.stderr.trim(),
      ].join('\n'),
    ),
  );

/**
 * .what = the dirs a scene's output may name, longest first
 * .why = the alias extends the temp path, so it must be masked before the temp path is
 */
const getAllSceneDirs = async (input: {
  tempDir: string;
  aliasDir: string;
}): Promise<string[]> => [
  input.aliasDir,
  await fs.realpath(input.tempDir),
  input.tempDir,
];

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
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeSame, judgeAlias, passedAlias, ledger, dirs };
      });

      when('[t0] the judge runs through the path the stances were written under', () => {
        then('it passes', () => {
          expect(scene.judgeSame.stdout).toContain('passed: true');
          expect(scene.judgeSame.stdout).toContain(
            'reason: reviews pass (blockers: 0/0',
          );
          expect(scene.judgeSame.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeSame, dirs: scene.dirs }),
          ).toMatchSnapshot();
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
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the driver runs `--as passed` through the alias', () => {
        then('the stone passes, and no concern is demanded again', () => {
          expect(scene.passedAlias.code).toEqual(0);
          expect(scene.passedAlias.stdout).toContain('passage = allowed');
          expect(scene.passedAlias.stdout + scene.passedAlias.stderr).not.toContain(
            'undeclared',
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.passedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t3] the ledger is read', () => {
        then('each stance row names its given by filename, never by an absolute path', () => {
          // one row per concern: friction carries blocker.1 and blocker.2, so its given repeats
          const stances = scene.ledger
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line))
            .filter((row) => row.status === 'conceded')
            .map((row) => ({
              reviewer: row.reviewer as string,
              about: row.about as string,
              given: row.given as string,
            }));
          expect(stances.length).toBeGreaterThan(0);
          stances.forEach((one) =>
            expect(one.given).toEqual(path.basename(one.given)),
          );
          expect(stances).toMatchSnapshot();
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
        await setStanceRowsAsAbsolute({ tempDir, scope: 'all' });
        const judgeSame = await runJudge({ route: '.', cwd: tempDir });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const pathLedger = path.join(tempDir, '.route', 'passage.jsonl');
        const asConcededRowCount = (text: string): number =>
          text
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .filter((line) => JSON.parse(line).status === 'conceded').length;
        const concededBefore = asConcededRowCount(
          await fs.readFile(pathLedger, 'utf-8'),
        );
        const passedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const concededAfter = asConcededRowCount(
          await fs.readFile(pathLedger, 'utf-8'),
        );
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return {
          judgeSame,
          judgeAlias,
          passedAlias,
          concededBefore,
          concededAfter,
          dirs,
        };
      });

      when('[t0] the judge runs through the path the rows were written under', () => {
        then('it passes', () => {
          expect(scene.judgeSame.stdout).toContain('passed: true');
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeSame, dirs: scene.dirs }),
          ).toMatchSnapshot();
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
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the driver runs `--as passed` through the alias (vision case=5 [t1])', () => {
        then('the stone passes, and no new `conceded` row is written', () => {
          expect(scene.passedAlias.code).toEqual(0);
          expect(scene.passedAlias.stdout).toContain('passage = allowed');
          expect(scene.concededAfter).toEqual(scene.concededBefore);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.passedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case6] two lanes exhausted, intent blocker.1 disputed, the rest conceded `better`',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-disputed',
          stancesLast: [
            { slug: 'intent', about: 'blocker.1', severity: 'disputed' },
            { slug: 'friction', about: 'blocker.1', severity: 'better' },
            { slug: 'friction', about: 'blocker.2', severity: 'better' },
          ],
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, dirs };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it passes — the dispute is shed the same way a `better` concession is', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.code).toEqual(0);
        });
        then('it names both sheds', () => {
          expect(scene.judgeAlias.stderr).toContain(
            'disputed: 1 blocker, 0 nitpicks excluded from the tally',
          );
          expect(scene.judgeAlias.stderr).toContain(
            'conceded better: 2 blockers, 0 nitpicks excluded from the tally',
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case8] two lanes exhausted, every concern conceded `better`, then a human overrules',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-overruled',
          stancesLast: STANCES_ALL_BETTER,
        });
        const overrule = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: '.', as: 'overruled' },
          cwd: tempDir,
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { overrule, judgeAlias, dirs };
      });

      when('[t0] the human overrules', () => {
        then('the overrule is admitted', () => {
          expect(scene.overrule.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.overrule, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the judge runs through a symlinked alias of the route', () => {
        then('a stance on an overruled lane sheds naught — its lane left the sum', () => {
          expect(scene.judgeAlias.stderr).not.toContain('conceded better:');
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
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
        // the driver's own path, before any grant: what does the halt hand them?
        const passedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
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
        // the fix lands (the artifact hash moves), and the driver re-arrives through the alias
        await fs.writeFile(
          path.join(tempDir, 'src', 'feature.ts'),
          "export const feature = (): string => 'v-fix';\n",
        );
        const rearrivedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, passedAlias, grantAlias, rearrivedAlias, dirs };
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
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t0b] the driver runs `--as passed` through the alias', () => {
        then('it halts, and the halt hands the driver the budget lever', () => {
          expect(scene.passedAlias.code).toEqual(2);
          expect(scene.passedAlias.stdout + scene.passedAlias.stderr).toContain(
            'rhx route.guard.budget --for review --add',
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.passedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the named budget command runs through the alias', () => {
        then('the grant is admitted — the urgent warrant is live', () => {
          expect(scene.grantAlias.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.grantAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the fix lands and the driver re-arrives through the alias', () => {
        then('friction spends the granted round — 4 of 5', () => {
          expect(scene.rearrivedAlias.stdout).toContain('r3: friction (l2, 4/5)');
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.rearrivedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
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

        // the driver declares the one owed concern, absorbs the lane, and passes (vision case=3 [t3])
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: STONE,
            route: '.',
            as: 'conceded',
            with: 'friction',
            about: 'blocker.2',
            severity: 'better',
          },
          cwd: tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: '.', as: 'absorbed', that: 'friction' },
          cwd: tempDir,
        });
        const passedAfterDeclared = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeSame, judgeAlias, passed, passedAfterDeclared, dirs };
      });

      when('[t0] the judge runs', () => {
        then('it holds on the one undeclared concern', () => {
          expect(scene.judgeSame.stdout).toContain('passed: false');
          expect(scene.judgeSame.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
          expect(scene.judgeSame.code).toEqual(2);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeSame, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the judge runs through a symlinked alias of the route', () => {
        then('it holds the same', () => {
          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the driver runs `--as passed`', () => {
        then('the halt names friction blocker.2 as owed', () => {
          const out = scene.passed.stdout + scene.passed.stderr;
          expect(out).toContain('friction');
          expect(out).toContain('blocker.2');
          expect(scene.passed.code).toEqual(2);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.passed, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t3] the driver concedes blocker.2 `better`, absorbs, and passes through the alias', () => {
        then('the stone passes', () => {
          expect(scene.passedAfterDeclared.code).toEqual(0);
          expect(scene.passedAfterDeclared.stdout).toContain('passage = allowed');
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({
              result: scene.passedAfterDeclared,
              dirs: scene.dirs,
            }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case9] two urgent lanes — intent blocker.1 and friction blocker.1 conceded `urgent`',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-two-urgent',
          stancesLast: [
            { slug: 'intent', about: 'blocker.1', severity: 'urgent' },
            { slug: 'friction', about: 'blocker.1', severity: 'urgent' },
            { slug: 'friction', about: 'blocker.2', severity: 'better' },
          ],
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, dirs };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it holds on the two urgent concessions', () => {
          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (2 > 0)',
          );
          expect(scene.judgeAlias.code).toEqual(2);
        });
        then('it names one budget command per urgent lane', () => {
          expect(scene.judgeAlias.stderr).toContain(
            `rhx route.guard.budget --for review --add 2 --peer intent --stone ${STONE}`,
          );
          expect(scene.judgeAlias.stderr).toContain(
            `rhx route.guard.budget --for review --add 2 --peer friction --stone ${STONE}`,
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case10] every concern conceded `better`, and the approved lane calm nitpick.1 disputed',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-both-axes',
          stancesLast: [
            ...STANCES_ALL_BETTER,
            { slug: 'calm', about: 'nitpick.1', severity: 'disputed' },
          ],
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, dirs };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it passes, and the reason names the shed on both axes', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.stdout).toContain(
            'after 3 blockers shed (0 disputed + 3 conceded better), 1 nitpick shed (1 disputed + 0 conceded better)',
          );
          expect(scene.judgeAlias.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case11] intent at l1 conceded `urgent` — the urgent lane sits below the latest level',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustionUnderGuard({
          slug: 'exhausted-lower-level-urgent',
          scheme: SCHEME_LOWER_LEVEL,
          stancesLast: [
            { slug: 'intent', about: 'blocker.1', severity: 'urgent' },
            { slug: 'friction', about: 'blocker.1', severity: 'better' },
            { slug: 'friction', about: 'blocker.2', severity: 'better' },
          ],
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const passedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        // the command the halt named, on the l1 lane
        const grantAlias = await invokeRouteSkill({
          skill: 'route.guard.budget',
          args: {
            for: 'review',
            add: '2',
            peer: 'intent',
            stone: STONE,
            route: aliasDir,
          },
          cwd: tempDir,
        });
        // the fix lands (the artifact hash moves), and the driver re-arrives through the alias
        await fs.writeFile(
          path.join(tempDir, 'src', 'feature.ts'),
          "export const feature = (): string => 'v-fix';\n",
        );
        const rearrivedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, passedAlias, grantAlias, rearrivedAlias, dirs };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it holds on the l1 urgent concession alone', () => {
          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (1 > 0)',
          );
          expect(scene.judgeAlias.code).toEqual(2);
        });
        then('its budget command is scoped to the l1 lane, never a bare add', () => {
          expect(scene.judgeAlias.stderr).toContain(
            `rhx route.guard.budget --for review --add 2 --peer intent --stone ${STONE}`,
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the driver runs `--as passed` through the alias', () => {
        then('it halts on the urgent concession', () => {
          expect(scene.passedAlias.code).toEqual(2);
          expect(scene.passedAlias.stdout).toContain(
            'an urgent concession stands',
          );
        });
        then('the gate names the l1 urgent lane with --peer, never a bare `--add`', () => {
          // .why = a bare add lands on the latest level (l2) alone, so it would pad friction and
          //        leave the urgent lane spent; the halt names the urgent lane, as the judge does
          expect(scene.passedAlias.stdout).toContain(
            `rhx route.guard.budget --for review --add N --peer intent --stone ${STONE}`,
          );
          expect(scene.passedAlias.stdout).not.toContain(
            `rhx route.guard.budget --for review --add N --stone ${STONE}`,
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.passedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the named budget command runs through the alias', () => {
        then('the grant is admitted on the l1 lane', () => {
          expect(scene.grantAlias.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.grantAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t3] the fix lands and the driver re-arrives through the alias', () => {
        then('intent spends the granted round — 4 of 5', () => {
          expect(scene.rearrivedAlias.stdout).toContain('r2: intent (l1, 4/5)');
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.rearrivedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case12] intent at l1 and friction at l2 conceded `better`, then a human overrules — the overrule lands on l1',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustionUnderGuard({
          slug: 'exhausted-overruled-beside-live',
          scheme: SCHEME_LOWER_LEVEL,
          stancesLast: STANCES_ALL_BETTER,
        });
        const overrule = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: '.', as: 'overruled' },
          cwd: tempDir,
        });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { overrule, judgeAlias, dirs };
      });

      when('[t0] the human overrules', () => {
        then('the overrule is admitted', () => {
          expect(scene.overrule.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.overrule, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the judge runs through a symlinked alias of the route', () => {
        then('only the live lane sheds — the overruled lane stances offset naught', () => {
          // friction (l2, live) sheds its 2; intent (l1, overruled) left the sum, so its stance
          // must not add a third to the shed
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.stdout).toContain(
            'after 2 blockers shed (0 disputed + 2 conceded better)',
          );
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case13] every concern conceded `better`, then the stone is rewound and re-arrived',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-rewound',
          stancesLast: STANCES_ALL_BETTER,
        });
        // the givens the pre-rewind stances keyed, by filename
        const givensStanced = (
          await fs.readFile(
            path.join(tempDir, '.route', 'passage.jsonl'),
            'utf-8',
          )
        )
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => JSON.parse(line))
          .filter((row) => row.status === 'conceded')
          .map((row) => path.basename(row.given as string));
        const rewound = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: '.', as: 'rewound' },
          cwd: tempDir,
        });
        // restore the round-1 artifact: a rewind restarts the iteration at i001 and the review
        // hash is a content hash, so the re-minted givens take the SAME filenames round 1's
        // stances keyed — the collision a voided stance would shed across
        await fs.copyFile(
          path.join(ASSETS_DIR, 'src', 'feature.ts'),
          path.join(tempDir, 'src', 'feature.ts'),
        );
        const rearrivedAlias = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: STONE, route: aliasDir, as: 'passed' },
          cwd: tempDir,
        });
        const givensReminted = (
          await fs.readdir(path.join(tempDir, '.reviews', 'peer'))
        ).filter((name) =>
          isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        );
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return {
          rewound,
          rearrivedAlias,
          judgeAlias,
          givensStanced,
          givensReminted,
          dirs,
        };
      });

      when('[t0] the stone is rewound', () => {
        then('the rewind is admitted', () => {
          expect(scene.rewound.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.rewound, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the driver re-arrives through the alias', () => {
        then('it halts — the re-minted givens are owed afresh', () => {
          expect(scene.rearrivedAlias.code).toEqual(2);
          const out = scene.rearrivedAlias.stdout + scene.rearrivedAlias.stderr;
          expect(out).toContain('intent');
          expect(out).toContain('friction');
        });
        then('a re-minted given takes a filename a pre-rewind stance keyed', () => {
          // .why = without the collision, a voided stance could never meet a re-minted given,
          //        and [t2] would stay green whether or not the rewind voids stances
          const collided = scene.givensReminted.filter((name) =>
            scene.givensStanced.includes(name),
          );
          expect(collided.length).toBeGreaterThan(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.rearrivedAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the judge runs through a symlinked alias of the route', () => {
        then('it holds on all three blockers — no voided stance sheds', () => {
          // .why = the judge sheds a `better` stance on a live lane as well as an exhausted one,
          //        so a stance the rewind voided that still keyed the re-minted given would shed here

          expect(scene.judgeAlias.stdout).toContain(
            'reason: blockers exceed threshold (3 > 0)',
          );
          expect(scene.judgeAlias.stderr).not.toContain('conceded better:');
          expect(scene.judgeAlias.code).toEqual(2);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case14] every concern conceded `better`, one stance row absolute and the rest by filename',
    () => {
      const scene = useBeforeAll(async () => {
        const { tempDir, aliasDir } = await driveToExhaustion({
          slug: 'exhausted-mixed-ledger',
          stancesLast: STANCES_ALL_BETTER,
        });
        await setStanceRowsAsAbsolute({ tempDir, scope: 'first' });
        const judgeAlias = await runJudge({ route: aliasDir, cwd: tempDir });
        const dirs = await getAllSceneDirs({ tempDir, aliasDir });
        return { judgeAlias, dirs };
      });

      when('[t0] the judge runs through a symlinked alias of the route', () => {
        then('it passes — both row forms key the same given', () => {
          expect(scene.judgeAlias.stdout).toContain('passed: true');
          expect(scene.judgeAlias.stdout).toContain(
            'after 3 blockers shed (0 disputed + 3 conceded better)',
          );
          expect(scene.judgeAlias.code).toEqual(0);
        });
        then('matches snapshot', () => {
          expect(
            asJourneySnap({ result: scene.judgeAlias, dirs: scene.dirs }),
          ).toMatchSnapshot();
        });
      });
    },
  );
});
