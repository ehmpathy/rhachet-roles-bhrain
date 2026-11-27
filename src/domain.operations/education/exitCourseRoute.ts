import { ConstraintError } from 'helpful-errors';
import { today } from 'iso-time';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { genFile } from '@src/domain.operations/learn/genFile';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setPassageReport } from '@src/domain.operations/route/passage/setPassageReport';

import { asCourseRouteParts } from './asCourseRouteParts';
import { asExitYieldMarkdown } from './asExitYieldMarkdown';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import { getOneCourseExitReadiness } from './getOneCourseExitReadiness';
import { getOneCourseProof } from './getOneCourseProof';
import { getOneEducationRole } from './getOneEducationRole';
import { STONE_OF_EXIT } from './STONE_OF_EXIT';
import { setRouteBindSwap } from './setRouteBindSwap';

/**
 * .what = the hint for an exit off a branch that stands on no course
 * .why = the next move differs by what the branch stands on: a pursuit enters its next course,
 *        any other route is not education's to end, and no bind means none was entered
 */
const asExitOffCourseHint = (input: { boundRoute: string | null }): string => {
  if (!input.boundRoute)
    return 'enter one from a pursuit: rhx education.pursuit.course init --course <slug>';
  if (asPursuitRouteParts({ route: input.boundRoute }))
    return 'the branch already stands on the pursuit; enter the next plotted course: rhx education.pursuit.course init --course <slug>, or drive on: rhx route.drive';
  return 'the branch stands on a route that is no course; drive it as usual: rhx route.drive, or bind a pursuit to enter a course from';
};

/**
 * .what = return from a course to its pursuit: record the exit, pass `6.exit`, swap the bind back
 * .why = the pop half of the stack, and the only way a course ends; the `6.exit` passage it
 *        appends is what the `exited` judge reads, so a hand pass of that stone is refused
 * .note = idempotent: a re-run after the swap finds the branch on the pursuit and refuses,
 *         with naught changed. a swap that faults restores the course bind, so a re-run
 *         re-appends `6.exit passed`; readers take the latest passage per stone, so the
 *         second record converges to the same state
 */
export const exitCourseRoute = async (input: {
  repoRoot: string;
}): Promise<{
  route: string;
  pursuitRoute: string;
  ordinal: number;
  slug: string;
}> => {
  // the branch must stand on a course
  const bound = await getRouteBindByBranch({ branch: null });
  const course = bound ? asCourseRouteParts({ route: bound.route }) : null;
  if (!bound || !course)
    throw new ConstraintError('exit runs only within a course', {
      bound: bound?.route ?? null,
      hint: asExitOffCourseHint({ boundRoute: bound?.route ?? null }),
    });

  // every stone before the exit must have passed
  const readiness = await getOneCourseExitReadiness({ route: bound.route });
  if (!readiness.ready)
    throw new ConstraintError(
      'a course exits only once its stones have passed',
      {
        stonesUnpassed: readiness.stonesUnpassed,
        hint: 'drive each through its guard, then exit again: rhx route.drive',
      },
    );

  // the yields must read as the pedigree reads them, while the course is still bound to fix them
  const pursuitParts = asPursuitRouteParts({ route: course.pursuit })!;
  getOneCourseProof({
    course: {
      route: bound.route,
      ordinal: course.ordinal,
      slug: course.slug,
      exited: false,
    },
    pursuitRoute: course.pursuit,
    repoRoot: input.repoRoot,
    role: getOneEducationRole({
      repoRoot: input.repoRoot,
      slug: pursuitParts.role,
    }),
  });

  // record the exit, then pass the exit stone
  await genFile({
    at: path.join(bound.route, `${STONE_OF_EXIT}.yield.md`),
    content: asExitYieldMarkdown({
      ordinal: course.ordinal,
      slug: course.slug,
      exitedOn: today(),
      pursuitRoute: course.pursuit,
    }),
    idem: 'findsert',
  });
  await setPassageReport({
    route: bound.route,
    report: new PassageReport({
      stone: STONE_OF_EXIT,
      status: 'passed',
      reason: 'education.pursuit.course exit',
    }),
  });

  // pop: the bind moves from the course back to its pursuit
  await setRouteBindSwap({ route: course.pursuit, repoRoot: input.repoRoot });

  return {
    route: bound.route,
    pursuitRoute: course.pursuit,
    ordinal: course.ordinal,
    slug: course.slug,
  };
};
