/**
 * .what = cli entrypoint for the learner education.pursuit.course skill
 * .why = the stack moves of a pursuit: push into a course, pop back out. a course runs only
 *        within a pursuit, and ends only by exit. isolated on its own cli subpath
 *        (rule.require.isolated-cli-subpath-exports)
 *
 * verbs:
 *   init  → descend into a course: findsert its route, swap the bind to it
 *   exit  → return to the pursuit: record the exit, pass `6.exit`, swap the bind back
 *   judge → the `6.exit` judge's criterion (`exited`)
 */
import { BadRequestError, ConstraintError } from 'helpful-errors';

import { asEducationArgs } from '@src/contract/cli/asEducationArgs';
import { asEducationFlagOne } from '@src/contract/cli/asEducationFlagOne';
import { emitEducationHeader } from '@src/contract/cli/emitEducationHeader';
import { emitEducationRefusal } from '@src/contract/cli/emitEducationRefusal';
import { exitCourseRoute } from '@src/domain.operations/education/exitCourseRoute';
import {
  type EducationJudgeCriterion,
  getAllEducationJudgeCriteria,
  getOneEducationJudgeVerdict,
} from '@src/domain.operations/education/getOneEducationJudgeVerdict';
import { getOneEducationRepoRoot } from '@src/domain.operations/education/getOneEducationRepoRoot';
import { initCourseRoute } from '@src/domain.operations/education/initCourseRoute';

/**
 * .what = the criteria a course judge may rule on, from the one judge table
 */
const CRITERIA_OF_COURSE: EducationJudgeCriterion[] =
  getAllEducationJudgeCriteria({ routeKind: 'course' });

/**
 * .what = run `init`: push into the course, then report where the bind now stands
 */
const runInit = async (input: {
  repoRoot: string;
  flags: Record<string, string[]>;
}) => {
  const course = asEducationFlagOne({ flags: input.flags, flag: '--course' });
  if (!course)
    throw new ConstraintError('--course is required', {
      hint: 'name the plotted course: rhx education.pursuit.course init --course <slug>',
    });
  const result = await initCourseRoute({ repoRoot: input.repoRoot, course });

  emitEducationHeader({
    vibe: 'stillness before action',
    command: 'education.pursuit.course init',
  });
  console.log(`   ├─ course = ${result.ordinal}. ${course}`);
  console.log(`   ├─ route = ${result.route}`);
  console.log(
    `   ├─ files = ${result.created.length} created, ${result.kept.length} kept`,
  );
  console.log(`   ├─ bound = the course (was ${result.pursuitRoute})`);
  console.log('   └─ next: rhx route.drive');
};

/**
 * .what = run `exit`: pop back to the pursuit, then report where the bind now stands
 */
const runExit = async (input: { repoRoot: string }) => {
  const result = await exitCourseRoute({ repoRoot: input.repoRoot });

  emitEducationHeader({
    vibe: 'as leaves fall',
    command: 'education.pursuit.course exit',
  });
  console.log(`   ├─ course = ${result.ordinal}. ${result.slug}`);
  console.log('   ├─ stones = all passed, exit recorded');
  console.log(`   ├─ route = ${result.pursuitRoute}`);
  console.log(`   ├─ bound = the pursuit (was ${result.route})`);
  console.log('   └─ next: rhx route.drive');
};

/**
 * .what = run `judge`: print the `6.exit` verdict in the form the judge parser reads
 * .note = exits 0 on a verdict, passed or not; only a refusal or a fault exits non-zero
 */
const runJudge = async (input: {
  repoRoot: string;
  flags: Record<string, string[]>;
}) => {
  const criterion = asEducationFlagOne({
    flags: input.flags,
    flag: '--criterion',
  });
  const route = asEducationFlagOne({ flags: input.flags, flag: '--route' });
  const criterionFound = CRITERIA_OF_COURSE.find((each) => each === criterion);
  if (!criterionFound || !route)
    throw new ConstraintError(
      `judge needs --criterion ${CRITERIA_OF_COURSE.join('|')} and --route`,
      {
        hint: `pass --criterion ${CRITERIA_OF_COURSE.join('|')} --route $route`,
      },
    );
  const verdict = await getOneEducationJudgeVerdict({
    repoRoot: input.repoRoot,
    route,
    criterion: criterionFound,
  });
  console.log(`passed: ${verdict.passed}`);
  console.log(`reason: ${verdict.reason}`);
};

/**
 * .what = emit the --help usage
 */
const emitHelp = (): void => {
  emitEducationHeader({
    vibe: 'tea first',
    command: 'education.pursuit.course',
  });
  console.log(
    '   ├─ what = descend into one course of a pursuit, and return from it',
  );
  console.log('   ├─ usage');
  console.log('   │  ├─ rhx education.pursuit.course init --course <slug>');
  console.log('   │  └─ rhx education.pursuit.course exit');
  console.log(
    '   ├─ runs only within a pursuit; open one with rhx education.pursuit init',
  );
  console.log(
    '   ├─ a course ends only by exit, once every stone before 6.exit has passed',
  );
  console.log('   ├─ examples');
  console.log(
    '   │  ├─ rhx education.pursuit.course init --course idempotency',
  );
  console.log('   │  └─ rhx education.pursuit.course exit');
  console.log('   ├─ guard verb = judge --criterion exited --route $route');
  console.log('   └─ exit = 0 done · 1 malfunction · 2 refused, with its fix');
};

/**
 * .what = cli entrypoint for the education.pursuit.course skill
 *
 * exits 0 on success or --help · 2 on a refusal the caller must fix
 */
export const educationPursuitCourse = async (): Promise<void> => {
  try {
    const args = asEducationArgs({
      argv: process.argv,
      flagsOfVerb: {
        init: ['--course'],
        exit: [],
        judge: ['--criterion', '--route'],
      },
    });
    if (args.help) return emitHelp();
    const repoRoot = await getOneEducationRepoRoot({ cwd: process.cwd() });
    const verb = args.words.join(' ');
    if (verb === 'init') return await runInit({ repoRoot, flags: args.flags });
    if (verb === 'exit') return await runExit({ repoRoot });
    if (verb === 'judge')
      return await runJudge({ repoRoot, flags: args.flags });
    throw new ConstraintError(
      verb ? `unknown verb \`${verb}\`` : 'no verb given',
      {
        hint: 'run: rhx education.pursuit.course init --course <slug>, or exit',
      },
    );
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    emitEducationRefusal({ error });
    process.exitCode = 2; // not process.exit, so a piped stderr drains whole
  }
};
