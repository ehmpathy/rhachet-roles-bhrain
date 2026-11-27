import type { CourseRoute } from './getAllCourseRoutes';

/**
 * .what = the ordinal a new course takes: one past the highest held, or 1 when none
 * .why = a course dir name carries its place in the order (`course=$k.$slug`)
 */
export const getOneCourseOrdinalNext = (input: {
  courses: CourseRoute[];
}): number => Math.max(0, ...input.courses.map((course) => course.ordinal)) + 1;
