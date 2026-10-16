import { UnexpectedCodePathError } from 'helpful-errors';

import type { WarmerPokeRow } from './WarmerPokeRow';

/**
 * .what = whether a row is the LAST one a healthy warmer writes
 * .why = a warmer's ledger is append-only and its process is detached, so the
 *        only way to tell a plan that FINISHED from a plan that was STOPPED is
 *        whether a terminator sits at the tail (`setReviewWarmerPokes`: "a record
 *        with no terminator cannot be told from a record that STOPPED").
 *
 * .note = the truncated tail is reached by the ONE command this product
 *        documents. `emitReviewWarmerSpawn` prints `stop: kill <pid>`, node's
 *        default SIGTERM handler terminates without a JS unwind, so no `retire` row
 *        is written — and a SIGTERM that lands mid-poke kills a request the
 *        provider may still have billed, with no row at all. so a killed warmer's
 *        `cost` is a FLOOR for the same reason a faulted one's is, and it carries
 *        `faults: 0`. without this read the render states it as a total (`0.wish`
 *        bar 4, rule.forbid.failhide).
 *
 * .note = the `never` gate is deliberate and matches `asSpendGrade`'s. a fifth
 *         act cannot be added without a decision HERE, because the typecheck
 *         refuses until one is made (rule.prefer.prevent-over-correct).
 *
 * .note = `fault` is NOT terminal. a warmer survives a fault and keeps its
 *         schedule, so a fault mid-plan is followed by more rows and then a
 *         `retire`. a fault at the TAIL therefore means exactly what an absent
 *         terminator means — the plan did not finish.
 */
export const isWarmerRowTerminal = (row: WarmerPokeRow): boolean => {
  // read the act once: the gate below narrows the act itself, since a union row
  // narrows to `never` in the default branch and a never row has no act to name
  const act = row.act;
  switch (act) {
    case 'retire':
      return true;
    case 'poke':
    case 'defer':
    case 'fault':
      return false;
    default: {
      const unhandled: never = act;
      throw new UnexpectedCodePathError(
        'a warmer act does not say whether it ends a plan, so a stopped warmer cannot be told from a spent one',
        { act: unhandled },
      );
    }
  }
};
