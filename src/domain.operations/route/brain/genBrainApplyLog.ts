import * as fs from 'fs';
import * as path from 'path';

import { isBrainApplyLogAbsence } from './isBrainApplyLogAbsence';

/**
 * .what = finds-or-creates the append-only log the brain APPLY act writes diagnostics to, and
 *         returns an open fd for it
 * .why = `dispatchBrainSwitch` is fire-and-forget, so its failures arrive after its return and
 *        cannot ride a value; a file under the engine-owned `.log/` tree is the strongest
 *        surface reachable there (`F15`: never the raw `console.error`)
 *
 * .note = named for the APPLY act, not a step: the probe (`getCloneAddress`) and the submit
 *         (`dispatchBrainSwitch`) share one timeline, so a debugger reads both in order
 * .note = returns null on an ABSENCE (`isBrainApplyLogAbsence`: `ENOTDIR`, `ENOENT`, `EACCES`,
 *         `EPERM`, `EROFS`) — a log is a diagnostic, never the signal, so no caller may branch
 *         its outcome on it. a foreign fault (`ENOSPC`, `EMFILE`, `EIO`) is a machine fault and
 *         THROWS: `dispatchBrainSwitch`'s synchronous body routes it to a rendered halt.
 *         `[case2]` in the integration test pins the absence arm
 * .note = it opens and stops. the next step differs by caller:
 *         - a one-shot line → `setBrainApplyNote` (opens, writes, closes, never throws)
 *         - a handoff to a detached child's stdio → `dispatchBrainSwitch` releases the parent's
 *           copy via `delBrainApplyLogHandoff` on every arm, right after the spawn
 */
export const genBrainApplyLog = (input: {
  repoRoot: string;
}): { fd: number; path: string } | null => {
  const file = path.join(
    input.repoRoot,
    '.log',
    'bhrain',
    'brain',
    'apply.log',
  );
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return { fd: fs.openSync(file, 'a'), path: file };
  } catch (error) {
    // allowlist, never a bare catch — a foreign fault travels
    if (!isBrainApplyLogAbsence(error)) throw error;
    // the absence class degrades to no log
    return null;
  }
};
