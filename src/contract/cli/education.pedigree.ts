/**
 * .what = cli entrypoint for the learner education.pedigree skill
 * .why = the record of education: `set` stamps a graduated pursuit into the role's pedigree,
 *        `get` shows what each role was taught. isolated on its own cli subpath
 *        (rule.require.isolated-cli-subpath-exports)
 *
 * verbs:
 *   get [--for <role>]    → every pursuit a role graduated, with its courses
 *   set [--from <route>]  → stamp the bound pursuit (or --from) into its role's pedigree
 */
import { BadRequestError, ConstraintError } from 'helpful-errors';

import { asEducationArgs } from '@src/contract/cli/asEducationArgs';
import { asEducationFlagOne } from '@src/contract/cli/asEducationFlagOne';
import { asTreeLines } from '@src/contract/cli/asTreeLines';
import { emitEducationHeader } from '@src/contract/cli/emitEducationHeader';
import { emitEducationRefusal } from '@src/contract/cli/emitEducationRefusal';
import type { PedigreeCourse } from '@src/domain.objects/Learner/PedigreeCourse';
import type { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';
import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { getAllPedigreeEntries } from '@src/domain.operations/education/getAllPedigreeEntries';
import { getOneEducationRepoRoot } from '@src/domain.operations/education/getOneEducationRepoRoot';
import { getOneRoleFoundLabel } from '@src/domain.operations/education/getOneRoleFoundLabel';
import { setPedigreeEntry } from '@src/domain.operations/education/setPedigreeEntry';
import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

/**
 * .what = the leaves of one course: outcome, greats, claims, yields
 */
const asCourseLeaves = (input: { course: PedigreeCourse }): string[] => {
  const { course } = input;
  const claims = [
    course.claimsHeld > 0 ? `${course.claimsHeld} held` : null,
    course.claimsRefuted > 0 ? `${course.claimsRefuted} refuted` : null,
    course.claimsUntested > 0 ? `${course.claimsUntested} untested` : null,
  ].filter((part): part is string => part !== null);
  return [
    `outcome = baseline ${course.baseline} → after ${course.after} · transfer task ${course.transfer}`,
    `greats = ${course.greats.join(' · ') || '(none)'}`,
    `claims = ${claims.join(', ') || '(none)'}`,
    `yields = ${course.briefs} ${course.briefs === 1 ? 'brief' : 'briefs'}, ${course.skills} ${course.skills === 1 ? 'skill' : 'skills'}`,
  ];
};

/**
 * .what = the tree lines of one pedigree entry, under `indent`, closed or not
 */
const asEntryLines = (input: {
  entry: PedigreeEntry;
  indent: string;
  isLast: boolean;
}): string[] => {
  const { entry } = input;
  const markerEntry = asTreeBranchMarkers({ isLast: input.isLast });
  const head = `${input.indent}${markerEntry.elbow} pursuit = v${entry.date} ${entry.slug}`;
  const inner = `${input.indent}${markerEntry.stem}`;
  const courses = entry.courses.flatMap((course, index) => {
    const markerCourse = asTreeBranchMarkers({
      isLast: index === entry.courses.length - 1,
    });
    const builds =
      course.buildsOn.length > 0
        ? ` (built on ${course.buildsOn.join(', ')})`
        : '';
    return [
      `${inner}${markerCourse.elbow} ${course.ordinal}. ${course.slug}${builds}`,
      ...asTreeLines({
        indent: `${inner}${markerCourse.stem}`,
        items: asCourseLeaves({ course }),
      }),
    ];
  });
  return [head, ...courses];
};

/**
 * .what = the roles a pedigree read named, comma-joined: `mechanic, learner`
 */
const asRoleNamesJoined = (input: { pedigrees: { role: string }[] }): string =>
  input.pedigrees.map((pedigree) => pedigree.role).join(', ');

/**
 * .what = one line per stamped course: its ordinal, slug, and score move, in the words `get` uses
 */
const asCourseOutcomeLines = (input: { courses: PedigreeCourse[] }): string[] =>
  input.courses.map(
    (course) =>
      `${course.ordinal}. ${course.slug} · baseline ${course.baseline} → after ${course.after}`,
  );

/**
 * .what = the one tree of every role: a branch per role with a pursuit graduated, then one leaf
 *         that names each role with none
 * .why = a director reads every role at a glance; a role with no courses is never absent, and
 *        never a branch apiece, so twelve empty roles cost one line
 */
const asPedigreeTreeOfAllLines = (input: {
  pedigrees: Array<{ role: string; entries: PedigreeEntry[] }>;
}): string[] => {
  const graduated = input.pedigrees.filter((p) => p.entries.length > 0);
  const empty = input.pedigrees.filter((p) => p.entries.length === 0);
  const branches = graduated.map((pedigree, index) => {
    const marker = asTreeBranchMarkers({
      isLast: index === graduated.length - 1 && empty.length === 0,
    });
    return [
      `   ${marker.elbow} ${pedigree.role}`,
      ...pedigree.entries.flatMap((entry, entryIndex) =>
        asEntryLines({
          entry,
          indent: `   ${marker.stem}`,
          isLast: entryIndex === pedigree.entries.length - 1,
        }),
      ),
    ];
  });
  const leafEmpty =
    empty.length === 0
      ? []
      : [
          `   └─ no courses (${empty.length} ${empty.length === 1 ? 'role' : 'roles'})`,
          `      └─ ${empty.map((p) => p.role).join(' · ')}`,
        ];
  const spacer = branches.length > 0 && leafEmpty.length > 0 ? ['   │'] : [];
  return [
    ...branches.flatMap((lines, index) =>
      index === 0 ? lines : ['   │', ...lines],
    ),
    ...spacer,
    ...leafEmpty,
  ];
};

/**
 * .what = run `get`: one tree over every role, or the tree of the role `--for` names
 */
const runGet = (input: {
  repoRoot: string;
  flags: Record<string, string[]>;
}) => {
  const roleNamed = asEducationFlagOne({ flags: input.flags, flag: '--for' });
  const pedigrees = getAllPedigreeEntries({
    repoRoot: input.repoRoot,
    role: roleNamed,
  });
  emitEducationHeader({
    vibe: 'roots run deep',
    command: 'education.pedigree get',
  });

  // every role: one tree, the empty ones collapsed into one leaf, then the way to start one
  if (roleNamed === null && pedigrees.length > 0) {
    asPedigreeTreeOfAllLines({ pedigrees }).forEach((line) =>
      console.log(line),
    );
    asDidYouKnowLines({
      rows: [
        'open a pursuit: rhx education.pursuit init --for <role> --slug <slug>',
      ],
    }).forEach((line) => console.log(line));
    return;
  }

  // no record at all says so, with the way to make one
  if (pedigrees.every((pedigree) => pedigree.entries.length === 0)) {
    const named = roleNamed
      ? getOneRoleFoundLabel({ repoRoot: input.repoRoot, slug: roleNamed })
      : asRoleNamesJoined({ pedigrees });
    if (named) console.log(`   ├─ role = ${named}`);
    console.log('   ├─ pursuits graduated = 0');
    console.log(
      '   └─ next: rhx education.pursuit init --for <role> --slug <slug>',
    );
    return;
  }

  // the named role's tree
  pedigrees.forEach((pedigree) => {
    console.log(
      `   ├─ role = ${getOneRoleFoundLabel({ repoRoot: input.repoRoot, slug: pedigree.role })}`,
    );
    pedigree.entries.forEach((entry, index) =>
      asEntryLines({
        entry,
        indent: '   ',
        isLast: index === pedigree.entries.length - 1,
      }).forEach((line) => console.log(line)),
    );
  });
};

/**
 * .what = run `set`: stamp the pursuit, then report what was written
 */
const runSet = async (input: {
  repoRoot: string;
  flags: Record<string, string[]>;
}) => {
  const result = await setPedigreeEntry({
    repoRoot: input.repoRoot,
    from: asEducationFlagOne({ flags: input.flags, flag: '--from' }),
  });

  emitEducationHeader({ vibe: 'so it is', command: 'education.pedigree set' });
  console.log(`   ├─ role = ${result.role.slug} (${result.role.kind})`);
  console.log(`   ├─ pursuit = v${result.entry.date} ${result.entry.slug}`);
  console.log('   ├─ courses');
  asTreeLines({
    indent: '   │  ',
    items: asCourseOutcomeLines({ courses: result.entry.courses }),
  }).forEach((line) => console.log(line));
  console.log(`   ├─ entry = ${result.entryPath}`);
  console.log(`   ├─ index = ${result.indexPath}`);
  console.log(
    result.bootPath
      ? `   └─ boot = ${result.bootPath} names both (index at say, entry at ref)`
      : `   └─ boot = ${result.role.bootPath} (absent, so every brief boots at say)`,
  );
};

/**
 * .what = emit the --help usage
 */
const emitHelp = (): void => {
  emitEducationHeader({ vibe: 'tea first', command: 'education.pedigree' });
  console.log(
    '   ├─ what = the record of what each role was taught: pursuits, courses, greats, claims',
  );
  console.log('   ├─ usage');
  console.log('   │  ├─ rhx education.pedigree get [--for <role>]');
  console.log('   │  └─ rhx education.pedigree set [--from <pursuit route>]');
  console.log('   ├─ inputs');
  console.log(
    '   │  ├─ --for (get) one role; default every role this repo holds',
  );
  console.log(
    '   │  └─ --from (set) the pursuit to stamp; default the bound one',
  );
  console.log('   ├─ examples');
  console.log('   │  ├─ rhx education.pedigree get --for mechanic');
  console.log(
    '   │  └─ rhx education.pedigree set   # from 4.graduate of a pursuit',
  );
  console.log('   └─ exit = 0 done · 1 malfunction · 2 refused, with its fix');
};

/**
 * .what = cli entrypoint for the education.pedigree skill
 *
 * exits 0 on success or --help · 2 on a refusal the caller must fix
 */
export const educationPedigree = async (): Promise<void> => {
  try {
    const args = asEducationArgs({
      argv: process.argv,
      flagsOfVerb: { get: ['--for'], set: ['--from'] },
    });
    if (args.help) return emitHelp();
    const repoRoot = await getOneEducationRepoRoot({ cwd: process.cwd() });
    const verb = args.words.join(' ');
    if (verb === 'get') return runGet({ repoRoot, flags: args.flags });
    if (verb === 'set') return await runSet({ repoRoot, flags: args.flags });
    throw new ConstraintError(
      verb ? `unknown verb \`${verb}\`` : 'no verb given',
      {
        hint: 'run: rhx education.pedigree get, or set',
      },
    );
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    emitEducationRefusal({ error });
    process.exitCode = 2; // not process.exit, so a piped stderr drains whole
  }
};
