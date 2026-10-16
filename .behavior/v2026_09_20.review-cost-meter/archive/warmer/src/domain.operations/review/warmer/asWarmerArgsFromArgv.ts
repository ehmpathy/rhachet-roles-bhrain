import { FLAG_OF_WARMER_ARG } from './FLAG_OF_WARMER_ARG';

/**
 * .what = the set of flag names (without the `--`) a warmer child accepts
 * .why = derived from `FLAG_OF_WARMER_ARG`, never typed out, so the reader refuses
 *        exactly the flags the writer does not emit
 */
const NAMES_OF_WARMER_FLAG: ReadonlySet<string> = new Set(
  Object.values(FLAG_OF_WARMER_ARG).map((flag) => flag.slice(2)),
);

/**
 * .what = the warmer args read back out of an argv, plus every flag the writer never emits
 * .why = the read half of the warmer argv contract (`asWarmerArgv` is the write). a value
 *        absent stays `undefined` so the contract can name each absent flag; a flag outside
 *        the five is returned as `unknown`, never skipped, since it is a defect in the spawn
 *        (rule.forbid.failhide)
 */
export const asWarmerArgsFromArgv = (input: {
  argv: string[];
}): {
  unknown: string[];
  reviewer: string | undefined;
  logDir: string | undefined;
  pokes: number | undefined;
  every: number | undefined;
  brain: string | undefined;
} => {
  // .note = deliberate mutation, scoped: three receivers are born here and filled in
  //         the loop (rule.require.immutable-vars). `options` and `unknown` take one
  //         entry per flag, and neither is read until the loop ends — `unknown` is
  //         returned whole, `options` only through the values read out below. the
  //         cursor never escapes. a flag consumes the token after it, so the cursor
  //         steps by two on a match; `i++` in the body says that more plainly than a
  //         skip-count threaded through a `reduce`.
  const { argv } = input;
  const options: Record<string, string> = {};
  const unknown: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg?.startsWith('--')) continue;
    if (!NAMES_OF_WARMER_FLAG.has(arg.slice(2))) unknown.push(arg);
    const value = argv[i + 1];
    if (value && !value.startsWith('--')) {
      options[arg] = value;
      i++;
    }
  }
  const pokes = options[FLAG_OF_WARMER_ARG.pokes];
  const every = options[FLAG_OF_WARMER_ARG.every];
  return {
    unknown,
    reviewer: options[FLAG_OF_WARMER_ARG.reviewer],
    logDir: options[FLAG_OF_WARMER_ARG.logDir],
    pokes: pokes ? Number(pokes) : undefined,
    every: every ? Number(every) : undefined,
    // no default: a poke to a brain the review did not use warms another cache, so
    // it would spend and report a hit over a cold replica (rule.forbid.failhide)
    brain: options[FLAG_OF_WARMER_ARG.brain],
  };
};
