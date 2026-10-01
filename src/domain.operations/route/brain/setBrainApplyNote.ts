import * as fs from 'fs';

import { asBrainApplyLogFaultCode } from './asBrainApplyLogFaultCode';
import { genBrainApplyLog } from './genBrainApplyLog';
import { isBrainApplyLogAbsence } from './isBrainApplyLogAbsence';

/**
 * .what = appends one diagnostic line to the brain-apply log, and never throws
 * .why = the one-shot write every handler-side caller shares, so the write guard and the close
 *        policy live in one place rather than diverge per caller
 *
 * .note = returns `{ noted, fault }`: `fault: null` with `noted: false` is a benign absence;
 *         `fault: 'ENOSPC'` is a foreign fault carried out as a value
 * .note = it CARRIES a foreign fault rather than throw, because no caller can route a throw:
 *         | caller | why a throw cannot route |
 *         |---|---|
 *         | `dispatchBrainSwitch` | inside `child.on('error')` — an uncaught exception |
 *         | `getCloneAddress` | inside a handler — a throw skips `settle(...)`, the await hangs |
 *         | `genBrainDispatchClaim` | it would fail a claim that succeeded |
 *         its peers `genBrainApplyLog` and `delBrainApplyLogHandoff` do throw: each has a
 *         synchronous caller that reaches a rendered halt
 * .note = it always closes: callers run once per onStop tick while a stone is parked, so an
 *         unclosed fd leaks one per tick. `[case3]` in the integration test pins no leak over
 *         50 ticks; `[case2]` pins the absence degradation
 * .note = it writes through the engine-owned log, never `process.stderr` (`F15`)
 */
export const setBrainApplyNote = (input: {
  repoRoot: string;
  text: string;
}): { noted: boolean; fault: string | null } => {
  // the open throws a foreign fault, and this operation may not — carry it out as a value
  let log: { fd: number; path: string } | null = null;
  try {
    log = genBrainApplyLog({ repoRoot: input.repoRoot });
  } catch (error) {
    return { noted: false, fault: asBrainApplyLogFaultCode(error) };
  }
  if (!log) return { noted: false, fault: null };

  let fault: string | null = null;
  try {
    fs.writeSync(log.fd, `${input.text}\n`);
  } catch (error) {
    // allowlisted: the absence class drops, a foreign fault is carried
    fault = isBrainApplyLogAbsence(error)
      ? null
      : asBrainApplyLogFaultCode(error);
  } finally {
    try {
      fs.closeSync(log.fd);
    } catch (error) {
      // an fd that refuses to close is already unusable; a foreign close fault still leaves as a trace
      if (!isBrainApplyLogAbsence(error))
        fault = fault ?? asBrainApplyLogFaultCode(error);
    }
  }
  return { noted: fault === null, fault };
};
