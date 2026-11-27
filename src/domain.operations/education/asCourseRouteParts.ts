import * as path from 'path';

import { asPursuitRouteParts } from './asPursuitRouteParts';
import { DIR_OF_COURSES } from './DIR_OF_COURSES';

/**
 * .what = the pattern of a course route dir name: `course=$k.$slug`
 */
const PATTERN_OF_COURSE = /^course=(\d+)\.([a-z0-9-]+)$/;

/**
 * .what = parse a course route dir into its parts and its pursuit
 * .why = the pursuit is computable from the course's own path, so no stack file is owed
 * .note = null when the dir is no course route under a pursuit
 */
export const asCourseRouteParts = (input: {
  route: string;
}): { ordinal: number; slug: string; pursuit: string } | null => {
  const match = PATTERN_OF_COURSE.exec(path.basename(input.route));
  if (!match) return null;
  const parent = path.dirname(input.route);
  if (path.basename(parent) !== DIR_OF_COURSES) return null;
  const pursuit = path.dirname(parent);
  if (!asPursuitRouteParts({ route: pursuit })) return null;
  return { ordinal: Number(match[1]), slug: match[2]!, pursuit };
};
