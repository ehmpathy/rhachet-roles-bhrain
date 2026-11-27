import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';
import { setCourseDriven } from '@src/domain.operations/education/.test/setCourseDriven';
import { asPedigreeCourse } from '@src/domain.operations/education/asPedigreeCourse';
import { asPedigreeEntryMarkdown } from '@src/domain.operations/education/asPedigreeEntryMarkdown';
import type { CourseProof } from '@src/domain.operations/education/getOneCourseProof';
import { asRouteBindFlagName } from '@src/domain.operations/route/bind/asRouteBindFlagName';

import { educationPedigree } from './education.pedigree';
import { educationPursuit } from './education.pursuit';
import { educationPursuitCourse } from './education.pursuit.course';

/**
 * .what = what a face wrote and how it exited, the run date masked so a snapshot holds
 */
interface FaceRun {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * .what = the text with every pursuit date masked as `v$DATE`
 * .why = a pursuit route leads with the day it opened; a snapshot must not drift each day
 */
const asDateMasked = (input: { text: string }): string =>
  input.text.replace(/v\d{4}_\d{2}_\d{2}/g, 'v$DATE');

/**
 * .what = run one face in process, as its entry runs it, and capture its two streams
 * .why = the faces read `process.argv` and write `console`; a spy sees exactly what a caller sees
 */
const runFace = async (input: {
  face: () => Promise<void>;
  args: string[];
}): Promise<FaceRun> => {
  const argvBefore = process.argv;
  const stdout = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const stderr = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  // an entry path in argv[1], as node sets it; a bare token there reads as `node -e` mode
  process.argv = ['node', '/entry/face.js', ...input.args];
  process.exitCode = 0;
  try {
    await input.face();
    return {
      stdout: asDateMasked({
        text: stdout.mock.calls.map((call) => String(call[0])).join('\n'),
      }),
      stderr: asDateMasked({
        text: stderr.mock.calls.map((call) => String(call[0])).join('\n'),
      }),
      exitCode: Number(process.exitCode ?? 0),
    };
  } finally {
    process.argv = argvBefore;
    process.exitCode = 0;
    stdout.mockRestore();
    stderr.mockRestore();
  }
};

describe('education faces', () => {
  given('[case1] a repo with a native mechanic, on a feature branch', () => {
    const repoRoot = genTempDir({ slug: 'test-education-faces', git: true });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-education-faces', { cwd: repoRoot });
      const roleDir = path.join(
        repoRoot,
        '.agent',
        'repo=.this',
        'role=mechanic',
      );
      mkdirSync(path.join(roleDir, 'briefs'), { recursive: true });
      writeFileSync(
        path.join(roleDir, 'boot.yml'),
        'always:\n  briefs:\n    say:\n      - briefs/im_a.mechanic.md\n',
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] each face is asked for help', () => {
      const pursuit = useThen('pursuit help runs', () =>
        runFace({ face: educationPursuit, args: ['--help'] }),
      );
      const course = useThen('course help runs', () =>
        runFace({ face: educationPursuitCourse, args: ['--help'] }),
      );
      const pedigree = useThen('pedigree help runs', () =>
        runFace({ face: educationPedigree, args: ['--help'] }),
      );

      then('each exits 0 and names usage and an example', () => {
        for (const run of [pursuit, course, pedigree]) {
          expect(run.exitCode).toEqual(0);
          expect(run.stdout).toContain('usage');
          expect(run.stdout).toContain('example');
        }
      });

      then('each renders as the snapshot shows', () => {
        expect(pursuit.stdout).toMatchSnapshot('pursuit --help');
        expect(course.stdout).toMatchSnapshot('course --help');
        expect(pedigree.stdout).toMatchSnapshot('pedigree --help');
      });
    });

    when('[t1] a course init runs before any pursuit', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuitCourse,
          args: ['init', '--course', 'idempotency'],
        }),
      );

      then('it refuses with exit 2 and names the fix', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('✋ ConstraintError:');
        expect(run.stderr).toContain('rhx education.pursuit init');
      });

      then('the refusal renders as the snapshot shows', () => {
        expect(run.stderr).toMatchSnapshot();
      });
    });

    when('[t2] a pursuit opens for an unknown role', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--for', 'mechanik', '--slug', 'reliable-writes'],
        }),
      );

      then('it refuses with exit 2 and names the nearest role', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('did you mean --for mechanic?');
      });

      then('the refusal renders as the snapshot shows', () => {
        expect(run.stderr).toMatchSnapshot();
      });
    });

    when('[t2.1] the pedigree is read for an unknown role', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPedigree,
          args: ['get', '--for', 'mechanik'],
        }),
      );

      then(
        'it refuses with exit 2, names the role meant, and lists none as empty',
        () => {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('no role mechanik in this repo');
          expect(run.stderr).toContain('did you mean --for mechanic?');
          expect(run.stdout).not.toContain('pursuits graduated = 0');
        },
      );

      then('the refusal renders as the snapshot shows', () => {
        expect(run.stderr).toMatchSnapshot();
      });
    });

    when('[t3] a pursuit opens, then its first course', () => {
      const pursuit = useThen('pursuit init runs', () =>
        runFace({
          face: educationPursuit,
          args: [
            'init',
            '--for',
            'mechanic',
            '--slug',
            'reliable-writes',
            '--course',
            'idempotency',
          ],
        }),
      );
      const plot = useThen('the plot names the course', () => {
        const [pursuitName = ''] = readdirSync(path.join(repoRoot, '.route'));
        writeFileSync(
          path.join(repoRoot, '.route', pursuitName, '1.courses.plot.yield.md'),
          '| k | course | builds on |\n|---|---|---|\n| 1 | idempotency | — |\n',
        );
        return { pursuitRoute: path.join('.route', pursuitName) };
      });
      const courseOutOfTurn = useThen(
        'course init runs for a course the plot never names',
        () =>
          runFace({
            face: educationPursuitCourse,
            args: ['init', '--course', 'retries'],
          }),
      );
      const course = useThen('course init runs', () =>
        runFace({
          face: educationPursuitCourse,
          args: ['init', '--course', 'idempotency'],
        }),
      );
      const courseNested = useThen('course init runs inside the course', () =>
        runFace({
          face: educationPursuitCourse,
          args: ['init', '--course', 'idempotency'],
        }),
      );
      const exit = useThen('course exit runs before any stone passed', () =>
        runFace({ face: educationPursuitCourse, args: ['exit'] }),
      );
      const pedigree = useThen('pedigree get runs before any stamp', () =>
        runFace({
          face: educationPedigree,
          args: ['get', '--for', 'mechanic'],
        }),
      );
      const judgeExitBefore = useThen('the exit judge runs before exit', () =>
        runFace({
          face: educationPursuitCourse,
          args: [
            'judge',
            '--criterion',
            'exited',
            '--route',
            path.join(
              plot.pursuitRoute,
              '2.courses.pursue.yield',
              'course=1.idempotency',
            ),
          ],
        }),
      );
      const judgePursueHeld = useThen(
        'the pursue judge runs while the course is open',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'courses-exited',
              '--route',
              plot.pursuitRoute,
            ],
          }),
      );
      const exitDone = useThen(
        'course exit runs once every stone passed',
        async () => {
          await setCourseDriven({
            route: path.join(
              plot.pursuitRoute,
              '2.courses.pursue.yield',
              'course=1.idempotency',
            ),
          });
          return runFace({ face: educationPursuitCourse, args: ['exit'] });
        },
      );
      const judgeExitAfter = useThen('the exit judge runs after exit', () =>
        runFace({
          face: educationPursuitCourse,
          args: [
            'judge',
            '--criterion',
            'exited',
            '--route',
            path.join(
              plot.pursuitRoute,
              '2.courses.pursue.yield',
              'course=1.idempotency',
            ),
          ],
        }),
      );
      const judgePursue = useThen('the pursue judge runs', () =>
        runFace({
          face: educationPursuit,
          args: [
            'judge',
            '--criterion',
            'courses-exited',
            '--route',
            plot.pursuitRoute,
          ],
        }),
      );
      const courseExited = useThen(
        'course init runs for the exited course',
        () =>
          runFace({
            face: educationPursuitCourse,
            args: ['init', '--course', 'idempotency'],
          }),
      );
      const judgeGraduateBefore = useThen(
        'the graduate judge runs before the stamp',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'pedigree-stamped',
              '--route',
              plot.pursuitRoute,
            ],
          }),
      );
      const pedigreeSet = useThen('pedigree set runs', () =>
        runFace({ face: educationPedigree, args: ['set'] }),
      );
      const judgeGraduateAfter = useThen(
        'the graduate judge runs after the stamp',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'pedigree-stamped',
              '--route',
              plot.pursuitRoute,
            ],
          }),
      );
      const judgePlotValid = useThen(
        'the plot judge runs over the written plot',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'plot-valid',
              '--route',
              plot.pursuitRoute,
            ],
          }),
      );
      const judgeBootWithinBudget = useThen(
        'the boot budget judge runs after the stamp',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'boot-within-budget',
              '--route',
              plot.pursuitRoute,
            ],
          }),
      );
      const judgePlotHeld = useThen(
        'the plot judge runs over a plot with a fault, then the plot is restored',
        async () => {
          const plotPath = path.join(
            repoRoot,
            plot.pursuitRoute,
            '1.courses.plot.yield.md',
          );
          const plotWhole = readFileSync(plotPath, 'utf-8');
          writeFileSync(
            plotPath,
            '| k | course | builds on |\n|---|---|---|\n| 1 | `idempotency` | — |\n',
          );
          const run = await runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'plot-valid',
              '--route',
              plot.pursuitRoute,
            ],
          });
          writeFileSync(plotPath, plotWhole);
          return run;
        },
      );
      const judgeBootHeld = useThen(
        'the boot budget judge runs over a budget the stamp overruns, then the boot is restored',
        async () => {
          const bootPath = path.join(
            repoRoot,
            '.agent/repo=.this/role=mechanic/boot.yml',
          );
          const bootWhole = readFileSync(bootPath, 'utf-8');
          writeFileSync(bootPath, `budget:\n  tokens: 50\n${bootWhole}`);
          const run = await runFace({
            face: educationPursuit,
            args: [
              'judge',
              '--criterion',
              'boot-within-budget',
              '--route',
              plot.pursuitRoute,
            ],
          });
          writeFileSync(bootPath, bootWhole);
          return run;
        },
      );
      const pedigreeGetFull = useThen('pedigree get runs over the stamp', () =>
        runFace({
          face: educationPedigree,
          args: ['get', '--for', 'mechanic'],
        }),
      );
      const pursuitRetakeToday = useThen(
        'pursuit init runs again on the day it graduated',
        () =>
          runFace({
            face: educationPursuit,
            args: [
              'init',
              '--for',
              'mechanic',
              '--slug',
              'reliable-writes',
              '--course',
              'idempotency',
            ],
          }),
      );

      then(
        'pursuit init exits 0 and names the route and the enroll line',
        () => {
          expect(pursuit.exitCode).toEqual(0);
          expect(pursuit.stdout).toContain(
            'route = .route/v$DATE.education.pursuit.mechanic.reliable-writes',
          );
          expect(pursuit.stdout).toContain('rhx enroll claude --roles');
        },
      );

      then('course init exits 0 and binds the course', () => {
        expect(course.exitCode).toEqual(0);
        expect(course.stdout).toContain('course=1.idempotency');
      });

      then('course exit refuses with exit 2 and names the stones owed', () => {
        expect(exit.exitCode).toEqual(2);
        expect(exit.stderr).toContain('✋ ConstraintError:');
      });

      then('each refusal on the way exits 2 and names its fix', () => {
        expect(courseOutOfTurn.exitCode).toEqual(2);
        expect(courseOutOfTurn.stderr).toContain('is not next in the plot');
        expect(courseNested.exitCode).toEqual(2);
        expect(courseNested.stderr).toContain('already within a course');
        expect(courseExited.exitCode).toEqual(2);
        expect(courseExited.stderr).toContain('has already exited');
        expect(pursuitRetakeToday.exitCode).toEqual(2);
        expect(pursuitRetakeToday.stderr).toContain('already graduated today');
      });

      then('course exit, once the stones pass, exits 0 and swaps back', () => {
        expect(exitDone.exitCode).toEqual(0);
        expect(exitDone.stdout).toContain('course = 1. idempotency');
        expect(exitDone.stdout).toContain('stones = all passed, exit recorded');
        expect(exitDone.stdout).toContain('bound = the pursuit (was ');
      });

      then('each judge exits 0 and prints the verdict the parser reads', () => {
        expect(judgeExitBefore.exitCode).toEqual(0);
        expect(judgeExitBefore.stdout).toContain('passed: false');
        expect(judgeExitAfter.stdout).toContain('passed: true');
        expect(judgePursue.stdout).toContain('passed: true');
        expect(judgeGraduateBefore.stdout).toContain('passed: false');
        expect(judgeGraduateAfter.stdout).toContain('passed: true');
        expect(judgePlotValid.exitCode).toEqual(0);
        expect(judgePlotValid.stdout).toContain('passed: true');
        expect(judgeBootWithinBudget.exitCode).toEqual(0);
        expect(judgeBootWithinBudget.stdout).toContain('passed: true');
      });

      then(
        'each judge, over a fault, exits 0 and holds with passed: false',
        () => {
          expect(judgePursueHeld.exitCode).toEqual(0);
          expect(judgePursueHeld.stdout).toContain('passed: false');
          expect(judgePlotHeld.exitCode).toEqual(0);
          expect(judgePlotHeld.stdout).toContain('passed: false');
          expect(judgeBootHeld.exitCode).toEqual(0);
          expect(judgeBootHeld.stdout).toContain('passed: false');
        },
      );

      then('pedigree set exits 0 and names the entry, index, and boot', () => {
        expect(pedigreeSet.exitCode).toEqual(0);
        expect(pedigreeSet.stdout).toContain(
          '1. idempotency · baseline 1/4 → after 4/4',
        );
        expect(pedigreeSet.stdout).toContain('boot = ');
      });

      then('pedigree get shows the pursuit and its course', () => {
        expect(pedigreeGetFull.exitCode).toEqual(0);
        expect(pedigreeGetFull.stdout).toContain('1. idempotency');
        expect(pedigreeGetFull.stdout).toContain(
          'greats = helland · kleppmann',
        );
      });

      then('pedigree get, before the stamp, exits 0 and names the role', () => {
        expect(pedigree.exitCode).toEqual(0);
        expect(pedigree.stdout).toContain('mechanic');
      });

      then('each step renders as the snapshot shows', () => {
        expect(pursuit.stdout).toMatchSnapshot('pursuit init');
        expect(courseOutOfTurn.stderr).toMatchSnapshot(
          'course init, not next in the plot',
        );
        expect(course.stdout).toMatchSnapshot('course init');
        expect(courseNested.stderr).toMatchSnapshot(
          'course init, within a course',
        );
        expect(exit.stderr).toMatchSnapshot('course exit, stones unpassed');
        expect(pedigree.stdout).toMatchSnapshot('pedigree get, none');
        expect(judgeExitBefore.stdout).toMatchSnapshot(
          'course judge exited, before exit',
        );
        expect(exitDone.stdout).toMatchSnapshot('course exit, done');
        expect(judgeExitAfter.stdout).toMatchSnapshot(
          'course judge exited, after exit',
        );
        expect(judgePursue.stdout).toMatchSnapshot(
          'pursuit judge courses-exited',
        );
        expect(judgePursueHeld.stdout).toMatchSnapshot(
          'pursuit judge courses-exited, held',
        );
        expect(judgePlotHeld.stdout).toMatchSnapshot(
          'pursuit judge plot-valid, held',
        );
        expect(judgeBootHeld.stdout).toMatchSnapshot(
          'pursuit judge boot-within-budget, held',
        );
        expect(courseExited.stderr).toMatchSnapshot(
          'course init, already exited',
        );
        expect(judgeGraduateBefore.stdout).toMatchSnapshot(
          'pursuit judge pedigree-stamped, before set',
        );
        expect(pedigreeSet.stdout).toMatchSnapshot('pedigree set');
        expect(judgeGraduateAfter.stdout).toMatchSnapshot(
          'pursuit judge pedigree-stamped, after set',
        );
        expect(judgePlotValid.stdout).toMatchSnapshot(
          'pursuit judge plot-valid',
        );
        expect(judgeBootWithinBudget.stdout).toMatchSnapshot(
          'pursuit judge boot-within-budget',
        );
        expect(pedigreeGetFull.stdout).toMatchSnapshot(
          'pedigree get, one pursuit',
        );
        expect(pursuitRetakeToday.stderr).toMatchSnapshot(
          'pursuit init, graduated today',
        );
      });
    });

    when('[t4] a face is called with flags it cannot read', () => {
      const flagUnknown = useThen('an unknown flag runs', () =>
        runFace({
          face: educationPedigree,
          args: ['get', '--rol', 'mechanic'],
        }),
      );
      const flagBare = useThen('a flag with no value runs', () =>
        runFace({ face: educationPedigree, args: ['get', '--for'] }),
      );
      const flagTwice = useThen('a one-value flag given twice runs', () =>
        runFace({
          face: educationPedigree,
          args: ['get', '--for', 'mechanic', '--for', 'learner'],
        }),
      );
      const judgeBare = useThen('a judge with no criterion runs', () =>
        runFace({ face: educationPursuit, args: ['judge'] }),
      );
      const verbUnknown = useThen('an unknown verb runs', () =>
        runFace({ face: educationPedigree, args: ['stamp'] }),
      );
      const verbUnknownPursuit = useThen(
        'an unknown verb runs on the pursuit face',
        () => runFace({ face: educationPursuit, args: ['stamp'] }),
      );
      const verbUnknownCourse = useThen(
        'an unknown verb runs on the course face',
        () => runFace({ face: educationPursuitCourse, args: ['stamp'] }),
      );
      const verbAbsentPedigree = useThen(
        'the pedigree face runs with no verb',
        () => runFace({ face: educationPedigree, args: [] }),
      );
      const verbAbsentPursuit = useThen(
        'the pursuit face runs with no verb',
        () => runFace({ face: educationPursuit, args: [] }),
      );
      const verbAbsentCourse = useThen(
        'the course face runs with no verb',
        () => runFace({ face: educationPursuitCourse, args: [] }),
      );
      const slugBad = useThen('a pursuit with a slug not kebab runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--for', 'mechanic', '--slug', 'Bad_Slug'],
        }),
      );
      const roleAbsent = useThen('a pursuit init with no --for runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--slug', 'reliable-writes'],
        }),
      );
      const slugAbsent = useThen(
        'a pursuit init with no --slug and no single --course runs',
        () =>
          runFace({
            face: educationPursuit,
            args: ['init', '--for', 'mechanic'],
          }),
      );
      const courseAbsent = useThen('a course init with no --course runs', () =>
        runFace({ face: educationPursuitCourse, args: ['init'] }),
      );
      const judgeCourseForeign = useThen(
        'a course judge with a criterion only the pursuit holds runs',
        () =>
          runFace({
            face: educationPursuitCourse,
            args: ['judge', '--criterion', 'courses-exited', '--route', '.'],
          }),
      );

      then('each refuses with exit 2 and a qualified header', () => {
        for (const run of [
          flagUnknown,
          flagBare,
          flagTwice,
          judgeBare,
          verbUnknown,
          verbUnknownPursuit,
          verbUnknownCourse,
          verbAbsentPedigree,
          verbAbsentPursuit,
          verbAbsentCourse,
          slugBad,
          roleAbsent,
          slugAbsent,
          courseAbsent,
          judgeCourseForeign,
        ]) {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('✋ ConstraintError:');
        }
        expect(slugBad.stderr).toContain('Bad_Slug');
        // each face names the bad verb, or its absence, and the fix names that face's own verbs
        for (const run of [verbUnknown, verbUnknownPursuit, verbUnknownCourse])
          expect(run.stderr).toContain('unknown verb `stamp`');
        for (const run of [
          verbAbsentPedigree,
          verbAbsentPursuit,
          verbAbsentCourse,
        ])
          expect(run.stderr).toContain('no verb given');
        expect(verbUnknownPursuit.stderr).toContain(
          'rhx education.pursuit init --for <role> --slug <slug>',
        );
        expect(verbUnknownCourse.stderr).toContain(
          'rhx education.pursuit.course init --course <slug>, or exit',
        );
        expect(verbAbsentPedigree.stderr).toContain(
          'rhx education.pedigree get, or set',
        );
        expect(roleAbsent.stderr).toContain('--for is required');
        expect(slugAbsent.stderr).toContain('a pursuit needs a --slug');
        expect(courseAbsent.stderr).toContain('--course is required');
        expect(judgeCourseForeign.stderr).toContain('--criterion exited');
      });

      then('each refusal renders as the snapshot shows', () => {
        expect(flagUnknown.stderr).toMatchSnapshot('flag unknown');
        expect(flagBare.stderr).toMatchSnapshot('flag with no value');
        expect(flagTwice.stderr).toMatchSnapshot('one-value flag twice');
        expect(judgeBare.stderr).toMatchSnapshot('judge with no criterion');
        expect(verbUnknown.stderr).toMatchSnapshot('verb unknown');
        expect(verbUnknownPursuit.stderr).toMatchSnapshot(
          'verb unknown, pursuit',
        );
        expect(verbUnknownCourse.stderr).toMatchSnapshot(
          'verb unknown, course',
        );
        expect(verbAbsentPedigree.stderr).toMatchSnapshot(
          'verb absent, pedigree',
        );
        expect(verbAbsentPursuit.stderr).toMatchSnapshot(
          'verb absent, pursuit',
        );
        expect(verbAbsentCourse.stderr).toMatchSnapshot('verb absent, course');
        expect(slugBad.stderr).toMatchSnapshot('pursuit init, slug not kebab');
        expect(roleAbsent.stderr).toMatchSnapshot('pursuit init, no role');
        expect(slugAbsent.stderr).toMatchSnapshot('pursuit init, no slug');
        expect(courseAbsent.stderr).toMatchSnapshot('course init, no course');
        expect(judgeCourseForeign.stderr).toMatchSnapshot(
          'course judge, criterion of the pursuit',
        );
      });
    });

    when(
      '[t5] the pedigree is read for every role, then over a corrupt entry',
      () => {
        const getAll = useThen('pedigree get runs with no --for', () =>
          runFace({ face: educationPedigree, args: ['get'] }),
        );
        const getCorrupt = useThen(
          'pedigree get runs over an entry that will not parse',
          async () => {
            const corrupt = path.join(
              repoRoot,
              '.agent',
              'repo=.this',
              'role=mechanic',
              'briefs',
              'education',
              'pedigree.pursuit=v2026_01_01.broken.md',
            );
            writeFileSync(corrupt, '# a hand edit that lost the table\n');
            const run = await runFace({
              face: educationPedigree,
              args: ['get', '--for', 'mechanic'],
            });
            rmSync(corrupt);
            return run;
          },
        );

        then('the all-roles read exits 0 and shows the graduated role', () => {
          expect(getAll.exitCode).toEqual(0);
          expect(getAll.stdout).toContain(
            '📜 education.pedigree get\n   └─ mechanic',
          );
          expect(getAll.stdout).toContain('1. idempotency');
          expect(getAll.stdout).not.toContain('no courses');
        });

        then(
          'a corrupt entry refuses with exit 2 and names the file, never drops it',
          () => {
            expect(getCorrupt.exitCode).toEqual(2);
            expect(getCorrupt.stderr).toContain(
              'a pedigree entry does not parse',
            );
            expect(getCorrupt.stderr).toContain('.broken.md');
          },
        );

        then('each renders as the snapshot shows', () => {
          expect(getAll.stdout).toMatchSnapshot('pedigree get, every role');
          expect(getCorrupt.stderr).toMatchSnapshot(
            'pedigree get, corrupt entry',
          );
        });
      },
    );
  });

  given('[case4] a pursuit opened with no --course, then re-run', () => {
    const repoRoot = genTempDir({
      slug: 'test-education-faces-nocourse',
      git: true,
    });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-education-faces-nocourse', {
        cwd: repoRoot,
      });
      mkdirSync(
        path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
        { recursive: true },
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] pursuit init runs with a --slug and no --course', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--for', 'mechanic', '--slug', 'reliable-writes'],
        }),
      );

      then('it exits 0, and says the plot will name the courses', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.stdout).toContain('(none; 1.courses.plot plots them)');
      });

      then('the wish says the plot owes the courses', () => {
        const [pursuitName = ''] = readdirSync(path.join(repoRoot, '.route'));
        const wish = readFileSync(
          path.join(repoRoot, '.route', pursuitName, '0.wish.md'),
          'utf-8',
        );
        expect(wish).toContain('(none named; `1.courses.plot` plots them');
      });

      then('it renders as the snapshot shows', () => {
        expect(run.stdout).toMatchSnapshot();
      });
    });

    when('[t1] pursuit init re-runs, now with a --course', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuit,
          args: [
            'init',
            '--for',
            'mechanic',
            '--slug',
            'reliable-writes',
            '--course',
            'idempotency',
          ],
        }),
      );

      then('it exits 0, and says the kept wish holds the seed', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.stdout).toContain('kept as 0.wish.md holds them');
        expect(run.stdout).not.toContain('1. idempotency');
        expect(run.stdout).toContain('0 created');
      });

      then('it renders as the snapshot shows', () => {
        expect(run.stdout).toMatchSnapshot();
      });
    });

    when('[t2] a verb is passed a flag it does not read', () => {
      const exitWithCourse = useThen('exit runs with --course', () =>
        runFace({
          face: educationPursuitCourse,
          args: ['exit', '--course', 'retries'],
        }),
      );
      const setWithFor = useThen('pedigree set runs with --for', () =>
        runFace({ face: educationPedigree, args: ['set', '--for', 'learner'] }),
      );

      then('each refuses with exit 2 and names what the verb reads', () => {
        expect(exitWithCourse.exitCode).toEqual(2);
        expect(exitWithCourse.stderr).toContain('exit does not read --course');
        expect(setWithFor.exitCode).toEqual(2);
        expect(setWithFor.stderr).toContain('set reads only: --from');
      });

      then('each renders as the snapshot shows', () => {
        expect(exitWithCourse.stderr).toMatchSnapshot('exit with --course');
        expect(setWithFor.stderr).toMatchSnapshot('pedigree set with --for');
      });
    });
  });

  given('[case7] a pursuit opened with two courses at once', () => {
    const repoRoot = genTempDir({
      slug: 'test-education-faces-twocourses',
      git: true,
    });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-education-faces-twocourses', {
        cwd: repoRoot,
      });
      mkdirSync(
        path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic', 'briefs'),
        { recursive: true },
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] pursuit init runs with two --course flags', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuit,
          args: [
            'init',
            '--for',
            'mechanic',
            '--slug',
            'reliable-writes',
            '--course',
            'idempotency',
            '--course',
            'retries',
          ],
        }),
      );

      then('it exits 0, and seeds both courses in the order named', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.stdout).toContain('1. idempotency');
        expect(run.stdout).toContain('2. retries');
        expect(run.stdout.indexOf('1. idempotency')).toBeLessThan(
          run.stdout.indexOf('2. retries'),
        );
      });

      then('it renders as the snapshot shows', () => {
        expect(run.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a repo whose branch cannot take the bind', () => {
    const repoRoot = genTempDir({
      slug: 'test-education-faces-nobind',
      git: true,
    });
    const originalCwd = process.cwd();
    const argsOfInit = [
      'init',
      '--for',
      'mechanic',
      '--slug',
      'reliable-writes',
    ];

    beforeAll(() => {
      execSync('git checkout -B main', { cwd: repoRoot });
      mkdirSync(path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic'), {
        recursive: true,
      });
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when(
      '[t0] pursuit init runs on main, then beside another bound route',
      () => {
        const onMain = useThen('init runs on main', () =>
          runFace({ face: educationPursuit, args: argsOfInit }),
        );
        const besideBound = useThen('init runs beside a bound route', () => {
          execSync('git checkout -b human/test-faces-other', { cwd: repoRoot });
          const other = path.join('.behavior', 'v2026_01_01.other');
          mkdirSync(path.join(repoRoot, other, '.route'), { recursive: true });
          writeFileSync(
            path.join(
              repoRoot,
              other,
              '.route',
              asRouteBindFlagName({ branch: 'human/test-faces-other' }),
            ),
            'branch: human/test-faces-other\n',
          );
          return runFace({ face: educationPursuit, args: argsOfInit });
        });
        const exitBesideBound = useThen(
          'course exit runs beside that bound route',
          () => runFace({ face: educationPursuitCourse, args: ['exit'] }),
        );

        then('each refuses with exit 2 before any write', () => {
          expect(onMain.exitCode).toEqual(2);
          expect(onMain.stderr).toContain('protected branch');
          expect(besideBound.exitCode).toEqual(2);
          expect(besideBound.stderr).toContain('already bound to');
          expect(existsSync(path.join(repoRoot, '.route'))).toEqual(false);
        });

        then(
          'an exit there never claims the branch stands on a pursuit',
          () => {
            expect(exitBesideBound.exitCode).toEqual(2);
            expect(exitBesideBound.stderr).toContain(
              'the branch stands on a route that is no course',
            );
            expect(exitBesideBound.stderr).not.toContain('pursuit;');
          },
        );

        then('each refusal renders as the snapshot shows', () => {
          expect(onMain.stderr).toMatchSnapshot('pursuit init, on main');
          expect(besideBound.stderr).toMatchSnapshot(
            'pursuit init, another route bound',
          );
          expect(exitBesideBound.stderr).toMatchSnapshot(
            'course exit, a route that is no course bound',
          );
        });
      },
    );

    when('[t1] a branch with no bind calls exit, then pedigree set', () => {
      const exitUnbound = useThen(
        'course exit runs with no course bound',
        () => {
          execSync('git checkout -b human/test-faces-none', { cwd: repoRoot });
          return runFace({ face: educationPursuitCourse, args: ['exit'] });
        },
      );
      const setUnbound = useThen(
        'pedigree set runs with no pursuit bound and no --from',
        () => runFace({ face: educationPedigree, args: ['set'] }),
      );
      const setFromAbsent = useThen(
        'pedigree set runs --from a route that does not exist',
        () =>
          runFace({
            face: educationPedigree,
            args: [
              'set',
              '--from',
              '.route/v2026_01_01.education.pursuit.mechanic.absent',
            ],
          }),
      );

      then(
        '--from reaches the stamp: a route that is absent refuses, named',
        () => {
          expect(setFromAbsent.exitCode).toEqual(2);
          expect(setFromAbsent.stderr).toContain('✋ ConstraintError:');
          expect(setFromAbsent.stderr).toContain(
            'the route to stamp does not exist',
          );
          expect(setFromAbsent.stderr).toContain(
            'education.pursuit.mechanic.absent',
          );
          expect(setFromAbsent.stderr).not.toContain('no course');
          expect(setFromAbsent.stderr).toMatchSnapshot(
            'pedigree set, --from a route that is absent',
          );
        },
      );

      then('each refuses with exit 2 and names where to run it', () => {
        expect(exitUnbound.exitCode).toEqual(2);
        expect(exitUnbound.stderr).toContain('exit runs only within a course');
        expect(setUnbound.exitCode).toEqual(2);
        expect(setUnbound.stderr).toContain(
          'a pedigree is stamped from a pursuit route',
        );
      });

      then('each refusal renders as the snapshot shows', () => {
        expect(exitUnbound.stderr).toMatchSnapshot(
          'course exit, no course bound',
        );
        expect(setUnbound.stderr).toMatchSnapshot(
          'pedigree set, no pursuit bound',
        );
      });
    });
  });

  given(
    '[case5] a repo that publishes roles with empty dirs, as this one does',
    () => {
      const repoRoot = genTempDir({
        slug: 'test-education-empty-dirs',
        git: true,
      });
      const originalCwd = process.cwd();
      const route = '.route/v2026_11_23.education.pursuit.navigator.routes';
      const proofs: CourseProof[] = [
        {
          ordinal: 1,
          slug: 'landmarks',
          route: `${route}/2.courses.pursue.yield/course=1.landmarks`,
          buildsOn: [],
          outcome: { baseline: '1/3', after: '3/3', transfer: 'passed' },
          greats: ['lynch'],
          claims: [{ claim: 'k1 a landmark anchors a route', verdict: 'held' }],
          yields: [
            {
              path: 'briefs/rule.require.landmarks.md',
              kind: 'brief',
              boot: 'say',
            },
          ],
        },
      ];

      beforeAll(() => {
        execSync('git checkout -b human/test-education-empty-dirs', {
          cwd: repoRoot,
        });
        writeFileSync(
          path.join(repoRoot, 'rhachet.repo.yml'),
          [
            'slug: bhrain',
            'roles:',
            '  - slug: navigator',
            '    briefs:',
            '      dirs: dist/domain.roles/navigator/briefs',
            '    skills:',
            '      dirs: []',
            '    boot: dist/domain.roles/navigator/boot.yml',
            '  - slug: reflector',
            '    briefs:',
            '      dirs: []',
            '    skills:',
            '      dirs: dist/domain.roles/reflector/skills',
            '    boot: dist/domain.roles/reflector/boot.yml',
          ].join('\n'),
        );
        const educationDir = path.join(
          repoRoot,
          'src/domain.roles/navigator/briefs/education',
        );
        mkdirSync(educationDir, { recursive: true });
        const entry = new PedigreeEntry({
          role: 'navigator',
          date: '2026_11_23',
          slug: 'routes',
          route,
          courses: proofs.map((proof) => asPedigreeCourse({ proof })),
        });
        writeFileSync(
          path.join(educationDir, 'pedigree.pursuit=v2026_11_23.routes.md'),
          asPedigreeEntryMarkdown({ entry, proofs }),
        );
        process.chdir(repoRoot);
      });
      afterAll(() => process.chdir(originalCwd));

      when('[t0] the pedigree is read for every role, then per role', () => {
        const getAll = useThen('pedigree get runs with no --for', () =>
          runFace({ face: educationPedigree, args: ['get'] }),
        );
        const getNavigator = useThen('pedigree get runs for navigator', () =>
          runFace({
            face: educationPedigree,
            args: ['get', '--for', 'navigator'],
          }),
        );
        const getReflector = useThen('pedigree get runs for reflector', () =>
          runFace({
            face: educationPedigree,
            args: ['get', '--for', 'reflector'],
          }),
        );

        then(
          'the all-roles read is one tree: the role with courses as a branch, the rest in one leaf, then the hint',
          () => {
            expect(getAll.exitCode).toEqual(0);
            expect(getAll.stderr).toEqual('');
            expect(getAll.stdout.match(/📜 education\.pedigree/g)).toHaveLength(
              1,
            );
            expect(getAll.stdout).toContain('   ├─ navigator');
            expect(getAll.stdout).toContain('1. landmarks');
            expect(getAll.stdout).toMatch(/└─ no courses \(\d+ roles?\)/);
            expect(getAll.stdout).toMatch(/└─ .*reflector/);
            expect(getAll.stdout).not.toContain('├─ reflector');
            expect(getAll.stdout).toContain(
              'rhx education.pursuit init --for <role> --slug <slug>',
            );
          },
        );

        then('a named role with no skills dir reads its entry', () => {
          expect(getNavigator.exitCode).toEqual(0);
          expect(getNavigator.stdout).toContain('1. landmarks');
        });

        then('a named role with no briefs dir reads as no pedigree', () => {
          expect(getReflector.exitCode).toEqual(0);
          expect(getReflector.stderr).toEqual('');
          expect(getReflector.stdout).toContain('reflector');
        });

        then('each renders as the snapshot shows', () => {
          expect(getAll.stdout).toMatchSnapshot(
            'pedigree get, empty-dir roles',
          );
          expect(getReflector.stdout).toMatchSnapshot(
            'pedigree get, a role with no briefs dir',
          );
        });
      });
    },
  );

  given('[case6] a repo that publishes its own mechanic', () => {
    const repoRoot = genTempDir({ slug: 'test-education-own', git: true });
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-education-own', { cwd: repoRoot });
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
      const roleDir = path.join(repoRoot, 'src/domain.roles/mechanic');
      mkdirSync(path.join(roleDir, 'briefs'), { recursive: true });
      mkdirSync(path.join(roleDir, 'skills'), { recursive: true });
      writeFileSync(
        path.join(roleDir, 'boot.yml'),
        'always:\n  briefs:\n    say:\n      - briefs/im_a.mechanic.md\n',
      );
      process.chdir(repoRoot);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] a pursuit opens for the own role', () => {
      const open = useThen('pursuit init runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--for', 'mechanic', '--course', 'idempotency'],
        }),
      );

      then('it names the role own and lands in its source, never dist', () => {
        expect(open.exitCode).toEqual(0);
        expect(open.stderr).toEqual('');
        expect(open.stdout).toContain('role = mechanic (own)');
        expect(open.stdout).toContain('src/domain.roles/mechanic/briefs');
        expect(open.stdout).not.toContain('dist/domain.roles');
      });

      then('it renders as the snapshot shows', () => {
        expect(open.stdout).toMatchSnapshot('pursuit init, own role');
      });
    });
  });

  given('[case3] a face run from a subdir of the repo', () => {
    const repoRoot = genTempDir({ slug: 'test-education-subdir', git: true });
    const subdir = path.join(repoRoot, 'src');
    const originalCwd = process.cwd();

    beforeAll(() => {
      execSync('git checkout -b human/test-faces-subdir', { cwd: repoRoot });
      mkdirSync(path.join(repoRoot, '.agent', 'repo=.this', 'role=mechanic'), {
        recursive: true,
      });
      mkdirSync(subdir, { recursive: true });
      process.chdir(subdir);
    });
    afterAll(() => process.chdir(originalCwd));

    when('[t0] pursuit init runs there', () => {
      const run = useThen('it runs', () =>
        runFace({
          face: educationPursuit,
          args: ['init', '--for', 'mechanic', '--course', 'idempotency'],
        }),
      );

      // the temp dir is a symlink; git names the root by its real path
      const repoRootReal = realpathSync(repoRoot);

      then(
        'it refuses with exit 2, names the root, and writes no route',
        () => {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('education runs from the repo root');
          expect(run.stderr).toContain(`run it from ${repoRootReal}`);
          expect(existsSync(path.join(subdir, '.route'))).toEqual(false);
          expect(existsSync(path.join(repoRoot, '.route'))).toEqual(false);
        },
      );

      then('the refusal renders as the snapshot shows', () => {
        expect(run.stderr.split(repoRootReal).join('$REPO')).toMatchSnapshot();
      });
    });

    when('[t1] help is asked there', () => {
      const run = useThen('it runs', () =>
        runFace({ face: educationPursuit, args: ['--help'] }),
      );

      then('help still renders, since it touches no route', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.stdout).toContain('usage');
      });
    });
  });
});
