import { FLAG_OF_WARMER_REVIEWER } from './FLAG_OF_WARMER_REVIEWER';

/**
 * .what = the five flags a detached warmer child boots with, keyed by the field each
 *         one carries
 * .why = the spawn writes this argv and the child reads it back across a process
 *        boundary. the child is detached with `stdio: 'ignore'`, so a flag renamed on
 *        one side alone would make every warmer refuse in silence. one declared map,
 *        read by both directions (`asWarmerArgv`, `asWarmerArgsFromArgv`), is what keeps
 *        the two sides in step
 */
export const FLAG_OF_WARMER_ARG = {
  reviewer: FLAG_OF_WARMER_REVIEWER,
  logDir: '--log-dir',
  pokes: '--pokes',
  every: '--every',
  brain: '--brain',
} as const;
