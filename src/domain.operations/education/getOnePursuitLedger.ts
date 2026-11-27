import { asSlugsWithout } from './asSlugsWithout';
import { type CourseRoute, getAllCourseRoutes } from './getAllCourseRoutes';
import { getAllCourseSlugsExited } from './getAllCourseSlugsExited';
import { getAllCoursesOpen } from './getAllCoursesOpen';
import { getAllPlotFaults } from './getAllPlotFaults';
import { getAllPlotRows } from './getAllPlotRows';
import { getAllPlottedCourses } from './getAllPlottedCourses';

/**
 * .what = one pursuit's course ledger: what the plot names, what the disk holds, and what is left
 * .why = "every course done" has one definition. the pursue judge, `course init`, and
 *        `pedigree set` each read it, so no judge passes a pursuit that `set` then refuses
 *
 * .note = a stray is a course the disk holds that the plot no longer names (the plot is
 *         revisable). an open stray blocks graduation as any open course does; the driver
 *         re-enters it by its slug and drives it to exit. an exited stray stays on record
 */
export const getOnePursuitLedger = async (input: {
  pursuitRoute: string;
}): Promise<{
  /** the slugs the plot names, in plot order */
  plotted: string[];
  /** every course the disk holds, in ordinal order */
  courses: CourseRoute[];
  /** every course not yet exited, plotted or stray */
  open: CourseRoute[];
  /** plotted slugs not yet exited, in plot order; the first is next */
  owed: string[];
  /** courses the disk holds that the plot does not name */
  strays: CourseRoute[];
  /** the faults of a plot that exists; empty when it is sound or not yet written */
  plotFaults: string[];
}> => {
  const rows = getAllPlotRows({ pursuitRoute: input.pursuitRoute });
  const plotted = getAllPlottedCourses({ pursuitRoute: input.pursuitRoute });
  const courses = await getAllCourseRoutes({
    pursuitRoute: input.pursuitRoute,
  });
  return {
    plotFaults: rows.length === 0 ? [] : getAllPlotFaults({ rows }),
    plotted,
    courses,
    open: getAllCoursesOpen({ courses }),
    owed: asSlugsWithout({
      slugs: plotted,
      without: getAllCourseSlugsExited({ courses }),
    }),
    strays: courses.filter((course) => !plotted.includes(course.slug)),
  };
};
