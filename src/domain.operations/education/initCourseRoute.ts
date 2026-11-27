import { existsSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

import { asCourseRouteName } from './asCourseRouteName';
import { asCourseRouteParts } from './asCourseRouteParts';
import { asEducationTemplateVars } from './asEducationTemplateVars';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { DIR_OF_COURSES } from './DIR_OF_COURSES';
import { genBootClaimsBefore } from './genBootClaimsBefore';
import { genRouteFromTemplates } from './genRouteFromTemplates';
import { getOneCourseOrdinalNext } from './getOneCourseOrdinalNext';
import { getOneEducationRole } from './getOneEducationRole';
import { getOnePursuitLedger } from './getOnePursuitLedger';
import { isEducationSlug } from './isEducationSlug';
import { setRouteBindSwap } from './setRouteBindSwap';

const TEMPLATES_DIR = path.join(__dirname, 'course', 'templates');

/**
 * .what = descend into a course: findsert its route under the bound pursuit, swap the bind to it
 * .why = the push half of the stack; a course runs only within a pursuit, so it has a plot to
 *        sit in and a pedigree entry to land in
 * .note = idempotent: a course of the same slug keeps its ordinal and its files
 */
export const initCourseRoute = async (input: {
  repoRoot: string;
  course: string;
}): Promise<{
  route: string;
  pursuitRoute: string;
  ordinal: number;
  created: string[];
  kept: string[];
}> => {
  // the slug reads in a dir name
  if (!isEducationSlug({ slug: input.course }))
    throw new ConstraintError('a course slug must be lowercase kebab', {
      course: input.course,
      hint: 'use only a-z, 0-9, and single hyphens, e.g. idempotency',
    });

  // the branch must stand on a pursuit, never a course and never aught else
  const bound = await getRouteBindByBranch({ branch: null });
  const courseBound = bound ? asCourseRouteParts({ route: bound.route }) : null;
  if (courseBound)
    throw new ConstraintError('already within a course; exit it first', {
      bound: bound!.route,
      hint: 'finish its stones, then run: rhx education.pursuit.course exit',
    });
  const pursuit = bound ? asPursuitRouteParts({ route: bound.route }) : null;
  if (!bound || !pursuit)
    throw new ConstraintError('a course runs only within a pursuit', {
      bound: bound?.route ?? null,
      hint: 'open one first: rhx education.pursuit init --for <role> --slug <slug>',
    });
  const pursuitRoute = bound.route;

  // the course of this slug keeps its ordinal; a new one takes the next, once all prior exited
  const ledger = await getOnePursuitLedger({ pursuitRoute });
  const { courses } = ledger;
  const courseFound = courses.find((course) => course.slug === input.course);
  if (courseFound?.exited)
    throw new ConstraintError(`course ${input.course} has already exited`, {
      route: courseFound.route,
      hint: 'init the next plotted course, or pass 2.courses.pursue once every one has exited',
    });
  if (!courseFound && ledger.open.length > 0)
    throw new ConstraintError('a prior course has not exited', {
      coursesOpen: ledger.open.map((course) => course.route),
      hint: `courses run in order; re-enter the open one and drive it to exit: rhx education.pursuit.course init --course ${ledger.open[0]!.slug}`,
    });

  // a new course needs a plot to sit in
  if (!courseFound && ledger.plotted.length === 0)
    throw new ConstraintError('the pursuit has no plot yet', {
      course: input.course,
      hint: 'drive 1.courses.plot first, so its yield names the courses: rhx route.drive',
    });

  // a new course needs a sound plot, or a course it names may stay owed forever
  if (!courseFound && ledger.plotFaults.length > 0)
    throw new ConstraintError('the plot has faults', {
      plotFaults: ledger.plotFaults,
      hint: `repair ${pursuitRoute}/1.courses.plot.yield.md, then re-run`,
    });

  // a new course is the next one the plot names, so the pedigree cites only plotted courses
  const courseNext = ledger.owed[0] ?? null;
  if (!courseFound && input.course !== courseNext)
    throw new ConstraintError(
      courseNext
        ? `course ${input.course} is not next in the plot`
        : `the plot names no course left to pursue`,
      {
        course: input.course,
        hint: courseNext
          ? `courses run in plot order; run: rhx education.pursuit.course init --course ${courseNext}`
          : `to add ${input.course}, append it to ${pursuitRoute}/1.courses.plot.yield.md first`,
      },
    );
  const ordinal = courseFound?.ordinal ?? getOneCourseOrdinalNext({ courses });
  const route = path.join(
    pursuitRoute,
    DIR_OF_COURSES,
    asCourseRouteName({ ordinal, slug: input.course }),
  );

  // findsert the ten stones, filled with this course
  const role = getOneEducationRole({
    repoRoot: input.repoRoot,
    slug: pursuit.role,
  });
  const { created, kept } = await genRouteFromTemplates({
    templatesDir: TEMPLATES_DIR,
    routeDir: route,
    vars: {
      ...asEducationTemplateVars({
        role,
        pursuitRoute,
        bootSpecFound: existsSync(path.join(input.repoRoot, role.bootPath)),
      }),
      COURSE_SLUG: input.course,
      COURSE_ORDINAL: String(ordinal),
      COURSE_ROUTE: route,
    },
  });

  // record how the role boots each brief it holds now, so the proof sees a move at exit
  genBootClaimsBefore({ repoRoot: input.repoRoot, role, route });

  // push: the bind moves from the pursuit to the course
  await setRouteBindSwap({ route, repoRoot: input.repoRoot });

  return { route, pursuitRoute, ordinal, created, kept };
};
