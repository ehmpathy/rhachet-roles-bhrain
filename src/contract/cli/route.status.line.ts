import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { stepRouteStatusLineCached } from '@src/domain.operations/route/statusLine/stepRouteStatusLineCached';

/**
 * .what = cli entrypoint for the route status line, as an isolated subpath
 * .why = the harness repaints the status line up to ~3 times a second per seat. the
 *        `cli/route` barrel loads ~90 modules before it can render, which cost each repaint
 *        ~0.85s of cpu before any work began. this entry imports only node builtins and the
 *        cache ops, so a repaint whose inputs did not move costs node boot and naught else
 *        (rule.require.isolated-cli-subpath-exports)
 *
 * .note = the render, the fault guidance, and the help text are each imported lazily, only
 *         on the path that needs them — a cache miss, a fault, or `--help`
 *
 * .note = the harness runs this with cwd = project root, so the cache and the bound-route
 *         lookup both anchor at cwd (no chdir, no stdin payload needed)
 *
 * .note = fail-open by contract, but via the harness — not a swallowed error. an unbound or
 *         complete route yields an empty line; a genuine fault is logged loudly to stderr and
 *         rethrown, so the process exits non-zero and the harness renders a blank line. a
 *         multi-bind is a caller-must-fix constraint, so it exits 2
 *         (rule.require.exit-code-semantics). the legacy `cli/route` export forwards here, so
 *         both entries share this one contract
 *
 * .note = an unreadable or unwritable cache never fails the line: one stderr row names the
 *         code and the path, the line still prints, and the exit stays 0. silence there would
 *         restore the full per-repaint cost with no signal
 * .note = this entry is the one writer of stderr for the status line: the step returns each
 *         row (a degrade, a cache read fault, a cache write fault) as data
 */
export const routeStatusLine = async (): Promise<void> => {
  // --help: print usage, no render
  if (getInvocationArgs(process.argv).includes('--help')) {
    const { asStatusLineHelp } = await import(
      '@src/domain.operations/route/statusLine/asStatusLineHelp'
    );
    console.log(asStatusLineHelp());
    return;
  }

  // a cancel mid-miss must not discard a render whose cache write is moments away
  process.once('SIGTERM', onCancelLetTheCacheWriteLand);

  try {
    // compute the line (from the cache when current), then emit its rows and the line
    const result = await stepRouteStatusLineCached();
    if (result.degradeRow) console.error(result.degradeRow);
    if (result.cacheReadFault) {
      const { asStatusLineCacheReadFaultRow } = await import(
        '@src/domain.operations/route/statusLine/asStatusLineCacheReadFaultRow'
      );
      console.error(asStatusLineCacheReadFaultRow(result.cacheReadFault));
    }
    if (result.cacheWriteFault) {
      const { asStatusLineCacheWriteFaultRow } = await import(
        '@src/domain.operations/route/statusLine/asStatusLineCacheWriteFaultRow'
      );
      console.error(asStatusLineCacheWriteFaultRow(result.cacheWriteFault));
    }
    console.log(result.line);
  } catch (error) {
    // fail loud, not hidden: the shared fault frame logs, then exits 2 or rethrows
    const { emitStatusLineFault } = await import(
      '@src/contract/cli/emitStatusLineFault'
    );
    emitStatusLineFault({ error });
  } finally {
    // the repaint is done, so a programmatic caller keeps no grace handler
    process.removeListener('SIGTERM', onCancelLetTheCacheWriteLand);
  }
};

/**
 * .what = the most a cancelled repaint may run on, to let its cache write land
 */
const CANCEL_GRACE_MS = 5_000;

/**
 * .what = on a cancel, run on for at most the grace, then exit as SIGTERM would
 * .why = the harness cancels an in-flight repaint when a new update lands. a miss renders
 *        for about a second, so on a busy seat a cancel would kill each miss before its cache
 *        write, and every repaint would miss again. the grace lets the write land
 *
 * .note = bounded: the timer is unref'd, so a repaint that finishes exits at once, and one
 *         that hangs is killed at the grace (exit 143). a second SIGTERM kills at once, since
 *         the handler is registered with `once`
 */
const onCancelLetTheCacheWriteLand = (): void => {
  setTimeout(() => process.exit(143), CANCEL_GRACE_MS).unref();
};
