import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { today } from 'iso-time';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { asEducationRefusalLines } from '@src/contract/cli/asEducationRefusalLines';
import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';
import { asRouteBindFlagName } from '@src/domain.operations/route/bind/asRouteBindFlagName';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { setStoneAsRewound } from '@src/domain.operations/route/stones/setStoneAsRewound';

import { setCourseDriven } from './.test/setCourseDriven';
import { asPedigreeCourse } from './asPedigreeCourse';
import { asPedigreeEntryMarkdown } from './asPedigreeEntryMarkdown';
import { asPursuitDate } from './asPursuitDate';
import { exitCourseRoute } from './exitCourseRoute';
import { getAllPedigreeEntries } from './getAllPedigreeEntries';
import type { CourseProof } from './getOneCourseProof';
import { getOneEducationJudgeVerdict } from './getOneEducationJudgeVerdict';
import { initCourseRoute } from './initCourseRoute';
import { initPursuitRoute } from './initPursuitRoute';
import { setPedigreeEntry } from './setPedigreeEntry';

// .note = js-yaml ships no types; required as the rest of src does (getOneRepoManifest.ts)
const yaml = require('js-yaml');

/**
 * .what = a refusal as the caller reads it, else the raw message
 * .why = the cli renders each BadRequestError through `asEducationRefusalLines`; a snapshot pins
 *        that treestruct, never the raw message with its json metadata. any other error is a
 *        malfunction the cli rethrows, so its message is what a caller would see
 */
const asRefusalText = (input: { error: Error }): string =>
  input.error instanceof BadRequestError
    ? asEducationRefusalLines({ error: input.error }).join('\n')
    : input.error.message;

/**
 * .what = the route the branch is bound to now
 */
const getRouteBound = async (): Promise<string> =>
  (await getRouteBindByBranch({ branch: null }))!.route;

/**
 * .what = a step's artifact with its temp root, pursuit dates, and iso dates masked
 * .why = each step is snapped so the arc reads from the snapshots alone; a snapshot must not
 *        drift with the day or the temp dir it ran in
 */
const asSnapMasked = (input: { text: string; repoRoot: string }): string =>
  input.text
    .split(input.repoRoot)
    .join('$REPO')
    .replace(/\d{4}_\d{2}_\d{2}/g, '$DATE')
    .replace(/\d{4}-\d{2}-\d{2}/g, '$DATE');

describe('education journey', () => {
  given('[case1] a repo with a native mechanic, on a feature branch', () => {
    const repoRoot = genTempDir({ slug: 'test-education-journey', git: true });
    const originalCwd = process.cwd();
    const roleDir = path.join(
      repoRoot,
      '.agent',
      'repo=.this',
      'role=mechanic',
    );

    beforeAll(() => {
      execSync('git checkout -b human/test-education', { cwd: repoRoot });
      mkdirSync(path.join(roleDir, 'briefs'), { recursive: true });
      writeFileSync(
        path.join(roleDir, 'boot.yml'),
        'always:\n  briefs:\n    say:\n      # identity\n      - briefs/im_a.mechanic.md\n',
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] a course init runs before any pursuit', () => {
      then('it refuses, and names education.pursuit init', async () => {
        const error = await getError(
          initCourseRoute({ repoRoot, course: 'idempotency' }),
        );
        expect(error.message).toContain('a course runs only within a pursuit');
        expect(error.message).toContain('rhx education.pursuit init');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] a pursuit opens for an unknown role', () => {
      then('it refuses, with the roles found', async () => {
        const error = await getError(
          initPursuitRoute({
            repoRoot,
            role: 'ghost',
            slug: null,
            courses: ['idempotency'],
          }),
        );
        expect(error.message).toContain('no role ghost in this repo');
        expect(error.message).toContain('mechanic (native)');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });

    when('[t1.1] a pursuit opens for a role slug that is not kebab', () => {
      then('it refuses before any bind, and names the slug', async () => {
        const error = await getError(
          initPursuitRoute({
            repoRoot,
            role: 'Mech_X',
            slug: null,
            courses: ['idempotency'],
          }),
        );
        expect(error.message).toContain('a slug must be lowercase kebab');
        expect(error.message).toContain('Mech_X');
        expect(await getRouteBindByBranch({ branch: null })).toEqual(null);
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the journey runs: init → course → exit → pedigree', () => {
      then(
        'init opens the pursuit, slug from its one course, and binds it',
        async () => {
          const result = await initPursuitRoute({
            repoRoot,
            role: 'mechanic',
            slug: null,
            courses: ['idempotency'],
          });
          expect(result.route).toMatch(
            /^\.route\/v\d{4}_\d{2}_\d{2}\.education\.pursuit\.mechanic\.idempotency$/,
          );
          expect(result.role.kind).toEqual('native');
          expect(result.created).toContain('2.courses.pursue.guard');
          expect(await getRouteBound()).toEqual(result.route);
          const wish = readFileSync(
            path.join(repoRoot, result.route, '0.wish.md'),
            'utf-8',
          );
          expect(wish).toContain('1. idempotency');
          expect(
            asSnapMasked({
              text: [...result.created, '', wish].join('\n'),
              repoRoot,
            }),
          ).toMatchSnapshot();
        },
      );

      then('a re-run of init keeps every file', async () => {
        const result = await initPursuitRoute({
          repoRoot,
          role: 'mechanic',
          slug: null,
          courses: ['idempotency'],
        });
        expect(result.created).toEqual([]);
        expect(
          asSnapMasked({ text: result.kept.join('\n'), repoRoot }),
        ).toMatchSnapshot();
      });

      then('a course the plot never names is refused', async () => {
        const pursuit = await getRouteBound();
        writeFileSync(
          path.join(pursuit, '1.courses.plot.yield.md'),
          '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
        );
        const error = await getError(
          initCourseRoute({ repoRoot, course: 'retries' }),
        );
        expect(error.message).toContain('is not next in the plot');
        expect(error.message).toContain('--course idempotency');
        expect(await getRouteBound()).toEqual(pursuit);
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });

      then('course init pushes the bind into the course', async () => {
        const pursuit = await getRouteBound();
        writeFileSync(
          path.join(pursuit, '1.courses.plot.yield.md'),
          '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
        );
        const result = await initCourseRoute({
          repoRoot,
          course: 'idempotency',
        });
        expect(result.ordinal).toEqual(1);
        expect(result.route).toEqual(
          path.join(pursuit, '2.courses.pursue.yield', 'course=1.idempotency'),
        );
        expect(await getRouteBound()).toEqual(result.route);
        const stone = readFileSync(
          path.join(result.route, '1.1.outcome.declare.stone'),
          'utf-8',
        );
        expect(stone).toContain('course 1, `idempotency`');
        expect(asSnapMasked({ text: stone, repoRoot })).toMatchSnapshot();
      });

      then('a second course init inside the course refuses', async () => {
        const error = await getError(
          initCourseRoute({ repoRoot, course: 'retries' }),
        );
        expect(error.message).toContain('already within a course');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });

      then(
        'a re-run of pursuit init inside the course refuses, and names exit',
        async () => {
          const course = await getRouteBound();
          const error = await getError(
            initPursuitRoute({
              repoRoot,
              role: 'mechanic',
              slug: null,
              courses: ['idempotency'],
            }),
          );
          expect(error.message).toContain(
            'the branch is inside a course of this pursuit',
          );
          expect(error.message).toContain('rhx education.pursuit.course exit');
          expect(error.message).not.toContain('route.bind.del');
          expect(await getRouteBound()).toEqual(course);
          expect(
            asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
          ).toMatchSnapshot();
        },
      );

      then('the pursue judge holds while the course is open', async () => {
        const pursuit = path.dirname(path.dirname(await getRouteBound()));
        const verdict = await getOneEducationJudgeVerdict({
          repoRoot,
          route: pursuit,
          criterion: 'courses-exited',
        });
        expect(verdict.passed).toEqual(false);
        expect(verdict.reason).toContain('idempotency');
        expect(verdict).toMatchSnapshot();
      });

      then('exit refuses before the stones pass, and names them', async () => {
        const error = await getError(exitCourseRoute({ repoRoot }));
        expect(error.message).toContain(
          'a course exits only once its stones have passed',
        );
        expect(error.message).toContain('1.1.outcome.declare');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });

      then('the exit judge refuses a hand pass before exit', async () => {
        const course = await getRouteBound();
        const verdict = await getOneEducationJudgeVerdict({
          repoRoot,
          route: course,
          criterion: 'exited',
        });
        expect(verdict.passed).toEqual(false);
        expect(verdict).toMatchSnapshot();
      });

      then('a hand-written exit yield fakes no exit', async () => {
        const course = await getRouteBound();
        const forged = path.join(course, '6.exit.yield.md');
        writeFileSync(forged, '# exit: forged by hand\n');
        const verdictExit = await getOneEducationJudgeVerdict({
          repoRoot,
          route: course,
          criterion: 'exited',
        });
        expect(verdictExit.passed).toEqual(false);
        expect(verdictExit.reason).toContain('stones not yet passed');
        const verdictPursue = await getOneEducationJudgeVerdict({
          repoRoot,
          route: path.dirname(path.dirname(course)),
          criterion: 'courses-exited',
        });
        expect(verdictPursue.passed).toEqual(false);
        expect({ verdictExit, verdictPursue }).toMatchSnapshot();
        rmSync(forged);
      });

      then(
        'a hand-written exit yield fakes no exit, even once every prior stone passed',
        async () => {
          const course = await getRouteBound();
          await setCourseDriven({ route: course });
          const forged = path.join(course, '6.exit.yield.md');
          writeFileSync(forged, '# exit: forged by hand\n');
          const verdictExit = await getOneEducationJudgeVerdict({
            repoRoot,
            route: course,
            criterion: 'exited',
          });
          expect(verdictExit.passed).toEqual(false);
          expect(verdictExit.reason).toContain('a course ends only by exit');
          expect(verdictExit).toMatchSnapshot();
          rmSync(forged);
        },
      );

      then(
        'exit pops the bind back to the pursuit once the stones pass',
        async () => {
          const course = await getRouteBound();
          await setCourseDriven({ route: course });
          const result = await exitCourseRoute({ repoRoot });
          expect(result.slug).toEqual('idempotency');
          expect(await getRouteBound()).toEqual(result.pursuitRoute);
          expect(existsSync(path.join(course, '6.exit.yield.md'))).toEqual(
            true,
          );
          expect(
            asSnapMasked({
              text: readFileSync(path.join(course, '6.exit.yield.md'), 'utf-8'),
              repoRoot,
            }),
          ).toMatchSnapshot();
          expect(
            (
              await getOneEducationJudgeVerdict({
                repoRoot,
                route: course,
                criterion: 'exited',
              })
            ).passed,
          ).toEqual(true);
          expect(
            (
              await getOneEducationJudgeVerdict({
                repoRoot,
                route: result.pursuitRoute,
                criterion: 'courses-exited',
              })
            ).passed,
          ).toEqual(true);
        },
      );

      then('a second exit, from the pursuit, names the pursuit', async () => {
        const error = await getError(exitCourseRoute({ repoRoot }));
        expect(error.message).toContain('exit runs only within a course');
        expect(error.message).toContain(
          'the branch already stands on the pursuit',
        );
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });

      then('a course init for the exited course refuses', async () => {
        const error = await getError(
          initCourseRoute({ repoRoot, course: 'idempotency' }),
        );
        expect(error.message).toContain('has already exited');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });

      then(
        'pedigree set stamps the entry, the index, and the boot spec',
        async () => {
          const result = await setPedigreeEntry({ repoRoot, from: null });
          expect(result.entry.courses).toEqual([
            expect.objectContaining({
              slug: 'idempotency',
              baseline: '1/4',
              after: '4/4',
              transfer: 'passed',
              greats: ['helland', 'kleppmann'],
              claimsHeld: 1,
              claimsRefuted: 1,
              briefs: 1,
            }),
          ]);
          const boot = readFileSync(path.join(roleDir, 'boot.yml'), 'utf-8');
          expect(boot).toContain('      - briefs/education/pedigree._.md');
          expect(boot).toContain(
            `      - briefs/education/${path.basename(result.entryPath)}`,
          );
          expect(boot).toContain('      # identity');
          expect(
            asSnapMasked({
              text: [
                readFileSync(result.entryPath, 'utf-8'),
                '--- boot.yml ---',
                boot,
              ].join('\n'),
              repoRoot,
            }),
          ).toMatchSnapshot();
          expect(
            (
              await getOneEducationJudgeVerdict({
                repoRoot,
                route: result.entry.route,
                criterion: 'pedigree-stamped',
              })
            ).passed,
          ).toEqual(true);
        },
      );

      then(
        'the graduate guard holds once the stamp pushes the boot past its budget',
        async () => {
          const bootPath = path.join(roleDir, 'boot.yml');
          const bootStamped = readFileSync(bootPath, 'utf-8');
          const route = await getRouteBound();

          // no budget declared: the boot holds
          const verdictFree = await getOneEducationJudgeVerdict({
            repoRoot,
            route,
            criterion: 'boot-within-budget',
          });
          expect(verdictFree.passed).toEqual(true);

          // a budget the stamped pedigree overruns: the graduate stone holds
          writeFileSync(bootPath, `budget:\n  tokens: 50\n${bootStamped}`);
          const verdictBreach = await getOneEducationJudgeVerdict({
            repoRoot,
            route,
            criterion: 'boot-within-budget',
          });
          writeFileSync(bootPath, bootStamped);
          expect(verdictBreach.passed).toEqual(false);
          expect(verdictBreach.reason).toContain(
            "the role's boot exceeds its declared budget",
          );
          expect(verdictBreach.reason).toContain('move a say entry to ref');
          expect(
            asSnapMasked({ text: verdictBreach.reason, repoRoot }),
          ).toMatchSnapshot();
        },
      );

      then('a re-stamp converges: same files, no twin row', async () => {
        const index = path.join(
          roleDir,
          'briefs',
          'education',
          'pedigree._.md',
        );
        const before = readFileSync(index, 'utf-8');
        const bootBefore = readFileSync(
          path.join(roleDir, 'boot.yml'),
          'utf-8',
        );
        await setPedigreeEntry({ repoRoot, from: null });
        expect(readFileSync(index, 'utf-8')).toEqual(before);
        expect(readFileSync(path.join(roleDir, 'boot.yml'), 'utf-8')).toEqual(
          bootBefore,
        );
        expect(
          before.replace(/v\d{4}_\d{2}_\d{2}/g, 'v$DATE'),
        ).toMatchSnapshot();
      });

      then('pedigree get reads the record back', () => {
        const pedigrees = getAllPedigreeEntries({ repoRoot, role: 'mechanic' });
        expect(pedigrees[0]!.entries).toHaveLength(1);
        expect(pedigrees[0]!.entries[0]!.slug).toEqual('idempotency');
        expect(
          asSnapMasked({ text: JSON.stringify(pedigrees, null, 2), repoRoot }),
        ).toMatchSnapshot();
      });

      then(
        'a re-init on the day it graduated refuses, and keeps the record',
        async () => {
          const error = await getError(
            initPursuitRoute({
              repoRoot,
              role: 'mechanic',
              slug: null,
              courses: ['idempotency'],
            }),
          );
          expect(error.message).toContain('already graduated today');
          expect(
            asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] a branch that cannot take the bind', () => {
    const repoRoot = genTempDir({ slug: 'test-education-nobind', git: true });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -B main', { cwd: repoRoot });
      mkdirSync(path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic'), {
        recursive: true,
      });
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] init runs on main', () => {
      then('it refuses before any write', async () => {
        const error = await getError(
          initPursuitRoute({
            repoRoot,
            role: 'mechanic',
            slug: null,
            courses: ['idempotency'],
          }),
        );
        expect(error.message).toContain('protected branch');
        expect(existsSync(path.join(repoRoot, '.route'))).toEqual(false);
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] init runs while another route is bound', () => {
      then('it refuses before any write', async () => {
        execSync('git checkout -b human/test-other', { cwd: repoRoot });
        const other = path.join('.behavior', 'v2026_01_01.other');
        mkdirSync(path.join(repoRoot, other, '.route'), { recursive: true });
        writeFileSync(
          path.join(
            repoRoot,
            other,
            '.route',
            asRouteBindFlagName({ branch: 'human/test-other' }),
          ),
          'branch: human/test-other\n',
        );
        const error = await getError(
          initPursuitRoute({
            repoRoot,
            role: 'mechanic',
            slug: null,
            courses: ['idempotency'],
          }),
        );
        expect(error.message).toContain('already bound to');
        expect(error.message).toContain('fresh branch');
        expect(error.message).not.toContain('route.bind.del');
        expect(existsSync(path.join(repoRoot, '.route'))).toEqual(false);
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] a pursuit whose plot drops a course while it is open', () => {
    const repoRoot = genTempDir({ slug: 'test-education-stray', git: true });
    const originalCwd = process.cwd();
    const asPlot = (input: { courses: string[] }): string =>
      [
        '| k | course | subject | builds on |',
        '|---|---|---|---|',
        ...input.courses.map((course, i) => `| ${i + 1} | ${course} | s | — |`),
        '',
      ].join('\n');

    beforeAll(() => {
      execSync('git checkout -b human/test-education-stray', { cwd: repoRoot });
      mkdirSync(
        path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
        { recursive: true },
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] a course init runs before the plot is written', () => {
      then('it refuses, and names the plot stone to drive', async () => {
        await initPursuitRoute({
          repoRoot,
          role: 'mechanic',
          slug: 'reliable-writes',
          courses: ['idempotency', 'retries'],
        });
        const error = await getError(
          initCourseRoute({ repoRoot, course: 'idempotency' }),
        );
        expect(error.message).toContain('the pursuit has no plot yet');
        expect(error.message).toContain('drive 1.courses.plot first');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the open second course is dropped from the plot', () => {
      then(
        'the pursue judge holds on the stray, and pedigree set refuses alike',
        async () => {
          const pursuit = await getRouteBound();
          const plotPath = path.join(pursuit, '1.courses.plot.yield.md');
          writeFileSync(
            plotPath,
            asPlot({ courses: ['idempotency', 'retries'] }),
          );
          const first = await initCourseRoute({
            repoRoot,
            course: 'idempotency',
          });
          await setCourseDriven({ route: first.route });
          await exitCourseRoute({ repoRoot });
          await initCourseRoute({ repoRoot, course: 'retries' });
          writeFileSync(plotPath, asPlot({ courses: ['idempotency'] }));

          const verdict = await getOneEducationJudgeVerdict({
            repoRoot,
            route: pursuit,
            criterion: 'courses-exited',
          });
          expect(verdict.passed).toEqual(false);
          expect(verdict.reason).toContain(
            'course retries is open, though the plot no longer names it',
          );
          expect(verdict.reason).toContain('--course retries');

          const error = await getError(
            setPedigreeEntry({ repoRoot, from: pursuit }),
          );
          expect(error.message).toContain(
            'a pursuit graduates only once every course has exited',
          );
          expect(error.message).toContain('--course retries');
          expect(
            asSnapMasked({
              text: [verdict.reason, '', asRefusalText({ error })].join('\n'),
              repoRoot,
            }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case13] a pursuit of two courses, walked through each refusal of course init and pedigree set',
    () => {
      const repoRoot = genTempDir({
        slug: 'test-education-refusals',
        git: true,
      });
      const originalCwd = process.cwd();
      const asPlot = (input: { courses: string[] }): string =>
        [
          '| k | course | subject | builds on |',
          '|---|---|---|---|',
          ...input.courses.map(
            (course, i) => `| ${i + 1} | ${course} | s | — |`,
          ),
          '',
        ].join('\n');

      beforeAll(() => {
        execSync('git checkout -b human/test-education-refusals', {
          cwd: repoRoot,
        });
        mkdirSync(
          path.join(
            repoRoot,
            '.agent',
            'repo=.this',
            'role=mechanic',
            'briefs',
          ),
          { recursive: true },
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] pedigree set runs before any course is pursued', () => {
        then('it refuses, and names course init', async () => {
          const pursuit = await initPursuitRoute({
            repoRoot,
            role: 'mechanic',
            slug: 'reliable-writes',
            courses: ['idempotency', 'retries'],
          });
          writeFileSync(
            path.join(pursuit.route, '1.courses.plot.yield.md'),
            asPlot({ courses: ['idempotency', 'retries'] }),
          );
          const error = await getError(
            setPedigreeEntry({ repoRoot, from: null }),
          );
          expect(error.message).toContain(
            'a pursuit with no course cannot graduate',
          );
          expect(error.message).toContain('rhx education.pursuit.course init');
          expect(
            asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] course init runs with a slug that is not kebab', () => {
        then('it refuses before any read, and names the slug', async () => {
          const error = await getError(
            initCourseRoute({ repoRoot, course: 'Retries_X' }),
          );
          expect(error.message).toContain(
            'a course slug must be lowercase kebab',
          );
          expect(error.message).toContain('Retries_X');
          expect(
            asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t2] the bind returns to the pursuit while the first course is open, and the second is inited',
        () => {
          then(
            'it refuses, and names the open course to re-enter',
            async () => {
              const pursuit = await getRouteBound();
              await initCourseRoute({ repoRoot, course: 'idempotency' });
              await delRouteBind();
              await setRouteBind({ route: pursuit });
              const error = await getError(
                initCourseRoute({ repoRoot, course: 'retries' }),
              );
              expect(error.message).toContain('a prior course has not exited');
              expect(error.message).toContain('--course idempotency');
              expect(
                asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
              ).toMatchSnapshot();
            },
          );
        },
      );

      when(
        '[t3] the first course exits, and pedigree set runs while the second is still owed',
        () => {
          then('it refuses, and names the owed course', async () => {
            // the fix the t2 refusal names: re-enter the open course. it keeps its ordinal and files
            const course = await initCourseRoute({
              repoRoot,
              course: 'idempotency',
            });
            expect({
              ordinal: course.ordinal,
              created: course.created,
              bound: await getRouteBound(),
            }).toEqual({ ordinal: 1, created: [], bound: course.route });
            expect(
              asSnapMasked({
                text: JSON.stringify(
                  {
                    route: course.route,
                    ordinal: course.ordinal,
                    created: course.created,
                    kept: course.kept,
                  },
                  null,
                  2,
                ),
                repoRoot,
              }),
            ).toMatchSnapshot('re-enter of the open course');
            await setCourseDriven({ route: course.route });
            await exitCourseRoute({ repoRoot });
            const error = await getError(
              setPedigreeEntry({ repoRoot, from: null }),
            );
            expect(error.message).toContain(
              'a pursuit graduates only once every plotted course has exited',
            );
            expect(error.message).toContain('retries');
            expect(
              asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
            ).toMatchSnapshot();
          });
        },
      );

      when(
        '[t4] the plot drops the second course, and course init asks for it',
        () => {
          then('it refuses, and names the plot to append to', async () => {
            const pursuit = await getRouteBound();
            writeFileSync(
              path.join(pursuit, '1.courses.plot.yield.md'),
              asPlot({ courses: ['idempotency'] }),
            );
            const error = await getError(
              initCourseRoute({ repoRoot, course: 'retries' }),
            );
            expect(error.message).toContain(
              'the plot names no course left to pursue',
            );
            expect(error.message).toContain('append it to');
            expect(
              asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case7] a native role with no boot spec, graduated, then retaken',
    () => {
      const repoRoot = genTempDir({ slug: 'test-education-retake', git: true });
      const originalCwd = process.cwd();
      const roleDir = path.join(
        repoRoot,
        '.agent',
        'repo=.this',
        'role=mechanic',
      );
      const pedigreeDir = path.join(roleDir, 'briefs', 'education');
      const dateToday = asPursuitDate({ day: today() });
      const datePrior = '2026_01_05';
      const plot =
        '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n';

      /**
       * .what = drive the bound pursuit's one course to its exit
       */
      const setPursuitCoursesExited = async (input: { pursuit: string }) => {
        writeFileSync(
          path.join(input.pursuit, '1.courses.plot.yield.md'),
          plot,
        );
        const course = await initCourseRoute({
          repoRoot,
          course: 'idempotency',
        });
        await setCourseDriven({ route: course.route });
        await exitCourseRoute({ repoRoot });
      };

      beforeAll(() => {
        execSync('git checkout -b human/test-education-retake', {
          cwd: repoRoot,
        });
        mkdirSync(path.join(roleDir, 'briefs'), { recursive: true });
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] the first pursuit graduates', () => {
        then(
          'set writes the entry and index, names no boot spec, and the judge passes',
          async () => {
            const pursuit = await initPursuitRoute({
              repoRoot,
              role: 'mechanic',
              slug: null,
              courses: ['idempotency'],
            });
            await setPursuitCoursesExited({ pursuit: pursuit.route });
            const result = await setPedigreeEntry({ repoRoot, from: null });
            expect(result.bootPath).toEqual(null);
            expect(existsSync(path.join(roleDir, 'boot.yml'))).toEqual(false);
            expect(existsSync(path.join(repoRoot, result.entryPath))).toEqual(
              true,
            );
            const verdict = await getOneEducationJudgeVerdict({
              repoRoot,
              route: pursuit.route,
              criterion: 'pedigree-stamped',
            });
            expect(verdict).toEqual({
              passed: true,
              reason: 'the pedigree entry is stamped',
            });
            expect(
              asSnapMasked({
                text: [
                  `entry = ${result.entryPath}`,
                  `boot = ${result.bootPath}`,
                  '',
                  readFileSync(path.join(repoRoot, result.entryPath), 'utf-8'),
                ].join('\n'),
                repoRoot,
              }),
            ).toMatchSnapshot();
          },
        );
      });

      when(
        '[t1] the graduation is dated earlier, and the slug is retaken',
        () => {
          then(
            'a damaged peer entry refuses the stamp with naught written; once repaired, the pedigree holds both',
            async () => {
              // move the first graduation to a prior date: its route and its entry; the branch
              // stays bound to it, as a graduation leaves it
              const routeToday = `.route/v${dateToday}.education.pursuit.mechanic.idempotency`;
              const routePrior = `.route/v${datePrior}.education.pursuit.mechanic.idempotency`;
              execSync(`mv ${routeToday} ${routePrior}`, { cwd: repoRoot });
              const entryToday = `pedigree.pursuit=v${dateToday}.idempotency.md`;
              const entryPrior = `pedigree.pursuit=v${datePrior}.idempotency.md`;
              writeFileSync(
                path.join(pedigreeDir, entryPrior),
                readFileSync(path.join(pedigreeDir, entryToday), 'utf-8')
                  .split(dateToday)
                  .join(datePrior),
              );
              rmSync(path.join(pedigreeDir, entryToday));

              // the retake opens a new route, dated today, and takes the bind off the graduated one
              expect(await getRouteBound()).toEqual(routePrior);
              const retake = await initPursuitRoute({
                repoRoot,
                role: 'mechanic',
                slug: null,
                courses: ['idempotency'],
              });
              expect(retake.route).toEqual(routeToday);
              expect(await getRouteBound()).toEqual(routeToday);
              await setPursuitCoursesExited({ pursuit: retake.route });

              // a damaged peer entry: the stamp refuses, and writes no entry
              const indexBefore = readFileSync(
                path.join(pedigreeDir, 'pedigree._.md'),
                'utf-8',
              );
              const broken = path.join(
                pedigreeDir,
                `pedigree.pursuit=v2026_01_01.broken.md`,
              );
              writeFileSync(
                broken,
                '# pedigree: mechanic · v2026_01_01 broken\n',
              );
              const error = await getError(
                setPedigreeEntry({ repoRoot, from: null }),
              );
              expect(error.message).toContain(
                'a pedigree entry names no route',
              );
              expect(existsSync(path.join(pedigreeDir, entryToday))).toEqual(
                false,
              );
              expect(
                readFileSync(path.join(pedigreeDir, 'pedigree._.md'), 'utf-8'),
              ).toEqual(indexBefore);
              const verdictHeld = await getOneEducationJudgeVerdict({
                repoRoot,
                route: retake.route,
                criterion: 'pedigree-stamped',
              });
              expect(verdictHeld.passed).toEqual(false);

              // repaired: the stamp lands, and the index holds both pursuits
              rmSync(broken);
              await setPedigreeEntry({ repoRoot, from: null });
              const index = readFileSync(
                path.join(pedigreeDir, 'pedigree._.md'),
                'utf-8',
              );
              expect(index).toContain(`\`${entryPrior}\``);
              expect(index).toContain(`\`${entryToday}\``);
              const [pedigree] = getAllPedigreeEntries({
                repoRoot,
                role: 'mechanic',
              });
              expect(pedigree!.entries.map((entry) => entry.date)).toEqual([
                datePrior,
                dateToday,
              ]);
              // the prior date is named apart, so the two rows read as two dates once masked
              expect(
                asSnapMasked({
                  text: [asRefusalText({ error }), '', index]
                    .join('\n')
                    .split(datePrior)
                    .join('$DATE_PRIOR'),
                  repoRoot,
                }),
              ).toMatchSnapshot();
            },
          );
        },
      );

      when('[t2] the entry stands but the index never got its row', () => {
        then('the graduate judge holds, and names the re-stamp', async () => {
          const routeToday = `.route/v${dateToday}.education.pursuit.mechanic.idempotency`;
          const indexPath = path.join(pedigreeDir, 'pedigree._.md');
          const index = readFileSync(indexPath, 'utf-8');
          writeFileSync(
            indexPath,
            index
              .split('\n')
              .filter((line) => !line.includes(`v${dateToday}`))
              .join('\n'),
          );
          const verdict = await getOneEducationJudgeVerdict({
            repoRoot,
            route: routeToday,
            criterion: 'pedigree-stamped',
          });
          expect(verdict.passed).toEqual(false);
          expect(verdict.reason).toContain(
            'the pedigree index does not list the entry',
          );
          expect(
            asSnapMasked({ text: verdict.reason, repoRoot }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case8] a pursuit whose plot has faults', () => {
    const repoRoot = genTempDir({ slug: 'test-education-plotbad', git: true });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-education-plotbad', {
        cwd: repoRoot,
      });
      mkdirSync(
        path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
        { recursive: true },
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] the plot names a slug in backticks', () => {
      then(
        'the plot judge holds, and course init refuses with the fault named',
        async () => {
          const pursuit = await initPursuitRoute({
            repoRoot,
            role: 'mechanic',
            slug: 'reliable-writes',
            courses: [],
          });
          writeFileSync(
            path.join(pursuit.route, '1.courses.plot.yield.md'),
            '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | `idempotency` | converge | — |\n',
          );
          const verdict = await getOneEducationJudgeVerdict({
            repoRoot,
            route: pursuit.route,
            criterion: 'plot-valid',
          });
          expect(verdict.passed).toEqual(false);
          expect(verdict.reason).toContain('is no lowercase kebab slug');
          const error = await getError(
            initCourseRoute({ repoRoot, course: 'idempotency' }),
          );
          expect(error.message).toContain('the plot has faults');
          expect(
            asSnapMasked({
              text: [verdict.reason, '', asRefusalText({ error })].join('\n'),
              repoRoot,
            }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t1] the plot is repaired', () => {
      then('the plot judge passes', async () => {
        const pursuit = await getRouteBound();
        writeFileSync(
          path.join(pursuit, '1.courses.plot.yield.md'),
          '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
        );
        const verdict = await getOneEducationJudgeVerdict({
          repoRoot,
          route: pursuit,
          criterion: 'plot-valid',
        });
        expect(verdict.passed).toEqual(true);
        expect(
          asSnapMasked({ text: verdict.reason, repoRoot }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case6] a pedigree set whose --from leaves the repo', () => {
    const repoRoot = genTempDir({ slug: 'test-education-fromout', git: true });

    when('[t0] --from names a path outside the repo', () => {
      then('it refuses before any read, and names the form', async () => {
        const error = await getError(
          setPedigreeEntry({
            repoRoot,
            from: '../elsewhere/.route/v2026_11_23.education.pursuit.mechanic.x',
          }),
        );
        expect(error.message).toContain(
          '--from must name a route inside this repo',
        );
        expect(error.message).toContain('pass --from .route/');
        expect(
          asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] a linked role with no mod yet, graduated end to end', () => {
    const repoRoot = genTempDir({ slug: 'test-education-modseed', git: true });
    const originalCwd = process.cwd();
    const modDir = path.join(
      repoRoot,
      '.agent',
      'repo=.mods',
      'role=architect',
    );

    beforeAll(() => {
      execSync('git checkout -b human/test-education-modseed', {
        cwd: repoRoot,
      });
      mkdirSync(
        path.join(
          repoRoot,
          '.agent',
          'repo=bhuild',
          'role=architect',
          'briefs',
        ),
        { recursive: true },
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] the pursuit runs to pedigree set', () => {
      then(
        'init seeds the mod boot spec with its `of:`, and set names the pedigree in it',
        async () => {
          const pursuit = await initPursuitRoute({
            repoRoot,
            role: 'architect',
            slug: null,
            courses: ['boundaries'],
          });
          expect(pursuit.role.kind).toEqual('linked');

          // the mod's boot spec stands before any course reaches 4.2
          expect(pursuit.created).toContain(
            '.agent/repo=.mods/role=architect/boot.yml',
          );
          expect(readFileSync(path.join(modDir, 'boot.yml'), 'utf-8')).toEqual(
            'of: bhuild/architect\n',
          );
          writeFileSync(
            path.join(pursuit.route, '1.courses.plot.yield.md'),
            '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | boundaries | seams | — |\n',
          );
          const course = await initCourseRoute({
            repoRoot,
            course: 'boundaries',
          });
          await setCourseDriven({ route: course.route });
          await exitCourseRoute({ repoRoot });
          const result = await setPedigreeEntry({ repoRoot, from: null });

          expect(result.bootPath).toEqual(
            '.agent/repo=.mods/role=architect/boot.yml',
          );
          // the published role has no boot.yml, so it is in simple mode, and so is its mod
          const boot = readFileSync(path.join(modDir, 'boot.yml'), 'utf-8');
          const parsed = yaml.load(boot);
          expect(parsed.of).toEqual('bhuild/architect');
          expect(parsed.always).toBeUndefined();
          expect(parsed.briefs.say).toEqual([
            'briefs/rule.x.md',
            'briefs/education/pedigree._.md',
          ]);
          expect(parsed.briefs.ref).toEqual([
            `briefs/education/${path.basename(result.entryPath)}`,
          ]);
          expect(asSnapMasked({ text: boot, repoRoot })).toMatchSnapshot();

          // the stamp reads the simple mod as booted, so the judge passes past the boot spec
          const verdict = await getOneEducationJudgeVerdict({
            repoRoot,
            route: pursuit.route,
            criterion: 'pedigree-stamped',
          });
          expect(verdict.reason).not.toContain('the boot spec does not name');
        },
      );
    });
  });

  given(
    '[case11] a linked role whose publisher shipped a pedigree, educated again here',
    () => {
      const repoRoot = genTempDir({
        slug: 'test-education-shipped',
        git: true,
      });
      const originalCwd = process.cwd();
      const shippedDir = path.join(
        repoRoot,
        '.agent/repo=bhuild/role=architect/briefs/education',
      );
      const shippedRoute =
        '.route/v2026_01_01.education.pursuit.architect.seams';
      const shippedProofs: CourseProof[] = [
        {
          ordinal: 1,
          slug: 'seams',
          route: `${shippedRoute}/2.courses.pursue.yield/course=1.seams`,
          buildsOn: [],
          outcome: { baseline: '0/2', after: '2/2', transfer: 'passed' },
          greats: ['parnas'],
          claims: [{ claim: 'k1 a seam hides a decision', verdict: 'held' }],
          yields: [
            {
              path: 'briefs/rule.require.seams.md',
              kind: 'brief',
              boot: 'say',
            },
          ],
        },
      ];
      const shippedEntry = new PedigreeEntry({
        role: 'architect',
        date: '2026_01_01',
        slug: 'seams',
        route: shippedRoute,
        courses: shippedProofs.map((proof) => asPedigreeCourse({ proof })),
      });

      beforeAll(() => {
        execSync('git checkout -b human/test-education-shipped', {
          cwd: repoRoot,
        });
        mkdirSync(shippedDir, { recursive: true });
        writeFileSync(
          path.join(shippedDir, 'pedigree.pursuit=v2026_01_01.seams.md'),
          asPedigreeEntryMarkdown({
            entry: shippedEntry,
            proofs: shippedProofs,
          }),
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when(
        '[t0] a pursuit here graduates the role, and its pedigree is read',
        () => {
          then(
            'the mod index and the read hold the shipped row beside the new one',
            async () => {
              const pursuit = await initPursuitRoute({
                repoRoot,
                role: 'architect',
                slug: null,
                courses: ['boundaries'],
              });
              writeFileSync(
                path.join(pursuit.route, '1.courses.plot.yield.md'),
                '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | boundaries | seams | — |\n',
              );
              const course = await initCourseRoute({
                repoRoot,
                course: 'boundaries',
              });
              await setCourseDriven({ route: course.route });
              await exitCourseRoute({ repoRoot });
              const result = await setPedigreeEntry({ repoRoot, from: null });

              // the mod's index shadows the shipped one, so it must carry the shipped row
              const index = readFileSync(
                path.join(repoRoot, result.indexPath),
                'utf-8',
              );
              expect(result.indexPath).toContain('repo=.mods');
              expect(index).toContain('pedigree.pursuit=v2026_01_01.seams.md');
              expect(index).toContain(path.basename(result.entryPath));

              // the read takes the shipped entry and the mod's, oldest first
              const [pedigree] = getAllPedigreeEntries({
                repoRoot,
                role: 'architect',
              });
              expect(pedigree!.entries.map((entry) => entry.slug)).toEqual([
                'seams',
                pursuit.route.split('.').pop(),
              ]);
              expect(asSnapMasked({ text: index, repoRoot })).toMatchSnapshot();
            },
          );
        },
      );
    },
  );

  given(
    '[case12] a pursuit whose review asks for more courses, rewound as its stone says',
    () => {
      const repoRoot = genTempDir({ slug: 'test-education-rewind', git: true });
      const originalCwd = process.cwd();

      beforeAll(() => {
        execSync('git checkout -b human/test-education-rewind', {
          cwd: repoRoot,
        });
        mkdirSync(
          path.join(
            repoRoot,
            '.agent',
            'repo=.this',
            'role=mechanic',
            'briefs',
          ),
          { recursive: true },
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] the pursue stone is rewound with --yield drop', () => {
        then(
          'the stale review decision is archived, and every course route stands',
          async () => {
            const pursuit = await initPursuitRoute({
              repoRoot,
              role: 'mechanic',
              slug: 'reliable-writes',
              courses: ['idempotency'],
            });
            writeFileSync(
              path.join(pursuit.route, '1.courses.plot.yield.md'),
              '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | replays | — |\n',
            );
            const course = await initCourseRoute({
              repoRoot,
              course: 'idempotency',
            });
            await setCourseDriven({ route: course.route });
            await exitCourseRoute({ repoRoot });
            const reviewYield = path.join(
              pursuit.route,
              '3.courses.review.yield.md',
            );
            writeFileSync(reviewYield, 'decision: more courses\n');

            const rewound = await setStoneAsRewound(
              {
                stone: '2.courses.pursue',
                route: pursuit.route,
                yield: 'drop',
              },
              { cliEmit: { onGuardProgress: () => {} } },
            );

            expect(rewound.affectedStones).toContain('2.courses.pursue');
            expect(rewound.affectedStones).toContain('3.courses.review');
            expect(existsSync(reviewYield)).toEqual(false);
            expect(
              existsSync(path.join(course.route, '6.exit.yield.md')),
            ).toEqual(true);
            expect(
              existsSync(
                path.join(course.route, '5.1.outcome.assess.yield.md'),
              ),
            ).toEqual(true);
            expect(
              asSnapMasked({
                text: [
                  `affected = ${rewound.affectedStones.join(', ')}`,
                  `review yield = ${existsSync(reviewYield) ? 'held' : 'archived'}`,
                ].join('\n'),
                repoRoot,
              }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case9] a linked role whose published boot spec is in subject mode',
    () => {
      const repoRoot = genTempDir({
        slug: 'test-education-modsubject',
        git: true,
      });
      const originalCwd = process.cwd();
      const modDir = path.join(
        repoRoot,
        '.agent',
        'repo=.mods',
        'role=architect',
      );
      const roleDir = path.join(
        repoRoot,
        '.agent',
        'repo=bhuild',
        'role=architect',
      );

      beforeAll(() => {
        execSync('git checkout -b human/test-education-modsubject', {
          cwd: repoRoot,
        });
        mkdirSync(path.join(roleDir, 'briefs'), { recursive: true });
        writeFileSync(
          path.join(roleDir, 'boot.yml'),
          'always:\n  briefs:\n    say:\n      - briefs/im_an.architect.md\n',
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] the pursuit runs to pedigree set', () => {
        then('the mod takes the role mode: `always.briefs`', async () => {
          const pursuit = await initPursuitRoute({
            repoRoot,
            role: 'architect',
            slug: null,
            courses: ['boundaries'],
          });
          writeFileSync(
            path.join(pursuit.route, '1.courses.plot.yield.md'),
            '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | boundaries | seams | — |\n',
          );
          const course = await initCourseRoute({
            repoRoot,
            course: 'boundaries',
          });
          await setCourseDriven({ route: course.route });
          await exitCourseRoute({ repoRoot });
          const result = await setPedigreeEntry({ repoRoot, from: null });
          const parsed = yaml.load(
            readFileSync(path.join(modDir, 'boot.yml'), 'utf-8'),
          );
          expect(parsed.briefs).toBeUndefined();
          expect(parsed.always.briefs.say).toEqual([
            'briefs/rule.x.md',
            'briefs/education/pedigree._.md',
          ]);
          expect(parsed.always.briefs.ref).toEqual([
            `briefs/education/${path.basename(result.entryPath)}`,
          ]);
          expect(
            asSnapMasked({
              text: readFileSync(path.join(modDir, 'boot.yml'), 'utf-8'),
              repoRoot,
            }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the mod is hand-written in the other mode', () => {
        then('the stamp refuses, and names the role mode', async () => {
          writeFileSync(
            path.join(modDir, 'boot.yml'),
            'of: bhuild/architect\nbriefs:\n  say:\n    - briefs/rule.x.md\n',
          );
          const error = await getError(
            setPedigreeEntry({ repoRoot, from: null }),
          );
          expect(error.message).toContain(
            "the boot spec is in simple mode, but its role's is in subject mode",
          );
          expect(
            asSnapMasked({ text: asRefusalText({ error }), repoRoot }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case3] a linked role whose pedigree is stamped in its mod', () => {
    const repoRoot = genTempDir({ slug: 'test-education-linked' });
    const route = '.route/v2026_11_23.education.pursuit.architect.boundaries';
    const entryName = 'pedigree.pursuit=v2026_11_23.boundaries.md';

    beforeAll(() => {
      mkdirSync(
        path.join(repoRoot, '.agent', 'repo=bhuild', 'role=architect'),
        {
          recursive: true,
        },
      );
      const dirOfMod = path.join(
        repoRoot,
        '.agent',
        'repo=.mods',
        'role=architect',
        'briefs',
        'education',
      );
      mkdirSync(dirOfMod, { recursive: true });
      writeFileSync(path.join(dirOfMod, entryName), '# pedigree\n');
      writeFileSync(
        path.join(dirOfMod, 'pedigree._.md'),
        `| date | pursuit | courses | entry |\n|---|---|---|---|\n| v2026_11_23 | boundaries | boundaries | \`${entryName}\` |\n`,
      );
      writeFileSync(
        path.join(
          repoRoot,
          '.agent',
          'repo=.mods',
          'role=architect',
          'boot.yml',
        ),
        `of: bhuild/architect\nalways:\n  briefs:\n    say:\n      - briefs/education/pedigree._.md\n    ref:\n      - briefs/education/${entryName}\n`,
      );
    });

    when('[t0] no render has reached the role', () => {
      then('the graduate judge holds, and names the render', async () => {
        const verdict = await getOneEducationJudgeVerdict({
          repoRoot,
          route,
          criterion: 'pedigree-stamped',
        });
        expect(verdict.passed).toEqual(false);
        expect(verdict.reason).toContain('rhx init --hooks');
        expect(verdict).toMatchSnapshot();
      });
    });

    when('[t1] a clean render has put the entry in the role view', () => {
      then('the graduate judge passes', async () => {
        const dirRendered = path.join(
          repoRoot,
          '.agent',
          'repo=bhuild',
          'role=architect',
          'briefs',
          'education',
        );
        mkdirSync(dirRendered, { recursive: true });
        writeFileSync(path.join(dirRendered, entryName), '# pedigree\n');
        const verdict = await getOneEducationJudgeVerdict({
          repoRoot,
          route,
          criterion: 'pedigree-stamped',
        });
        expect(verdict.passed).toEqual(true);
        expect(verdict).toMatchSnapshot();
      });
    });
  });

  given(
    '[case10] a repo that publishes its own role, graduated end to end',
    () => {
      const repoRoot = genTempDir({ slug: 'test-education-own', git: true });
      const originalCwd = process.cwd();
      const roleSrc = path.join('src', 'domain.roles', 'mechanic');
      const plot =
        '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n';

      beforeAll(() => {
        execSync('git checkout -b human/test-education-own', {
          cwd: repoRoot,
        });
        writeFileSync(
          path.join(repoRoot, 'rhachet.repo.yml'),
          [
            'slug: ehmpathy',
            'roles:',
            '  - slug: mechanic',
            '    briefs:',
            '      dirs: dist/domain.roles/mechanic/briefs',
            '    skills:',
            '      dirs: dist/domain.roles/mechanic/skills',
            '    boot: dist/domain.roles/mechanic/boot.yml',
          ].join('\n'),
        );
        mkdirSync(path.join(repoRoot, roleSrc, 'briefs'), { recursive: true });
        mkdirSync(path.join(repoRoot, roleSrc, 'skills'), { recursive: true });
        writeFileSync(
          path.join(repoRoot, roleSrc, 'briefs', 'im_a.mechanic.md'),
          '# im a mechanic\n',
        );
        writeFileSync(
          path.join(repoRoot, roleSrc, 'boot.yml'),
          'briefs:\n  say:\n    - briefs/im_a.mechanic.md\n',
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] the pursuit opens, its course exits, and set stamps', () => {
        then(
          'every write lands in the role source, and every graduate judge passes',
          async () => {
            // the pursuit lands in src/, and its graduate stone names the build as the ship step
            const pursuit = await initPursuitRoute({
              repoRoot,
              role: 'mechanic',
              slug: null,
              courses: ['idempotency'],
            });
            expect(pursuit.role).toMatchObject({
              kind: 'own',
              briefsDir: `${roleSrc}/briefs`,
              bootPath: `${roleSrc}/boot.yml`,
            });
            expect(
              readFileSync(
                path.join(pursuit.route, '4.graduate.stone'),
                'utf-8',
              ),
            ).toContain('the pedigree ships with the next build');

            // drive the one course to its exit
            writeFileSync(
              path.join(pursuit.route, '1.courses.plot.yield.md'),
              plot,
            );
            const course = await initCourseRoute({
              repoRoot,
              course: 'idempotency',
            });
            await setCourseDriven({ route: course.route });
            await exitCourseRoute({ repoRoot });

            // the stamp lands in src/, and the simple-mode boot spec names it in kind
            const result = await setPedigreeEntry({ repoRoot, from: null });
            expect(result.entryPath).toContain(`${roleSrc}/briefs/education/`);
            const boot = yaml.load(
              readFileSync(path.join(roleSrc, 'boot.yml'), 'utf-8'),
            );
            expect(boot.always).toBeUndefined();
            expect(boot.briefs.say).toContain('briefs/im_a.mechanic.md');
            expect(boot.briefs.say).toContain('briefs/rule.x.md');
            expect(boot.briefs.say).toContain('briefs/education/pedigree._.md');
            for (const criterion of [
              'pedigree-stamped',
              'boot-within-budget',
            ] as const)
              expect(
                (
                  await getOneEducationJudgeVerdict({
                    repoRoot,
                    route: pursuit.route,
                    criterion,
                  })
                ).passed,
              ).toEqual(true);
            expect(
              asSnapMasked({
                text: [
                  `role = ${pursuit.role.kind} · briefs = ${pursuit.role.briefsDir} · boot = ${pursuit.role.bootPath}`,
                  `entry = ${result.entryPath}`,
                  '',
                  readFileSync(path.join(roleSrc, 'boot.yml'), 'utf-8'),
                ].join('\n'),
                repoRoot,
              }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );
});
