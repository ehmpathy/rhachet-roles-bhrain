import * as path from 'path';

/**
 * .what = the review output path to display: absolute when it escapes cwd, else cwd-relative
 * .why = a cwd-relative path that escapes into a `..` crawl reads worse than the absolute form;
 *        shared by the skip + normal stdout render paths so the display rule lives in one place
 *        (rule.forbid.inline-decode-friction)
 */
export const getReviewDisplayPath = (input: {
  outputAbsolute: string;
  cwd: string;
}): string => {
  const relative = path.relative(input.cwd, input.outputAbsolute);
  return relative.startsWith('..') ? input.outputAbsolute : relative;
};
