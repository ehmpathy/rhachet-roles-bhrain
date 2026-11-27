import type { CourseRoute } from './getAllCourseRoutes';

/**
 * .what = every course that has not yet exited, in ordinal order
 * .why = a new course waits on every open one, and a pursuit graduates only with none open
 */
export const getAllCoursesOpen = (input: {
  courses: CourseRoute[];
}): CourseRoute[] => input.courses.filter((course) => !course.exited);
