import { promises as fs } from 'fs';
import path from 'path';

import { asPrivilegeGrantedLines } from './asPrivilegeGrantedLines';
import { asPrivilegeRefusalLines } from './asPrivilegeRefusalLines';
import { getDecisionIsCallerHuman } from './getDecisionIsCallerHuman';

/**
 * .what = mints the route-mutate privilege flag, for a HUMAN caller only
 * .why = the flag lifts every protected write on the route at once, so a grant any caller may mint
 *        is a bound any caller may raise.
 *
 * 🔴 .the ACTOR arrives through `context`, as it does for every other human-only lever here.
 *    `setStoneAsApproved`, `setStoneAsOverruled`, and `setStoneAsForced` each take
 *    `context: { isTTY }`, so a test drives both verdicts. an operation that read
 *    `process.stdin.isTTY` off the process instead could be exercised from one direction only — a
 *    spawned pipe, which is refused by construction — leaving the positive wire
 *    (`isTTY === true ⇒ the flag is written`) proven nowhere
 *    (`rule.require.contract-snapshot-exhaustiveness`).
 *
 * 🔴 .the i/o split is the caller's, deliberately.
 *    a refusal is a constraint the caller must fix, so its lines go to stderr with exit 2; a grant
 *    is a success, so its lines go to stdout and exit 0 (`rule.forbid.stdout-on-exit-errors`,
 *    `rule.require.exit-code-semantics`). this returns `granted` so the boundary that owns the
 *    exit code owns the stream too, rather than sink that pair one level down where the code that
 *    justifies it is out of view.
 *
 * .note = the write is an idempotent upsert — `mkdir --recursive`, then a `writeFile` that
 *         truncates the flag to empty. a re-run converges to the same state, so no caller needs a
 *         guard around it (`rule.require.idempotent-operations`).
 */
export const setRoutePrivilegeAsGranted = async (
  input: {
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
  granted: boolean;
  emit: { lines: string[] };
}> => {
  // the gate: the flag this writes lifts EVERY protected write on the route at once — a `budget:`
  // edit in a `.guard`, an appended `rounds: 0` line in the append-only meter. so a grant any
  // caller may mint is a bound any caller may raise.
  const { isHuman } = getDecisionIsCallerHuman({ isTTY: context.isTTY });
  if (!isHuman)
    return {
      granted: false,
      emit: { lines: asPrivilegeRefusalLines({ route: input.route }) },
    };

  const privilegeFlagPath = path.join(
    input.route,
    '.route',
    '.privilege.mutate.flag',
  );

  await fs.mkdir(path.dirname(privilegeFlagPath), { recursive: true });
  await fs.writeFile(privilegeFlagPath, '');

  return {
    granted: true,
    emit: { lines: asPrivilegeGrantedLines({ route: input.route }) },
  };
};
