import { isNodeEvalMode } from './isNodeEvalMode';

/**
 * .what = the caller args from argv — offset for node -e eval mode, `--` stripped
 * .why = one canonical source of the argv slice every cli parser needs, so the eval-mode
 *        offset never drifts between skills (the DRY twin the review flagged: learn.ts had
 *        added a divergent copy). the posix `--` end-of-options marker is a no-op
 *        separator, filtered here so downstream parsers never see it
 */
export const getInvocationArgs = (argv: string[]): string[] => {
  const skipCount = isNodeEvalMode(argv) ? 1 : 2;
  return argv.slice(skipCount).filter((arg) => arg !== '--');
};
