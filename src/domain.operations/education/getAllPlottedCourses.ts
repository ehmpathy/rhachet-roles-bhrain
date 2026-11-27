import { getAllPlotRows } from './getAllPlotRows';

/**
 * .what = the course slugs a pursuit's plot names, in plot order; empty when no plot exists
 * .why = `2.courses.pursue` passes only once every plotted course has exited
 */
export const getAllPlottedCourses = (input: {
  pursuitRoute: string;
}): string[] =>
  getAllPlotRows({ pursuitRoute: input.pursuitRoute }).flatMap(
    (row) => row.course || [],
  );
