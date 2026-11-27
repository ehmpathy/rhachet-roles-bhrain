import { existsSync, readdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import { today } from 'iso-time';
import * as path from 'path';

import { genFile } from '@src/domain.operations/learn/genFile';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getOneRouteBindFlagFound } from '@src/domain.operations/route/bind/getOneRouteBindFlagFound';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { compareStrings } from '@src/utils/compareStrings';

import { asCourseRouteParts } from './asCourseRouteParts';
import { asCourseSeededLines } from './asCourseSeededLines';
import { asEducationTemplateVars } from './asEducationTemplateVars';
import { asModBootSpecSeed } from './asModBootSpecSeed';
import { asPursuitDate } from './asPursuitDate';
import { asPursuitRouteName } from './asPursuitRouteName';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { genRouteFromTemplates } from './genRouteFromTemplates';
import { type EducationRole, getOneEducationRole } from './getOneEducationRole';
import { getOnePedigreeStamp } from './getOnePedigreeStamp';
import { isEducationSlug } from './isEducationSlug';

const TEMPLATES_DIR = path.join(__dirname, 'pursuit', 'templates');

/**
 * .what = the dir all routes root under
 */
const DIR_OF_ROUTES = '.route';

/**
 * .what = of the route dir names given, the latest pursuit for this role and slug, or null
 * .why = a pursuit dir name leads with its date, so the latest sorts last
 */
const asPursuitOfSlugLatest = (input: {
  names: string[];
  role: string;
  slug: string;
}): { name: string; date: string } | null => {
  const matches = input.names
    .flatMap((name) => {
      const parts = asPursuitRouteParts({ route: name });
      const isMatch = parts?.role === input.role && parts.slug === input.slug;
      return isMatch ? [{ name, date: parts.date }] : [];
    })
    .sort((a, b) => compareStrings(a.name, b.name));
  return matches.at(-1) ?? null;
};

/**
 * .what = the latest pursuit opened for this role and slug, on any date, or null
 * .why = a re-run of init on a later day must find the pursuit already open, so the date in
 *        its name cannot be the key
 */
const getOnePursuitLatest = (input: {
  repoRoot: string;
  role: string;
  slug: string;
}): { route: string; date: string } | null => {
  const routesDir = path.join(input.repoRoot, DIR_OF_ROUTES);
  if (!existsSync(routesDir)) return null;
  const latest = asPursuitOfSlugLatest({
    names: readdirSync(routesDir),
    role: input.role,
    slug: input.slug,
  });
  if (!latest) return null;
  return {
    route: path.join(DIR_OF_ROUTES, latest.name),
    date: latest.date,
  };
};

/**
 * .what = the route this init writes: an open pursuit is reused, a graduated one is retaken
 * .why = a re-run on a later day finds the open pursuit rather than a second one; a pursuit
 *        that graduated keeps its record, so a retake opens a new dated route beside it
 * .note = refuses a retake on the day the pursuit graduated: the dir name would collide
 */
const getOnePursuitToOpen = (input: {
  repoRoot: string;
  role: EducationRole;
  slug: string;
}): string => {
  const date = asPursuitDate({ day: today() });
  const routeOfToday = path.join(
    DIR_OF_ROUTES,
    asPursuitRouteName({ date, role: input.role.slug, slug: input.slug }),
  );
  const latest = getOnePursuitLatest({
    repoRoot: input.repoRoot,
    role: input.role.slug,
    slug: input.slug,
  });
  if (!latest) return routeOfToday;

  // open → reuse it; a pursuit graduated once its entry is written (the stamp's first fact)
  const graduated = getOnePedigreeStamp({
    repoRoot: input.repoRoot,
    role: input.role,
    date: latest.date,
    slug: input.slug,
  }).entry;
  if (!graduated) return latest.route;

  // graduated today → a retake would share its dir
  if (latest.date === date)
    throw new ConstraintError(`pursuit ${input.slug} already graduated today`, {
      route: latest.route,
      hint: 'read it via rhx education.pedigree get, or open a new pursuit under another --slug',
    });

  // graduated on a prior date → a retake, dated today
  return routeOfToday;
};

/**
 * .what = findsert a linked role's mod boot spec with its `of:` seed; true when written now
 * .why = `4.2.entool.execute` names each write in the boot spec, and rhachet refuses a mod with
 *        no boot.yml, so the file must exist before the first course reaches 4.2
 */
const setModBootSpecSeeded = async (input: {
  repoRoot: string;
  role: EducationRole;
}): Promise<boolean> => {
  if (input.role.kind !== 'linked') return false;
  const bootAbs = path.join(input.repoRoot, input.role.bootPath);
  await mkdir(path.dirname(bootAbs), { recursive: true });
  const { created } = await genFile({
    at: bootAbs,
    content: asModBootSpecSeed({ role: input.role }),
    idem: 'findsert',
  });
  return created;
};

/**
 * .what = the slugs given that are not lowercase kebab
 */
const getAllSlugsMalformed = (input: { slugs: string[] }): string[] =>
  input.slugs.filter((slug) => !isEducationSlug({ slug }));

/**
 * .what = the courses seeded into the wish, one line each, in order
 */
const asCoursesSeeded = (input: { courses: string[] }): string =>
  input.courses.length === 0
    ? '(none named; `1.courses.plot` plots them from the aim)'
    : asCourseSeededLines({ courses: input.courses }).join('\n');

/**
 * .what = whether a route is a pursuit whose pedigree entry is written
 * .why = a graduated pursuit's bind holds naught in flight, so a new pursuit may take the branch
 */
const isPursuitRouteGraduated = (input: {
  repoRoot: string;
  route: string;
}): boolean => {
  const parts = asPursuitRouteParts({ route: input.route });
  if (!parts) return false;
  return getOnePedigreeStamp({
    repoRoot: input.repoRoot,
    role: getOneEducationRole({ repoRoot: input.repoRoot, slug: parts.role }),
    date: parts.date,
    slug: parts.slug,
  }).entry;
};

/**
 * .what = open a pursuit: findsert its route, seed its courses, bind it to the branch
 * .why = the entrypoint of education; every course runs within the pursuit it opens
 * .note = idempotent: a re-run finds the same route, keeps each file, and re-binds
 */
export const initPursuitRoute = async (input: {
  repoRoot: string;
  role: string;
  slug: string | null;
  courses: string[];
}): Promise<{
  route: string;
  role: EducationRole;
  created: string[];
  kept: string[];
  bootSpecFound: boolean;
}> => {
  // the slug defaults to the course when exactly one is named
  const slug =
    input.slug ?? (input.courses.length === 1 ? input.courses[0]! : null);
  if (!slug)
    throw new ConstraintError('a pursuit needs a --slug', {
      hint: 'pass --slug <slug>, or name exactly one --course and it serves as the slug',
    });

  // every slug is kebab, the role's too, so the route name it writes parses back to a pursuit
  const slugsBad = getAllSlugsMalformed({
    slugs: [input.role, slug, ...input.courses],
  });
  if (slugsBad.length > 0)
    throw new ConstraintError('a slug must be lowercase kebab', {
      slugsBad,
      hint: 'use only a-z, 0-9, and single hyphens, e.g. reliable-writes',
    });

  // the role must exist here; this names where the pursuit lands
  const role = getOneEducationRole({
    repoRoot: input.repoRoot,
    slug: input.role,
  });

  // the open pursuit of this slug, else a new one dated today
  const route = getOnePursuitToOpen({ repoRoot: input.repoRoot, role, slug });

  // a branch inside one of this pursuit's courses keeps its course; an unbind would strand it
  const bound = await getRouteBindByBranch({ branch: null });
  const courseBound = bound ? asCourseRouteParts({ route: bound.route }) : null;
  if (courseBound?.pursuit === route)
    throw new ConstraintError('the branch is inside a course of this pursuit', {
      bound: bound!.route,
      hint: 'drive the course to its exit, then the bind returns here: rhx education.pursuit.course exit',
    });

  // a branch bound to another route keeps it, unless that route is a graduated pursuit: an unbind
  // would strand a route mid-drive, but a graduated pursuit has no drive left to strand
  const boundElsewhere = bound && bound.route !== route ? bound : null;
  const boundGraduated = boundElsewhere
    ? isPursuitRouteGraduated({
        repoRoot: input.repoRoot,
        route: boundElsewhere.route,
      })
    : false;
  if (boundElsewhere && !boundGraduated)
    throw new ConstraintError(
      `the branch is already bound to ${boundElsewhere.route}`,
      {
        bound: boundElsewhere.route,
        hint: 'open this pursuit on a fresh branch (git checkout -b feat/<slug>), or finish the bound route first',
      },
    );

  // a graduated pursuit's bind gives way; it holds naught in flight, so a later fault strands none
  if (boundGraduated) await delRouteBind();

  // a branch that cannot take the bind (main) refuses before any write
  await getOneRouteBindFlagFound({ route });

  // findsert the stones, guards, and wish
  const { created, kept } = await genRouteFromTemplates({
    templatesDir: TEMPLATES_DIR,
    routeDir: path.join(input.repoRoot, route),
    vars: {
      ...asEducationTemplateVars({
        role,
        pursuitRoute: route,
        bootSpecFound: existsSync(path.join(input.repoRoot, role.bootPath)),
      }),
      SLUG: slug,
      AIM: '(the director states the aim here, before `1.courses.plot`)',
      COURSES: asCoursesSeeded({ courses: input.courses }),
    },
  });

  // a linked role's mod gets its boot spec now, so 4.2 names each write into a file rhachet reads
  const modSeeded = await setModBootSpecSeeded({
    repoRoot: input.repoRoot,
    role,
  });

  // bind it, so `route.drive` finds it
  await setRouteBind({ route });

  return {
    route,
    role,
    created: modSeeded ? [...created, role.bootPath] : created,
    kept,
    bootSpecFound: existsSync(path.join(input.repoRoot, role.bootPath)),
  };
};
