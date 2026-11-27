import { existsSync, readFileSync } from 'fs';
import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';
import { genFile } from '@src/domain.operations/learn/genFile';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

import { asBootSpecWithBriefs } from './asBootSpecWithBriefs';
import { asCourseRouteParts } from './asCourseRouteParts';
import { asModBootSpecSeed } from './asModBootSpecSeed';
import { asPedigreeCourse } from './asPedigreeCourse';
import { asPedigreeDir } from './asPedigreeDir';
import { asPedigreeDirsOfRole } from './asPedigreeDirsOfRole';
import { asPedigreeEntryMarkdown } from './asPedigreeEntryMarkdown';
import { asPedigreeEntryName } from './asPedigreeEntryName';
import { asPedigreeIndexMarkdown } from './asPedigreeIndexMarkdown';
import { asPedigreeIndexPath } from './asPedigreeIndexPath';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { getAllPedigreeEntriesOfRole } from './getAllPedigreeEntriesOfRole';
import { getOneBootSpecModeOfRole } from './getOneBootSpecModeOfRole';
import { getOneCourseProof } from './getOneCourseProof';
import { type EducationRole, getOneEducationRole } from './getOneEducationRole';
import { getOnePursuitLedger } from './getOnePursuitLedger';
import { isPathInside } from './isPathInside';

/**
 * .what = a path as the caller gave it, repo-relative; refuses one that leaves the repo
 * .why = `--from` names the pursuit whose yields land in a role's briefs; a path outside the
 *        repo would feed foreign yields into them
 */
const asPathInsideRepo = (input: { repoRoot: string; at: string }): string => {
  const absolute = path.isAbsolute(input.at)
    ? input.at
    : path.join(input.repoRoot, input.at);
  if (!isPathInside({ dir: input.repoRoot, path: absolute }))
    throw new ConstraintError('--from must name a route inside this repo', {
      from: input.at,
      hint: 'pass --from .route/v$date.education.pursuit.$role.$slug',
    });
  return path.relative(input.repoRoot, absolute);
};

/**
 * .what = the pursuit to stamp: `--from`, else the bound route (a course reads as its pursuit)
 * .why = a driver stamps from wherever the last course left the bind, so a course route must
 *        lead to its pursuit; aught else has no pursuit to stamp and is refused
 */
const getOnePursuitToStamp = async (input: {
  repoRoot: string;
  from: string | null;
}): Promise<string> => {
  // a --from outside the repo would feed foreign yields into a role's briefs
  const fromRelative = input.from
    ? asPathInsideRepo({ repoRoot: input.repoRoot, at: input.from })
    : null;

  const route =
    fromRelative ??
    (await getRouteBindByBranch({ branch: null }))?.route ??
    null;

  // a route absent from disk has no ledger to read; refuse it as absent, never as a pursuit with no course
  const routeAbs =
    route &&
    (path.isAbsolute(route) ? route : path.join(input.repoRoot, route));
  if (route && routeAbs && !existsSync(routeAbs))
    throw new ConstraintError('the route to stamp does not exist', {
      route,
      hint: 'pass --from the route of a pursuit this repo holds, under .route/',
    });

  // a pursuit route stamps itself
  if (route && asPursuitRouteParts({ route })) return route;

  // a course route stamps its pursuit
  const pursuitOfCourse = route ? asCourseRouteParts({ route })?.pursuit : null;
  if (pursuitOfCourse) return pursuitOfCourse;

  // aught else is refused
  throw new ConstraintError('a pedigree is stamped from a pursuit route', {
    route,
    hint: 'run it from a bound pursuit, or pass --from .route/v$date.education.pursuit.$role.$slug',
  });
};

/**
 * .what = the boot spec text to splice into: the one on disk, a mod seed, or null
 * .why = rhachet refuses a mod dir with no boot.yml, and a mod's boot.yml must name the role
 *        it is over (`of: <repo>/<role>`), so a linked role's first graduation seeds one.
 *        an own or native role with no boot spec boots its briefs by default, so it is left
 */
const getOneBootSpecToSplice = (input: {
  bootAbs: string;
  role: EducationRole;
}): string | null => {
  if (existsSync(input.bootAbs)) return readFileSync(input.bootAbs, 'utf-8');
  if (input.role.kind !== 'linked') return null;
  return asModBootSpecSeed({ role: input.role });
};

/**
 * .what = the boot spec that names the pedigree: the index at `say`, the entry at `ref`; null
 *         when the role has no boot spec to name it in
 * .why = rhachet boots only what a boot spec names; the index is small and read each boot,
 *        while each entry is read on demand
 * .note = an own or native role with no boot spec is left so, and boots by default; a
 *         linked role's mod spec is seeded (`getOneBootSpecToSplice`)
 * .note = a read only, so a spec the splice cannot name into refuses before any write
 */
const getOneBootSpecNamesPedigree = (input: {
  repoRoot: string;
  role: EducationRole;
  indexPath: string;
  entryPath: string;
}): string | null => {
  const bootAbs = path.join(input.repoRoot, input.role.bootPath);
  const specFound = getOneBootSpecToSplice({ bootAbs, role: input.role });
  if (specFound === null) return null;
  const roleDir = path.dirname(input.role.bootPath);
  return asBootSpecWithBriefs({
    spec: specFound,
    say: [path.relative(roleDir, input.indexPath)],
    ref: [path.relative(roleDir, input.entryPath)],
    at: input.role.bootPath,
    isRoleSpec: input.role.kind !== 'linked',
    modeOfRole: getOneBootSpecModeOfRole({
      repoRoot: input.repoRoot,
      role: input.role,
    }),
  });
};

/**
 * .what = stamp the pedigree: one entry for a graduated pursuit, the index rebuilt, the boot named
 * .why = the record a role boots; courses come from the course routes the pursuit holds, in
 *        ordinal order, never from the wish, since a review may append courses
 * .note = idempotent: an upsert keyed on date + slug; a re-stamp converges to the same files
 */
export const setPedigreeEntry = async (input: {
  repoRoot: string;
  from: string | null;
}): Promise<{
  entry: PedigreeEntry;
  role: EducationRole;
  entryPath: string;
  indexPath: string;
  bootPath: string | null;
}> => {
  // the pursuit, and the role it educated
  const pursuitRoute = await getOnePursuitToStamp({
    repoRoot: input.repoRoot,
    from: input.from,
  });
  const parts = asPursuitRouteParts({ route: pursuitRoute })!;
  const role = getOneEducationRole({
    repoRoot: input.repoRoot,
    slug: parts.role,
  });

  // every course must have exited before the pursuit graduates: the ledger the judge reads
  const ledger = await getOnePursuitLedger({ pursuitRoute });
  const { courses } = ledger;
  if (ledger.plotFaults.length > 0)
    throw new ConstraintError('the plot has faults', {
      plotFaults: ledger.plotFaults,
      hint: `repair ${pursuitRoute}/1.courses.plot.yield.md, then re-run`,
    });
  if (courses.length === 0)
    throw new ConstraintError('a pursuit with no course cannot graduate', {
      pursuitRoute,
      hint: 'pursue a course first: rhx education.pursuit.course init --course <slug>',
    });
  if (ledger.open.length > 0)
    throw new ConstraintError(
      'a pursuit graduates only once every course has exited',
      {
        coursesOpen: ledger.open.map((course) => course.route),
        hint: `re-enter it and drive it to 6.exit: rhx education.pursuit.course init --course ${ledger.open[0]!.slug}`,
      },
    );
  if (ledger.owed.length > 0)
    throw new ConstraintError(
      'a pursuit graduates only once every plotted course has exited',
      {
        coursesOwed: ledger.owed,
        hint: `pursue the next: rhx education.pursuit.course init --course ${ledger.owed[0]}`,
      },
    );

  // read what each course proved, then render the entry
  const proofs = courses.map((course) =>
    getOneCourseProof({
      course,
      pursuitRoute,
      repoRoot: input.repoRoot,
      role,
    }),
  );
  const entry = new PedigreeEntry({
    role: role.slug,
    date: parts.date,
    slug: parts.slug,
    route: pursuitRoute,
    courses: proofs.map((proof) => asPedigreeCourse({ proof })),
  });
  const entryName = asPedigreeEntryName({ date: parts.date, slug: parts.slug });
  const entryPath = path.join(asPedigreeDir({ role }), entryName);
  const indexPath = asPedigreeIndexPath({ role });

  // every file this stamp writes is rendered first, so a damaged peer entry or a boot spec
  // the splice cannot name into refuses with naught on disk changed. the peers include what
  // a linked role's publisher shipped, since the mod's index shadows the shipped one
  const entriesPeer = getAllPedigreeEntriesOfRole({
    repoRoot: input.repoRoot,
    pedigreeDirs: asPedigreeDirsOfRole({ role }),
    namesOmitted: [entryName],
  });
  const entryMarkdown = asPedigreeEntryMarkdown({ entry, proofs });
  const indexMarkdown = asPedigreeIndexMarkdown({
    role: role.slug,
    entries: [...entriesPeer, entry],
  });
  const bootSpec = getOneBootSpecNamesPedigree({
    repoRoot: input.repoRoot,
    role,
    indexPath,
    entryPath,
  });

  // the writes: the entry, the index rebuilt whole, the boot spec that names both
  await fs.mkdir(path.join(input.repoRoot, asPedigreeDir({ role })), {
    recursive: true,
  });
  await genFile({
    at: path.join(input.repoRoot, entryPath),
    content: entryMarkdown,
    idem: 'upsert',
  });
  await genFile({
    at: path.join(input.repoRoot, indexPath),
    content: indexMarkdown,
    idem: 'upsert',
  });
  if (bootSpec !== null)
    await genFile({
      at: path.join(input.repoRoot, role.bootPath),
      content: bootSpec,
      idem: 'upsert',
    });
  const bootPath = bootSpec === null ? null : role.bootPath;

  return { entry, role, entryPath, indexPath, bootPath };
};
