import * as path from 'path';

import { asReviewLogsDir } from './asReviewLogsDir';

/**
 * .what = the log dir of one review run, by its name under the tree's review log root
 * .why = binds the run-dir join in one home, so a call site composes rather than
 *        re-types `path.join` around `asReviewLogsDir` — the layer between the log
 *        root (`asReviewLogsDir`) and the files inside a run (`asRunArtifactPath`)
 */
export const asReviewRunDir = (input: { cwd: string; name: string }): string =>
  path.join(asReviewLogsDir({ cwd: input.cwd }), input.name);
