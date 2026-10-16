import { setOneWarmerPokeRow } from './setOneWarmerPokeRow';
import type { WarmerClock } from './WarmerClock';

/**
 * .what = records that a warmer's plan ended before its first poke
 * .why = a plan that never began has spent naught and is over, so it ends in ONE `retire`
 *        row at attempt 0 — never a `fault`. a lone `fault` reads as a ledger cut short, a
 *        warmer "still AWAKE" whose zero is only a floor (`isWarmerRowTerminal`). the rule
 *        lives here once, so the boot path and the poke loop cannot drift on it
 *
 * .note = a full instant, by design. the poke ledger sits under the git-ignored `.log/`
 *         corpus, outside the route-artifact boundary that
 *         rule.forbid.timestamps-in-route-artifacts governs; and each row's instant IS the
 *         measurement (cache reach is computed per row), which one file mtime cannot carry
 */
export const setOneWarmerRetireBeforeBegin = (
  input: {
    cwd: string;
    reviewer: string;
    logDir: string;
    /** why the plan could not begin — the row's own reason, read back by the cost meter */
    why: string;
  },
  context: { clock: WarmerClock },
): void =>
  setOneWarmerPokeRow({
    cwd: input.cwd,
    reviewer: input.reviewer,
    logDir: input.logDir,
    row: {
      at: context.clock.now().toISOString(),
      reviewer: input.reviewer,
      attempt: 0,
      act: 'retire',
      why: input.why,
      measured: null,
    },
  });
