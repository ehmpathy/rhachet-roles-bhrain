import { MalfunctionError } from 'helpful-errors';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTempDirForRhachet } from './.test/genTempDirForRhachet';
import { asChildEnv, invokeShellCommand } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * .what = runs one shell command in the fixture, with HOME pointed at the fixture's own home
 * .why = rhachet's grove settings layer links to $HOME/.claude/settings.json; a temp home keeps
 *        the host's settings out of reach
 */
const runRhx = async (input: { cmd: string; cwd: string; home: string }) =>
  invokeShellCommand({
    cmd: input.cmd,
    cwd: input.cwd,
    env: asChildEnv({
      overrides: { HOME: input.home, CLAUDE_CONFIG_DIR: undefined },
    }),
  });

/**
 * .what = one stream of output, with the bytes that vary per run tokenized
 * .why = the snapshot pins what a human sees; the temp repo, the temp home, the pursuit date,
 *        and a judge's elapsed time (`0.5s`) vary per run, and no other byte does
 */
const asFramedOutput = (input: {
  text: string;
  scene: { tempDir: string; home: string };
}): string =>
  input.text
    .replace(ANSI_COLOR, '')
    .split(fs.realpathSync(input.scene.tempDir))
    .join('$REPO')
    .split(input.scene.tempDir)
    .join('$REPO')
    .split(fs.realpathSync(input.scene.home))
    .join('$HOME')
    .split(input.scene.home)
    .join('$HOME')
    .replace(/\d{4}_\d{2}_\d{2}/g, '$DATE')
    .replace(/\d{4}-\d{2}-\d{2}/g, '$DATE')
    .replace(/\b\d+(\.\d+)?s\b/g, '$ELAPSEDs');

/**
 * .what = the stones of a course before `6.exit`, in route order
 */
const STONES_OF_COURSE = [
  '1.1.outcome.declare',
  '1.2.outcome.baseline',
  '2.1.greats.aim',
  '2.2.greats.read',
  '3.practice.vitro',
  '4.1.entool.blueprint',
  '4.2.entool.execute',
  '5.1.outcome.assess',
  '5.2.outcome.reflect',
];

/**
 * .what = the yields a course writes, in the shapes its stones show; `$BRIEF` names the brief
 */
const YIELDS_OF_COURSE: Record<string, string> = {
  '1.2.outcome.baseline': 'score = 1/3\n',
  '2.2.greats.read': '| great | work |\n|---|---|\n| helland | idempotence |\n',
  '3.practice.vitro':
    '| claim | verdict | evidence |\n|---|---|---|\n| k1 upsert dedupes | held | 3 replays |\n',
  '4.1.entool.blueprint':
    '| path | kind | claims | serves |\n|---|---|---|---|\n| rule.require.natural-key-upsert.md | brief | k1 | t1 |\n',
  '4.2.entool.execute': '| path | kind | boot |\n|---|---|---|\n| $BRIEF | brief | say |\n',
  '5.1.outcome.assess': 'score = 3/3\ntransfer = passed\n',
};

/**
 * .what = a course driven to its exit stone by hand: the brief written and named, each yield
 *         written, each stone passed in the route's own passage log
 * .why = the stones are a brain's work; the acceptance test owns only what the faces then read
 * .note = the passage lines are what `route.stone.set --as passed` appends once a stone's guard
 *         clears. case4 drives one course through every real guard; the other cases take the
 *         drive as given, since each guarded stone costs a 30s self-review dwell
 */
const setCourseDrivenByHand = (input: {
  tempDir: string;
  courseRoute: string;
  briefsDir: string;
  bootPath: string | null;
}): void => {
  const brief = path.join(input.briefsDir, 'rule.require.natural-key-upsert.md');
  fs.mkdirSync(path.join(input.tempDir, input.briefsDir), { recursive: true });
  fs.writeFileSync(
    path.join(input.tempDir, brief),
    '# upsert on the natural key\n\na write keyed on the natural key converges on retry; an insert on a fresh id duplicates.\n',
  );
  if (input.bootPath) {
    const bootAbs = path.join(input.tempDir, input.bootPath);
    const briefOfBoot = path.relative(path.dirname(input.bootPath), brief);
    fs.writeFileSync(
      bootAbs,
      `${fs.readFileSync(bootAbs, 'utf-8')}always:\n  briefs:\n    say:\n      - ${briefOfBoot}\n`,
    );
  }
  const routeAbs = path.join(input.tempDir, input.courseRoute);
  Object.entries(YIELDS_OF_COURSE).forEach(([stone, text]) =>
    fs.writeFileSync(
      path.join(routeAbs, `${stone}.yield.md`),
      text.replace('$BRIEF', brief),
    ),
  );
  fs.mkdirSync(path.join(routeAbs, '.route'), { recursive: true });
  fs.appendFileSync(
    path.join(routeAbs, '.route', 'passage.jsonl'),
    STONES_OF_COURSE.map(
      (stone) => `${JSON.stringify({ stone, status: 'passed' })}\n`,
    ).join(''),
  );
};

/**
 * .what = the one course route a pursuit holds, repo-relative
 */
const getOneCourseRoute = (input: { tempDir: string }): string => {
  const pursuit = fs.readdirSync(path.join(input.tempDir, '.route'))[0]!;
  const coursesDir = path.join('.route', pursuit, '2.courses.pursue.yield');
  const course = fs.readdirSync(path.join(input.tempDir, coursesDir))[0]!;
  return path.join(coursesDir, course);
};

/**
 * .what = the course route of the pursuit at a given ordinal, repo-relative
 */
const getOneCourseRouteAt = (input: {
  tempDir: string;
  ordinal: number;
}): string => {
  const pursuit = fs.readdirSync(path.join(input.tempDir, '.route'))[0]!;
  const coursesDir = path.join('.route', pursuit, '2.courses.pursue.yield');
  const course = fs
    .readdirSync(path.join(input.tempDir, coursesDir))
    .find((name) => name.startsWith(`course=${input.ordinal}.`));
  if (!course)
    throw new MalfunctionError('no course route at that ordinal', {
      ordinal: input.ordinal,
      coursesDir,
    });
  return path.join(coursesDir, course);
};

/**
 * .what = the passage log of the one pursuit, or '' when none is written yet
 */
const getOnePursuitPassage = (input: { tempDir: string }): string => {
  const pursuit = fs.readdirSync(path.join(input.tempDir, '.route'))[0]!;
  const passage = path.join(input.tempDir, '.route', pursuit, '.route', 'passage.jsonl');
  return fs.existsSync(passage) ? fs.readFileSync(passage, 'utf-8') : '';
};

/**
 * .what = the education faces, driven through the real `rhx` entry: the harness prefix, the
 *         `.sh` skill, and the package subpath export, as a director runs them
 * .why = an in-process face test calls the face with a synthetic argv, so it cannot see what
 *        the harness does to the args. `rhx` once consumed the caller's `--role` as its own
 *        filter, and only a spawn through the entry would have caught it
 */
describe('learner education journey, via rhx', () => {
  given('[case1] a repo with the learner linked and a native mechanic', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'education-journey',
        clone: ASSETS_DIR,
      });
      const home = path.join(tempDir, '.home');
      fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
      fs.mkdirSync(
        path.join(tempDir, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
        { recursive: true },
      );
      await runRhx({
        cmd: 'git checkout -b human/test-education-acceptance',
        cwd: tempDir,
        home,
      });
      // the driver is linked beside the learner: its route.stone.set runs the stone guards
      const init = await runRhx({
        cmd: 'npx rhx init --roles learner,driver --hooks',
        cwd: tempDir,
        home,
      });
      if (init.code !== 0)
        throw new MalfunctionError('rhx init failed in the fixture', {
          code: init.code,
          stderr: init.stderr,
          hint: 'run: npm run build, so dist holds the education skills',
        });
      return { tempDir, home };
    });

    when('[t0] a pursuit opens with --for, through the entry', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx education.pursuit init --for mechanic --course idempotency',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0, and --for reached the face', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('education.pursuit.mechanic.idempotency');
      });

      then('the pursuit route is on disk and the branch is bound to it', () => {
        const routes = fs.readdirSync(path.join(scene.tempDir, '.route'));
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatch(/\.education\.pursuit\.mechanic\.idempotency$/);
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t1] a pursuit opens for a role the repo lacks', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx education.pursuit init --for mechanik --course idempotency',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 2 from the face, and names the role meant', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('no role mechanik in this repo');
        expect(result.stderr).toContain('did you mean --for mechanic?');
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stderr, scene })).toMatchSnapshot();
      });
    });

    when('[t2] a course is pushed once the plot is written', () => {
      const result = useThen('it runs', () => {
        const pursuit = fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!;
        fs.writeFileSync(
          path.join(scene.tempDir, '.route', pursuit, '1.courses.plot.yield.md'),
          '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
        );
        return runRhx({
          cmd: 'npx rhx education.pursuit.course init --course idempotency',
          cwd: scene.tempDir,
          home: scene.home,
        });
      });

      then('it exits 0 and names the course route', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('course=1.idempotency');
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t3] the pedigree is read for the role', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx education.pedigree get --for mechanic',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0, with no pursuit graduated yet', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('mechanic');
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t4] the course stones pass, and 6.exit is passed by hand', () => {
      const result = useThen('it runs', async () => {
        const courseRoute = getOneCourseRoute({ tempDir: scene.tempDir });
        setCourseDrivenByHand({
          tempDir: scene.tempDir,
          courseRoute,
          briefsDir: '.agent/repo=.this/role=mechanic/briefs',
          bootPath: null,
        });

        // a hand pass writes the stone's yield, then asks the route to pass it
        const yieldByHand = path.join(
          scene.tempDir,
          courseRoute,
          '6.exit.yield.md',
        );
        fs.writeFileSync(yieldByHand, 'exited, by hand\n');
        const run = await runRhx({
          cmd: 'npx rhx route.stone.set --stone 6.exit --as passed',
          cwd: scene.tempDir,
          home: scene.home,
        });
        fs.rmSync(yieldByHand);
        return run;
      });

      then('the 6.exit guard holds: its judge names exit as the way', () => {
        const passage = fs.readFileSync(
          path.join(
            scene.tempDir,
            getOneCourseRoute({ tempDir: scene.tempDir }),
            '.route',
            'passage.jsonl',
          ),
          'utf-8',
        );
        expect(passage).not.toContain('"stone":"6.exit","status":"passed"');
        expect(`${result.stdout}\n${result.stderr}`).toContain(
          'a course ends only by exit',
        );
      });

      then('each stream renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot(
          'stdout',
        );
        expect(asFramedOutput({ text: result.stderr, scene })).toMatchSnapshot(
          'stderr',
        );
      });
    });

    when('[t5] the course exits, through the entry', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx education.pursuit.course exit',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it exits 0, and the bind is back on the pursuit', () => {
        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('course = 1. idempotency');
        expect(result.stdout).toContain('bound = the pursuit (was ');
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t5.1] the pursue stone is passed as its stone says, once the course exited', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx route.stone.set --stone 2.courses.pursue --as passed',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it passes: the exits are its artifacts, and its judge clears', () => {
        expect(result.code).toEqual(0);
        expect(getOnePursuitPassage({ tempDir: scene.tempDir })).toContain(
          '"stone":"2.courses.pursue","status":"passed"',
        );
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t5.2] the graduate stone is passed before the pedigree is stamped', () => {
      const result = useThen('it runs', () => {
        const pursuit = fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!;
        fs.writeFileSync(
          path.join(scene.tempDir, '.route', pursuit, '3.courses.review.yield.md'),
          'the course moved the role; no course to add\n',
        );
        return runRhx({
          cmd: 'npx rhx route.stone.set --stone 4.graduate --as passed',
          cwd: scene.tempDir,
          home: scene.home,
        });
      });

      then('it holds: no entry stands yet', () => {
        expect(result.code).not.toEqual(0);
        expect(getOnePursuitPassage({ tempDir: scene.tempDir })).not.toContain(
          '"stone":"4.graduate","status":"passed"',
        );
      });

      then('the reply names the set command, as case=5 shows', () => {
        expect(`${result.stdout}\n${result.stderr}`).toContain(
          'rhx education.pedigree set',
        );
      });

      then('each stream renders as the snapshot shows', () => {
        // each stream is pinned on its own, so no frame of ours sits in the bytes a caller reads
        expect(
          asFramedOutput({ text: result.stdout, scene }),
        ).toMatchSnapshot('stdout');
        expect(
          asFramedOutput({ text: result.stderr, scene }),
        ).toMatchSnapshot('stderr');
      });
    });

    when('[t6] the pedigree is stamped, then read', () => {
      const stamp = useThen('set runs', () =>
        runRhx({
          cmd: 'npx rhx education.pedigree set',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );
      const read = useThen('get runs', () =>
        runRhx({
          cmd: 'npx rhx education.pedigree get --for mechanic',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('set exits 0, and the entry and index stand in the role', () => {
        expect(stamp.code).toEqual(0);
        const names = fs.readdirSync(
          path.join(
            scene.tempDir,
            '.agent/repo=.this/role=mechanic/briefs/education',
          ),
        );
        expect(names).toContain('pedigree._.md');
        expect(
          names.filter((name) => /^pedigree\.pursuit=v.*\.idempotency\.md$/.test(name)),
        ).toHaveLength(1);
      });

      then('get shows the pursuit and its course', () => {
        expect(read.code).toEqual(0);
        expect(read.stdout).toContain('1. idempotency');
      });

      then('each renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: stamp.stdout, scene })).toMatchSnapshot(
          'pedigree set',
        );
        expect(asFramedOutput({ text: read.stdout, scene })).toMatchSnapshot(
          'pedigree get',
        );
      });
    });

    when('[t7] the graduate stone is passed as its stone says, once stamped', () => {
      const result = useThen('it runs', () =>
        runRhx({
          cmd: 'npx rhx route.stone.set --stone 4.graduate --as passed',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('it passes: the entry stands, and both judges clear', () => {
        expect(result.code).toEqual(0);
        expect(getOnePursuitPassage({ tempDir: scene.tempDir })).toContain(
          '"stone":"4.graduate","status":"passed"',
        );
      });

      then('it renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: result.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t8] the graduated role boots, as rhachet boots it for a session', () => {
      const boot = useThen('it boots', () =>
        runRhx({
          // the mechanic has no boot spec, so rhachet boots every brief it holds
          cmd: 'npx rhachet roles boot --repo .this --role mechanic',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('the boot holds the pedigree and the brief the course wrote', () => {
        expect({ code: boot.code, stderr: boot.stderr }).toEqual({
          code: 0,
          stderr: '',
        });
        expect(boot.stdout).toContain('briefs/education/pedigree._.md');
        expect(boot.stdout).toContain('# pedigree: mechanic');
        expect(boot.stdout).toContain('rule.require.natural-key-upsert.md');
      });

      then('the briefs this journey added boot whole, as the snapshot shows', () => {
        // .why = the whole boot is every brief the role holds, large and owned by rhachet; the
        //        briefs this journey adds (the pedigree index, its entry, the course's brief) are
        //        the contract it owns, so each is snapped whole, tag to close, as a session reads it
        const blocksOfEducation = (
          boot.stdout.match(
            /<brief\.(say|ref) path="[^"]*"[^>]*?(\/>|>[\s\S]*?<\/brief\.say>)/g,
          ) ?? []
        ).filter(
          (block) =>
            block.includes('briefs/education/') ||
            block.includes(
              'path=".agent/repo=.this/role=mechanic/briefs/rule.require.natural-key-upsert.md"',
            ),
        );
        expect(blocksOfEducation).toHaveLength(3);
        expect(
          asFramedOutput({ text: blocksOfEducation.join('\n\n'), scene }),
        ).toMatchSnapshot();
      });
    });

    when('[t9] the boot budget probe faults, as a boot spec rhachet cannot read makes it', () => {
      const result = useThen('the judge runs', async () => {
        // a boot spec that exists but will not parse: rhachet faults with no budget verdict
        const bootPath = path.join(
          scene.tempDir,
          '.agent/repo=.this/role=mechanic/boot.yml',
        );
        fs.writeFileSync(bootPath, 'say: [unclosed\n');
        const pursuit = fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!;
        const run = await runRhx({
          cmd: `npx rhx education.pursuit judge --criterion boot-within-budget --route .route/${pursuit}`,
          cwd: scene.tempDir,
          home: scene.home,
        });
        fs.rmSync(bootPath);
        return run;
      });

      then('it exits 1 under the qualified malfunction header, never as a verdict', () => {
        expect(result.code).toEqual(1);
        expect(result.stdout).not.toContain('passed:');
        expect(result.stderr).toContain(
          '💥 MalfunctionError: the boot budget probe failed',
        );
        expect(result.stderr).toContain('npx rhachet roles boot --what <spec>');
      });

      then('the header renders as the snapshot shows', () => {
        // the stack and the probe's own stderr below it name host paths and line numbers, so only
        // the header line, the one a caller reads first, is pinned
        const header = result.stderr
          .split('\n')
          .find((line) => line.includes('💥 MalfunctionError:'));
        expect(asFramedOutput({ text: header ?? '', scene })).toMatchSnapshot();
      });
    });
  });

  given('[case2] a repo with the learner linked, educated as a mod', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'education-journey-linked',
        clone: ASSETS_DIR,
      });
      const home = path.join(tempDir, '.home');
      fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
      await runRhx({
        cmd: 'git checkout -b human/test-education-linked',
        cwd: tempDir,
        home,
      });
      const init = await runRhx({
        cmd: 'npx rhx init --roles learner --hooks',
        cwd: tempDir,
        home,
      });
      if (init.code !== 0)
        throw new MalfunctionError('rhx init failed in the fixture', {
          code: init.code,
          stderr: init.stderr,
          hint: 'run: npm run build, so dist holds the education skills',
        });
      return { tempDir, home };
    });
    const modDir = '.agent/repo=.mods/role=learner';

    when('[t0] a pursuit opens for the linked learner', () => {
      const open = useThen('pursuit init runs', () =>
        runRhx({
          cmd: 'npx rhx education.pursuit init --for learner --course idempotency',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );
      const render = useThen('a render runs over the seeded mod', () =>
        runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        }),
      );

      then('init names the role linked, and seeds the mod boot spec', () => {
        expect(open.code).toEqual(0);
        expect(open.stdout).toContain('role = learner (linked)');
        expect(
          fs.readFileSync(path.join(scene.tempDir, modDir, 'boot.yml'), 'utf-8'),
        ).toEqual('of: bhrain/learner\n');
      });

      then('a real render accepts the seeded mod', () => {
        expect(render.code).toEqual(0);
      });

      then('the linked init renders as the snapshot shows', () => {
        expect(asFramedOutput({ text: open.stdout, scene })).toMatchSnapshot();
      });
    });

    when('[t1] its course runs to exit, and the pedigree is stamped', () => {
      const result = useThen('the course, exit, and stamp run', async () => {
        const pursuit = fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!;
        fs.writeFileSync(
          path.join(scene.tempDir, '.route', pursuit, '1.courses.plot.yield.md'),
          '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
        );
        const course = await runRhx({
          cmd: 'npx rhx education.pursuit.course init --course idempotency',
          cwd: scene.tempDir,
          home: scene.home,
        });
        setCourseDrivenByHand({
          tempDir: scene.tempDir,
          courseRoute: getOneCourseRoute({ tempDir: scene.tempDir }),
          briefsDir: `${modDir}/briefs`,
          bootPath: `${modDir}/boot.yml`,
        });
        const exit = await runRhx({
          cmd: 'npx rhx education.pursuit.course exit',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const stamp = await runRhx({
          cmd: 'npx rhx education.pedigree set',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const render = await runRhx({
          cmd: 'npx rhx init --roles learner --hooks',
          cwd: scene.tempDir,
          home: scene.home,
        });
        const judge = await runRhx({
          cmd: `npx rhx education.pursuit judge --criterion pedigree-stamped --route .route/${pursuit}`,
          cwd: scene.tempDir,
          home: scene.home,
        });
        return { course, exit, stamp, render, judge };
      });

      then('each step exits 0', () => {
        expect(result.course.code).toEqual(0);
        expect(result.exit.code).toEqual(0);
        expect(result.stamp.code).toEqual(0);
        expect(result.render.code).toEqual(0);
      });

      then(
        'the render puts the pedigree in the role view, and the judge passes',
        () => {
          const dirRendered = path.join(
            scene.tempDir,
            '.agent/repo=bhrain/role=learner/briefs/education',
          );
          expect(fs.readdirSync(dirRendered)).toContain('pedigree._.md');
          expect(result.judge.stdout).toContain('passed: true');
        },
      );

      then('the stamp renders as the snapshot shows', () => {
        expect(
          asFramedOutput({ text: result.stamp.stdout, scene }),
        ).toMatchSnapshot();
      });
    });

    when(
      '[t2] the mod holds a brief its boot spec never names, as case=8 walks it',
      () => {
        const result = useThen('a render runs, then again once fixed', async () => {
          const orphanPath = path.join(
            scene.tempDir,
            modDir,
            'briefs',
            'rule.require.orphan-kernel.md',
          );
          fs.writeFileSync(orphanPath, '# rule.require.orphan-kernel\n');
          const refused = await runRhx({
            cmd: 'npx rhx init --roles learner --hooks',
            cwd: scene.tempDir,
            home: scene.home,
          });
          fs.rmSync(orphanPath);
          const healed = await runRhx({
            cmd: 'npx rhx init --roles learner --hooks',
            cwd: scene.tempDir,
            home: scene.home,
          });
          return { refused, healed };
        });

        then('rhachet refuses the mod and names the unnamed brief', () => {
          expect(result.refused.code).not.toEqual(0);
          expect(
            `${result.refused.stdout}\n${result.refused.stderr}`,
          ).toContain('rule.require.orphan-kernel.md');
        });

        then('once the brief is gone, the render is clean again', () => {
          expect(result.healed.code).toEqual(0);
        });

        then('the refusal renders as the snapshot shows', () => {
          expect(
            asFramedOutput({ text: result.refused.stderr, scene }),
          ).toMatchSnapshot();
        });
      },
    );
  });

  given(
    '[case3] a pursuit whose review asks for a second course, as case=9 walks it',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'education-journey-two-courses',
          clone: ASSETS_DIR,
        });
        const home = path.join(tempDir, '.home');
        fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
        fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
        fs.mkdirSync(
          path.join(tempDir, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
          { recursive: true },
        );
        await runRhx({
          cmd: 'git checkout -b human/test-education-two-courses',
          cwd: tempDir,
          home,
        });
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner,driver --hooks',
          cwd: tempDir,
          home,
        });
        if (init.code !== 0)
          throw new MalfunctionError('rhx init failed in the fixture', {
            code: init.code,
            stderr: init.stderr,
            hint: 'run: npm run build, so dist holds the education skills',
          });
        return { tempDir, home };
      });
      const briefsDir = '.agent/repo=.this/role=mechanic/briefs';

      /**
       * .what = the pursuit route, repo-relative
       */
      const getOnePursuitRoute = (): string =>
        path.join(
          '.route',
          fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!,
        );

      /**
       * .what = one `rhx` call in the scene
       */
      const run = (cmd: string) =>
        runRhx({ cmd: `npx rhx ${cmd}`, cwd: scene.tempDir, home: scene.home });

      when('[t0] the first course is pushed, driven, and popped', () => {
        const result = useThen('it runs', async () => {
          const open = await run(
            'education.pursuit init --for mechanic --course idempotency',
          );
          fs.writeFileSync(
            path.join(scene.tempDir, getOnePursuitRoute(), '1.courses.plot.yield.md'),
            '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
          );
          const push = await run(
            'education.pursuit.course init --course idempotency',
          );
          setCourseDrivenByHand({
            tempDir: scene.tempDir,
            courseRoute: getOneCourseRouteAt({ tempDir: scene.tempDir, ordinal: 1 }),
            briefsDir,
            bootPath: null,
          });
          const pop = await run('education.pursuit.course exit');
          const pursue = await run(
            'route.stone.set --stone 2.courses.pursue --as passed',
          );
          return { open, push, pop, pursue };
        });

        then('each step exits 0, and the pursue stone passes', () => {
          expect(result.open.code).toEqual(0);
          expect(result.push.code).toEqual(0);
          expect(result.pop.code).toEqual(0);
          expect(result.pursue.code).toEqual(0);
          expect(getOnePursuitPassage({ tempDir: scene.tempDir })).toContain(
            '"stone":"2.courses.pursue","status":"passed"',
          );
        });

        then('the pop moves the bind back to the pursuit', () => {
          expect(result.pop.stdout).toContain('bound = the pursuit');
        });

        then('the pop renders as the snapshot shows', () => {
          expect(
            asFramedOutput({ text: result.pop.stdout, scene }),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t1] the review asks for more courses: the plot grows, and pursue is rewound with its yield dropped',
        () => {
          const result = useThen('it runs', async () => {
            const pursuitAbs = path.join(scene.tempDir, getOnePursuitRoute());
            fs.writeFileSync(
              path.join(pursuitAbs, '3.courses.review.yield.md'),
              '- gap: retries are unsafe\n- decision: more courses\n',
            );
            fs.appendFileSync(
              path.join(pursuitAbs, '1.courses.plot.yield.md'),
              '| 2 | retries | backoff | idempotency |\n',
            );
            const rewind = await run(
              'route.stone.set --stone 2.courses.pursue --as rewound --yield drop',
            );
            const pursueEarly = await run(
              'route.stone.set --stone 2.courses.pursue --as passed',
            );
            return { rewind, pursueEarly };
          });

          then('the rewind exits 0, and the stale review is archived', () => {
            expect(result.rewind.code).toEqual(0);
            expect(
              fs.existsSync(
                path.join(
                  scene.tempDir,
                  getOnePursuitRoute(),
                  '3.courses.review.yield.md',
                ),
              ),
            ).toEqual(false);
          });

          then('the first course route stands', () => {
            expect(
              fs.existsSync(
                path.join(
                  scene.tempDir,
                  getOneCourseRouteAt({ tempDir: scene.tempDir, ordinal: 1 }),
                  '6.exit.yield.md',
                ),
              ),
            ).toEqual(true);
          });

          then('the pursue stone holds while the second course is owed', () => {
            expect(result.pursueEarly.code).not.toEqual(0);
            expect(
              `${result.pursueEarly.stdout}\n${result.pursueEarly.stderr}`,
            ).toContain('retries');
          });

          then('the held pursue renders as the snapshot shows, each stream', () => {
            expect(
              asFramedOutput({ text: result.pursueEarly.stdout, scene }),
            ).toMatchSnapshot('stdout');
            expect(
              asFramedOutput({ text: result.pursueEarly.stderr, scene }),
            ).toMatchSnapshot('stderr');
          });
        },
      );

      when('[t2] the second course is pushed at the next ordinal, driven, and popped', () => {
        const result = useThen('it runs', async () => {
          const push = await run('education.pursuit.course init --course retries');
          setCourseDrivenByHand({
            tempDir: scene.tempDir,
            courseRoute: getOneCourseRouteAt({ tempDir: scene.tempDir, ordinal: 2 }),
            briefsDir,
            bootPath: null,
          });
          const pop = await run('education.pursuit.course exit');
          const pursue = await run(
            'route.stone.set --stone 2.courses.pursue --as passed',
          );
          return { push, pop, pursue };
        });

        then('the push lands at course 2, and the pursue stone passes again', () => {
          expect(result.push.code).toEqual(0);
          expect(result.push.stdout).toContain('course=2.retries');
          expect(result.pop.code).toEqual(0);
          expect(result.pursue.code).toEqual(0);
        });

        then('the push renders as the snapshot shows', () => {
          expect(asFramedOutput({ text: result.push.stdout, scene })).toMatchSnapshot();
        });
      });

      when('[t3] the review graduates, and the pedigree holds both courses', () => {
        const result = useThen('it runs', async () => {
          fs.writeFileSync(
            path.join(scene.tempDir, getOnePursuitRoute(), '3.courses.review.yield.md'),
            '- no gap remains\n- decision: graduate\n',
          );
          const review = await run(
            'route.stone.set --stone 3.courses.review --as passed',
          );
          const stamp = await run('education.pedigree set');
          const graduate = await run(
            'route.stone.set --stone 4.graduate --as passed',
          );
          const read = await run('education.pedigree get --for mechanic');
          return { review, stamp, graduate, read };
        });

        then('each step exits 0', () => {
          expect(result.review.code).toEqual(0);
          expect(result.stamp.code).toEqual(0);
          expect(result.graduate.code).toEqual(0);
          expect(result.read.code).toEqual(0);
        });

        then('the pedigree names both courses, the second built on the first', () => {
          expect(result.read.stdout).toContain('1. idempotency');
          expect(result.read.stdout).toContain('2. retries (built on idempotency)');
        });

        then('the read renders as the snapshot shows', () => {
          expect(asFramedOutput({ text: result.read.stdout, scene })).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case4] one course driven 1.1 → 5.2 through every real guard, as case=1 walks it',
    () => {
      // two guarded stones, each with a 30s self-review dwell the test waits out
      jest.setTimeout(240_000);
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'education-journey-drive',
          clone: ASSETS_DIR,
        });
        const home = path.join(tempDir, '.home');
        fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
        fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{}');
        fs.mkdirSync(
          path.join(tempDir, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
          { recursive: true },
        );
        await runRhx({
          cmd: 'git checkout -b human/test-education-drive',
          cwd: tempDir,
          home,
        });
        const init = await runRhx({
          cmd: 'npx rhx init --roles learner,driver --hooks',
          cwd: tempDir,
          home,
        });
        if (init.code !== 0)
          throw new MalfunctionError('rhx init failed in the fixture', {
            code: init.code,
            stderr: init.stderr,
            hint: 'run: npm run build, so dist holds the education skills',
          });
        return { tempDir, home };
      });
      const briefsDir = '.agent/repo=.this/role=mechanic/briefs';
      const run = (cmd: string) =>
        runRhx({ cmd: `npx rhx ${cmd}`, cwd: scene.tempDir, home: scene.home });

      // the self-reviews each guarded stone declares, in its guard's order
      const SELF_REVIEWS_OF_STONE: Record<string, string[]> = {
        '2.2.greats.read': [
          'has-cited-every-kernel-to-a-page-read',
          'has-tagged-claims-honestly',
        ],
        '4.1.entool.blueprint': [
          'has-traced-every-yield-to-a-held-claim',
          'has-traced-every-yield-to-an-outcome',
        ],
      };

      when(
        '[t0] each stone is passed through route.stone.set, each self-review promised when its guard holds',
        () => {
          const result = useThen('the course is driven, then exited', async () => {
            await run(
              'education.pursuit init --for mechanic --course idempotency',
            );
            const pursuit = fs.readdirSync(path.join(scene.tempDir, '.route'))[0]!;
            fs.writeFileSync(
              path.join(scene.tempDir, '.route', pursuit, '1.courses.plot.yield.md'),
              '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
            );
            const push = await run('education.pursuit.course init --course idempotency');
            const courseRoute = getOneCourseRoute({ tempDir: scene.tempDir });
            const routeAbs = path.join(scene.tempDir, courseRoute);

            // the brief the course leaves in the role, as 4.2 writes it
            const brief = path.join(briefsDir, 'rule.require.natural-key-upsert.md');
            fs.writeFileSync(
              path.join(scene.tempDir, brief),
              '# upsert on the natural key\n',
            );

            // drive each stone: write its yield, ask to pass, and promise each review a guard holds for
            const steps: Array<{
              stone: string;
              held: Awaited<ReturnType<typeof run>> | null;
              asks: Array<Awaited<ReturnType<typeof run>>>;
              passed: Awaited<ReturnType<typeof run>>;
            }> = [];
            const promises: Array<Awaited<ReturnType<typeof run>>> = [];
            const refusals: Array<{
              stone: string;
              slug: string;
              refusal: Awaited<ReturnType<typeof run>>;
            }> = [];
            for (const stone of STONES_OF_COURSE) {
              fs.writeFileSync(
                path.join(routeAbs, `${stone}.yield.md`),
                (YIELDS_OF_COURSE[stone] ?? `# ${stone}\n`).replace('$BRIEF', brief),
              );
              const reviews = SELF_REVIEWS_OF_STONE[stone] ?? [];
              const asks: Array<Awaited<ReturnType<typeof run>>> = [];
              for (const slug of reviews) {
                // each review is asked for by a pass attempt: the guard holds and names it
                asks.push(await run(`route.stone.set --stone ${stone} --as passed`));
                const into = path.join(courseRoute, 'review', 'self', `for.${stone}._.${slug}.md`);
                fs.mkdirSync(path.dirname(path.join(scene.tempDir, into)), {
                  recursive: true,
                });
                fs.writeFileSync(
                  path.join(scene.tempDir, into),
                  `# ${slug}\n\nfound: each row reviewed against ${stone}.yield.md. settled: no repair owed.\n`,
                );
                // the guard refuses a promise made inside its 30s dwell on this artifact hash
                // (`getSelfReviewChallengeDecision`); the test waits it out, as a driver must
                const promiseCmd = `route.stone.set --stone ${stone} --as promised --that ${slug} --into ${into}`;
                const hasty = await run(promiseCmd);
                if (hasty.code !== 0) {
                  refusals.push({ stone, slug, refusal: hasty });
                  await new Promise((done) => setTimeout(done, 31_000));
                }
                promises.push(hasty.code === 0 ? hasty : await run(promiseCmd));
              }
              const passed = await run(`route.stone.set --stone ${stone} --as passed`);
              steps.push({ stone, held: asks[0] ?? null, asks, passed });
            }
            const passage = fs.readFileSync(
              path.join(routeAbs, '.route', 'passage.jsonl'),
              'utf-8',
            );
            const exit = await run('education.pursuit.course exit');
            return { push, steps, promises, refusals, passage, exit };
          });

          then('a promise made at once is refused: the guard asks for patience', () => {
            expect(result.refusals.map((r) => `${r.stone} ${r.slug}`)).toEqual(
              Object.entries(SELF_REVIEWS_OF_STONE).flatMap(([stone, slugs]) =>
                slugs.map((slug) => `${stone} ${slug}`),
              ),
            );
            for (const { refusal } of result.refusals) {
              expect(refusal.code).toEqual(2);
              expect(refusal.stdout).toContain('patience, friend');
            }
          });

          then('each promise lands once the dwell has passed', () => {
            expect(result.promises).toHaveLength(4);
            const failed = result.promises.find((p) => p.code !== 0);
            expect({
              codes: result.promises.map((p) => p.code),
              failed: failed ? `${failed.stdout.slice(0, 2500)}` : null,
            }).toEqual({ codes: [0, 0, 0, 0], failed: null });
          });

          then('each guarded stone holds before its self-reviews are promised', () => {
            const guarded = result.steps.filter((step) => step.held !== null);
            expect(guarded.map((step) => step.stone)).toEqual([
              '2.2.greats.read',
              '4.1.entool.blueprint',
            ]);
            // each ask holds the stone and names the review it waits on, in the guard's order
            for (const step of guarded)
              step.asks.forEach((ask, index) => {
                expect(ask.code).not.toEqual(0);
                expect(ask.stdout).toContain(
                  `slug = ${SELF_REVIEWS_OF_STONE[step.stone]![index]!}`,
                );
              });
          });

          then('every stone passes through its own guard, never by hand', () => {
            for (const step of result.steps) {
              expect({ stone: step.stone, code: step.passed.code }).toEqual({
                stone: step.stone,
                code: 0,
              });
              expect(result.passage).toContain(
                `"stone":"${step.stone}","status":"passed"`,
              );
            }
          });

          then('the course exits, since every stone before 6.exit passed', () => {
            expect(result.push.code).toEqual(0);
            expect(result.exit.code).toEqual(0);
            expect(result.exit.stdout).toContain('course = 1. idempotency');
            expect(result.exit.stdout).toContain(
              'stones = all passed, exit recorded',
            );
          });

          then('the release of a self-reviewed stone renders as the snapshot shows', () => {
            const step = result.steps.find((s) => s.stone === '2.2.greats.read')!;
            expect(
              asFramedOutput({ text: step.passed.stdout, scene }),
            ).toMatchSnapshot('2.2 passed');
          });

          then('every hold, the hasty promise refusal, and the accepted promise render as the snapshot shows', () => {
            // each guarded stone's asks, in order: one hold per self-review the guard waits on
            const guarded = result.steps.filter((s) => s.held !== null);
            for (const step of guarded)
              step.asks.forEach((ask, index) =>
                expect(
                  asFramedOutput({ text: ask.stdout, scene }),
                ).toMatchSnapshot(`${step.stone} held ${index + 1}`),
              );
            // every hold and the hasty refusal share one stderr banner: assert each, pin it once
            const stderrs = [
              ...guarded.flatMap((step) => step.asks.map((ask) => ask.stderr)),
              result.refusals[0]!.refusal.stderr,
            ];
            for (const stderr of stderrs) expect(stderr).toEqual(stderrs[0]);
            expect(
              asFramedOutput({ text: stderrs[0]!, scene }),
            ).toMatchSnapshot('a hold, stderr');
            // a promise made at once, and the one that lands after the dwell
            expect(
              asFramedOutput({ text: result.refusals[0]!.refusal.stdout, scene }),
            ).toMatchSnapshot('promise refused at once');
            // the accepted reply repeats the next review's guide, held above; pin only its head
            const acceptedHead = result.promises[0]!.stdout.split('🌕')[0]!;
            expect(acceptedHead).toContain(
              'passage = progressed (review.self 1/2 promised)',
            );
            expect(
              asFramedOutput({ text: acceptedHead, scene }),
            ).toMatchSnapshot('promise accepted, head');
          });
        },
      );
    },
  );
});
