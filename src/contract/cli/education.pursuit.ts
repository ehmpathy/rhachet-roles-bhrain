/**
 * .what = cli entrypoint for the learner education.pursuit skill
 * .why = the entrypoint of education: a director opens a pursuit for a role, and the route it
 *        binds carries the role through its courses to graduation. isolated on its own cli
 *        subpath (rule.require.isolated-cli-subpath-exports)
 *
 * verbs:
 *   init  → open a pursuit: findsert its route, seed its courses, bind it
 *   judge → a judge's criterion on a pursuit route (`plot-valid`, `courses-exited`,
 *           `pedigree-stamped`, `boot-within-budget`)
 */
import { BadRequestError, ConstraintError } from 'helpful-errors';

import { asEducationArgs } from '@src/contract/cli/asEducationArgs';
import { asEducationFlagOne } from '@src/contract/cli/asEducationFlagOne';
import { asTreeLines } from '@src/contract/cli/asTreeLines';
import { emitEducationHeader } from '@src/contract/cli/emitEducationHeader';
import { emitEducationRefusal } from '@src/contract/cli/emitEducationRefusal';
import { asCourseSeededLines } from '@src/domain.operations/education/asCourseSeededLines';
import {
  type EducationJudgeCriterion,
  getAllEducationJudgeCriteria,
  getOneEducationJudgeVerdict,
} from '@src/domain.operations/education/getOneEducationJudgeVerdict';
import { getOneEducationRepoRoot } from '@src/domain.operations/education/getOneEducationRepoRoot';
import { initPursuitRoute } from '@src/domain.operations/education/initPursuitRoute';

/**
 * .what = the criteria a pursuit judge may rule on, from the one judge table
 */
const CRITERIA_OF_PURSUIT: EducationJudgeCriterion[] =
  getAllEducationJudgeCriteria({ routeKind: 'pursuit' });

/**
 * .what = the seeded courses as tree items, or one line that says the plot will name them
 * .why = a re-run keeps the wish it found, so its seed is the one written then, never the flags
 *        of this run; the line says so rather than echo flags the wish did not take
 */
const asCoursesSeededItems = (input: {
  courses: string[];
  wishKept: boolean;
}): string[] => {
  if (input.wishKept)
    return [
      '(kept as 0.wish.md holds them; a re-run never rewrites the wish, edit it to change the seed)',
    ];
  if (input.courses.length === 0) return ['(none; 1.courses.plot plots them)'];
  return asCourseSeededLines({ courses: input.courses });
};

/**
 * .what = run `init`: open the pursuit, then report its route, role, courses, and next step
 */
const runInit = async (input: {
  repoRoot: string;
  flags: Record<string, string[]>;
}) => {
  const role = asEducationFlagOne({ flags: input.flags, flag: '--for' });
  if (!role)
    throw new ConstraintError('--for is required', {
      hint: 'name the role to educate: rhx education.pursuit init --for mechanic --slug <slug>',
    });
  const courses = input.flags['--course'] ?? [];
  const result = await initPursuitRoute({
    repoRoot: input.repoRoot,
    role,
    slug: asEducationFlagOne({ flags: input.flags, flag: '--slug' }),
    courses,
  });

  // a re-run that writes naught says so, so a director who re-ran a lost command sees it held
  const rerun = result.created.length === 0;
  emitEducationHeader({
    vibe: rerun ? 'the pond is still' : 'the path is clear',
    command: 'education.pursuit init',
  });
  console.log(`   ├─ route = ${result.route}`);
  console.log(`   ├─ role = ${result.role.slug} (${result.role.kind})`);
  asTreeLines({
    indent: '   │  ',
    items: [
      `briefs = ${result.role.briefsDir}`,
      `skills = ${result.role.skillsDir}`,
      result.bootSpecFound
        ? `boot = ${result.role.bootPath}`
        : `boot = ${result.role.bootPath} (absent, so every brief boots at say)`,
    ],
  }).forEach((line) => console.log(line));
  console.log('   ├─ courses seeded');
  asTreeLines({
    indent: '   │  ',
    items: asCoursesSeededItems({
      courses,
      wishKept: result.kept.includes('0.wish.md'),
    }),
  }).forEach((line) => console.log(line));
  console.log(
    `   ├─ files = ${result.created.length} created, ${result.kept.length} kept`,
  );
  console.log(`   ├─ bound = the pursuit${rerun ? ' (kept)' : ''}`);
  console.log(
    `   ├─ drive it as = rhx enroll claude --roles ${asEnrollRoles({ role: result.role.slug })}`,
  );
  console.log(
    rerun
      ? '   └─ next: naught new was written; resume with rhx route.drive'
      : '   └─ next: state the aim in 0.wish.md, then rhx route.drive',
  );
};

/**
 * .what = the roles a clone enrolls to drive a pursuit, comma-joined, each once
 * .why = the target role for its extant briefs, learner for the entool rules, driver for
 *        `route.drive`, researcher for the probe method and its fidelity rules
 */
const asEnrollRoles = (input: { role: string }): string =>
  [...new Set([input.role, 'learner', 'driver', 'researcher'])].join(',');

/**
 * .what = run `judge`: print a guard verdict in the form the judge parser reads
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
  const criterionFound = CRITERIA_OF_PURSUIT.find((each) => each === criterion);
  if (!criterionFound || !route)
    throw new ConstraintError('judge needs --criterion and --route', {
      hint: `pass --criterion ${CRITERIA_OF_PURSUIT.join('|')} --route $route`,
    });
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
  emitEducationHeader({ vibe: 'tea first', command: 'education.pursuit' });
  console.log(
    '   ├─ what = send a role on a pursuit: courses from the greats, then graduation',
  );
  console.log('   ├─ usage');
  console.log(
    '   │  └─ rhx education.pursuit init --for <role> --slug <slug> [--course <slug>…]',
  );
  console.log('   ├─ inputs');
  asTreeLines({
    indent: '   │  ',
    items: [
      '--for (required) the role to educate: own, linked, or native to this repo',
      '--slug the pursuit name, kebab; defaults to the course when one --course is named',
      '--course a course to seed the plot, in order; repeatable',
    ],
  }).forEach((line) => console.log(line));
  console.log('   ├─ examples');
  asTreeLines({
    indent: '   │  ',
    items: [
      'rhx education.pursuit init --for mechanic --course idempotency',
      'rhx education.pursuit init --for mechanic --slug reliable-writes --course idempotency --course retries',
    ],
  }).forEach((line) => console.log(line));
  console.log(
    `   ├─ guard verb = judge --criterion ${CRITERIA_OF_PURSUIT.join('|')} --route $route`,
  );
  console.log('   └─ exit = 0 done · 1 malfunction · 2 refused, with its fix');
};

/**
 * .what = cli entrypoint for the education.pursuit skill
 *
 * exits 0 on success or --help · 2 on a refusal the caller must fix
 */
export const educationPursuit = async (): Promise<void> => {
  try {
    const args = asEducationArgs({
      argv: process.argv,
      flagsOfVerb: {
        init: ['--for', '--slug', '--course'],
        judge: ['--criterion', '--route'],
      },
    });
    if (args.help) return emitHelp();
    const repoRoot = await getOneEducationRepoRoot({ cwd: process.cwd() });
    const verb = args.words.join(' ');
    if (verb === 'init') return await runInit({ repoRoot, flags: args.flags });
    if (verb === 'judge')
      return await runJudge({ repoRoot, flags: args.flags });
    throw new ConstraintError(
      verb ? `unknown verb \`${verb}\`` : 'no verb given',
      {
        hint: 'run: rhx education.pursuit init --for <role> --slug <slug>',
      },
    );
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    emitEducationRefusal({ error });
    process.exitCode = 2; // not process.exit, so a piped stderr drains whole
  }
};
