import { existsSync, readdirSync } from 'fs';
import * as path from 'path';

import { asCourseRouteParts } from './asCourseRouteParts';
import { DIR_OF_COURSES } from './DIR_OF_COURSES';
import { isCourseExited } from './isCourseExited';

/**
 * .what = one course route of a pursuit
 */
export interface CourseRoute {
  route: string;
  ordinal: number;
  slug: string;
  /** true once `6.exit`'s latest passage is `passed` */
  exited: boolean;
}

/**
 * .what = every course dir under a pursuit, parsed, in ordinal order; other dirs are skipped
 * .why = the course dir name carries its ordinal and slug, so the stack order of a pursuit is
 *        read from the disk, never from a list that could drift from it
 */
const getAllCourseDirsParsed = (input: {
  coursesDir: string;
}): Array<{ route: string; ordinal: number; slug: string }> =>
  readdirSync(input.coursesDir)
    .flatMap((name) => {
      const route = path.join(input.coursesDir, name);
      const parts = asCourseRouteParts({ route });
      return parts ? [{ route, ordinal: parts.ordinal, slug: parts.slug }] : [];
    })
    .sort((a, b) => a.ordinal - b.ordinal);

/**
 * .what = every course route of a pursuit, in ordinal order
 * .why = the order courses were pushed is the order they build on each other; the pedigree,
 *        the next ordinal, and the pursue judge each read it
 */
export const getAllCourseRoutes = async (input: {
  pursuitRoute: string;
}): Promise<CourseRoute[]> => {
  const coursesDir = path.join(input.pursuitRoute, DIR_OF_COURSES);
  if (!existsSync(coursesDir)) return [];
  return Promise.all(
    getAllCourseDirsParsed({ coursesDir }).map(async (course) => ({
      ...course,
      exited: await isCourseExited({ route: course.route }),
    })),
  );
};
