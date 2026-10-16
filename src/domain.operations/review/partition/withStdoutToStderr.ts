import { AsyncLocalStorage } from 'async_hooks';
import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the swap state: whether an owner holds it
 * .why = the swap patches two process globals, so exactly one owner may hold it
 * .note = deliberate SHARED mutable state: written only by `withStdoutToStderr`, set on claim
 *         and cleared in its `finally` — see the note at the write
 * .note = 🔴 a REENTRANCY GUARD on a process-global patch, never a lock between actors, and
 *         so not a `withSimpleMutex` call (rule.require.locks-via-with-simple-mutex):
 *         - no actor WAITS on it, skips on it, or is served by it. a second claim is a code
 *           defect — two owners would restore the patch under each other — so it throws, the
 *           way an assert does, rather than queue or refuse a legitimate peer
 *         - the check and the set are one synchronous run, no `await` between them, so the
 *           event loop cannot interleave a second claim; there is no race for a put-if-absent
 *           to close
 *         - its scope is the one process whose globals it patches, so a crash frees it with the
 *           process. no lease is owed, and a lease would harm: the patch must stay installed for
 *           the whole pour (every partition writes through it), so a lease sized below a pour's
 *           worst case would throw mid-review, and one sized above it bounds naught
 */
const SWAP: {
  held: boolean;
} = { held: false };

/**
 * .what = the async scope of the operation whose stdout is rerouted
 * .why = the reroute applies to the operation's own async tree alone. a writer outside
 *        that tree — an unrelated caller in a long-lived host — reaches stdout untouched
 */
const SCOPE = new AsyncLocalStorage<true>();

/**
 * .what = runs an operation with all it writes to stdout sent to stderr instead
 * .why = a guard tallies a lane by a regex over its STDOUT (`contract.reviewer-output`), so a
 *        split review must print exactly ONE blockers/nitpicks pair there — the merged one.
 *        each partition run prints its own pair; on stdout, the guard would read whichever
 *        pair it matched first and grade the lane on one partition. on stderr, a human still
 *        sees each partition run, and the guard sees none of them
 *
 * .note = 🔴 scoped to the operation. the patched `console.log` and `process.stdout.write`
 *         reroute only a call made inside the operation's async tree (`SCOPE`); every other
 *         call passes through to the prior writer. so a host that writes to stdout beside the
 *         pour keeps its own output, and only the partitions' tallies leave stdout
 * .note = 🔴 one owner. `stepReviewByPartitions` holds it once, around its whole prime and
 *         pour, so the concurrent partitions share one swap and none of them claims it.
 *         a second holder fails loud: two owners of the patch would restore it under each
 *         other, so a nested or concurrent claim is a defect, never a share
 * .note = the patch is restored in `finally`, so a throw cannot leave stdout patched. the
 *         merged tally is printed after the owner exits
 */
export const withStdoutToStderr = async <T>(input: {
  operation: () => Promise<T>;
}): Promise<T> => {
  // refuse a second owner; the patch is process-wide
  if (SWAP.held)
    throw new MalfunctionError(
      'withStdoutToStderr is already held; one owner holds the stdout swap at a time',
      {
        hint: 'hold it once, around the whole operation that must stay off stdout',
      },
    );

  // install the patch, which reroutes only a call made inside the scope
  // .note = deliberate mutation of SHARED process state, and the one zone that does it:
  //         `SWAP.held` is module-level, and `console.log` + `process.stdout.write` are process
  //         globals, reassigned here. the flag serializes them to one owner (a second claim
  //         throws above), and all three are restored in the same `finally` below, so no write
  //         outlives the call (rule.require.immutable-vars, scoped zone)
  SWAP.held = true;
  const logPrior = console.log;
  const writePrior = process.stdout.write;
  console.log = (...args: unknown[]) =>
    SCOPE.getStore() ? console.error(...args) : logPrior(...args);
  process.stdout.write = (...args: unknown[]): boolean =>
    SCOPE.getStore()
      ? Reflect.apply(process.stderr.write, process.stderr, args)
      : Reflect.apply(writePrior, process.stdout, args);

  try {
    return await SCOPE.run(true, input.operation);
  } finally {
    // restore, whether the operation returned or threw
    console.log = logPrior;
    process.stdout.write = writePrior;
    SWAP.held = false;
  }
};
