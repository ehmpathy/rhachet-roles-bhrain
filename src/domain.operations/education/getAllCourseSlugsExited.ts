import type { CourseRoute } from './getAllCourseRoutes';

/**
 * .what = the slugs of every course that has exited, in ordinal order
 * .why = the pursue judge and the plot order each ask which courses are done
 */
export const getAllCourseSlugsExited = (input: {
  courses: CourseRoute[];
}): string[] =>
  input.courses.filter((course) => course.exited).map((course) => course.slug);
