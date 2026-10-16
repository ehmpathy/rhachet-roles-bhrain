import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';
import { isErrorOfWriteRefusal } from '@src/domain.operations/review/warmer/isErrorOfWriteRefusal';

import { asReviewWarmerOutputPath } from './asReviewWarmerOutputPath';
import type { WarmerPokeRow } from './WarmerPokeRow';

/**
 * .what = the file a warmer's rows land in, BESIDE the review output they protect
 * .why = `0.wish` bar 9 obliges the spend to be readable where a reader already
 *        looks — the run dir under `.log/bhrain/review/`, so `review._.cost` can
 *        reach it without a second discovery rule.
 *
 *        ⇒ it does NOT displace the VOICE log under `.agent/.cache/`. the two
 *        answer different questions: this one is keyed by RUN ALONE and answers
 *        *"what did this round cost"*; that one is keyed by REVIEWER first and
 *        answers *"is a warmer alive for this lane, and what has it done"*. a
 *        warmer writes both, and each path holds a run segment — a JOIN that
 *        parts one warmer's block from the next inside a lane's dir.
 */
export const NAME_OF_WARMER_ROWS = 'warmer.pokes.jsonl';

/**
 * .what = appends one row to BOTH of a warmer's sinks, and echoes it
 * .why = the two sinks answer different questions and neither substitutes for
 *        the other — the run-dir rows are what `review._.cost` reads (bar 9), the
 *        voice log is what a driver `cat`s mid-flight (bar 9b, bar 17).
 *
 *        the echo serves the foreground case, where a driver runs the loop by hand
 *        rather than detached.
 */
export const setOneWarmerPokeRow = (input: {
  cwd: string;
  reviewer: string;
  logDir: string;
  row: WarmerPokeRow;
}): void => {
  const line = `${JSON.stringify(input.row)}\n`;

  // the LEDGER sink, FIRST because the order carries weight — this is the file
  // `review._.cost` reads (bar 9), so it is what makes a spend governable. the
  // sink below is a convenience (bar 9b); writing the money question first means
  // a failure of the second cannot cost the first, which licenses the isolation
  // below.
  //
  // APPEND, for a sharper reason than order alone: a `writeFileSync` here leaves
  // the ledger with only the LAST poke, so `getOneWarmerSpend` sums one row and
  // renders it as the TOTAL — well-formed, measured, and understated by k−1
  // pokes. the swap goes 14 of 126 red across the warmer suite; two name it
  // outright — `[case8]`'s "the LEDGER is whole" and `[case7]`'s "the run-dir
  // sink accumulated both too".
  //
  // synchronous, per row — never buffered to exit. bar 9b promises a driver can
  // `cat` this mid-flight, and a batch leaves it empty for the 2h45m an `on`
  // plan runs. `[case10]` reads the ledger inside the clock's `sleep`, so it is
  // the sole test that goes red on a flush-at-exit recast.
  const pathBesideRun = path.join(input.logDir, NAME_OF_WARMER_ROWS);

  // the VOICE sink, keyed by reviewer and then by the RUN this warmer serves —
  // the warmer's own chronology, which bar 9b promises a driver can `cat`
  // mid-flight. the run slug comes off the log dir this warmer was spawned for,
  // so one file holds one warmer's whole life and the glob sorts by the clock
  const pathOfVoice = asReviewWarmerOutputPath({
    cwd: input.cwd,
    reviewer: input.reviewer,
    run: path.basename(input.logDir),
  });

  // a LEDGER refusal is the inverse of the voice case below, and so is its answer.
  // the voice sink is a convenience, so the warmer survives it; the ledger is what
  // makes a spend governable, so a warmer that cannot write it must STOP — each
  // further poke would bill money `review._.cost` can never see (bar 9).
  //
  //    ⇒ halt loud, never survive quiet. the row goes to the voice log first, with
  //    a retire row that names the cause, so the spend already made stays on a
  //    record a driver can `cat`. then the throw ends the plan: no poke follows a
  //    row the ledger refused. clamped by `[case9]`
  try {
    fs.mkdirSync(path.dirname(pathBesideRun), { recursive: true });
    fs.appendFileSync(pathBesideRun, line);
  } catch (error) {
    // the allowlist is the same one the voice sink uses; a code-less logic defect
    // RETHROWS as itself (rule.forbid.failhide)
    if (!isErrorOfWriteRefusal({ error })) throw error;
    const why = `the ledger refused a write — ${asErrorHeadline({ error })}; no further spend could be recorded, so the warmer stops`;
    const rowOfRetire: WarmerPokeRow = {
      at: input.row.at,
      reviewer: input.reviewer,
      attempt: input.row.attempt,
      act: 'retire',
      why,
      measured: null,
    };
    try {
      fs.mkdirSync(path.dirname(pathOfVoice), { recursive: true });
      fs.appendFileSync(pathOfVoice, `${line}${JSON.stringify(rowOfRetire)}\n`);
    } catch (errorOfVoice) {
      // both sinks refused; the throw below still carries the row in its metadata
      if (!isErrorOfWriteRefusal({ error: errorOfVoice })) throw errorOfVoice;
    }
    // the repo's malfunction class: the system must fix it, so it exits as a malfunction
    throw new UnexpectedCodePathError(
      `warmer cost record write refused at ${pathBesideRun}`,
      {
        reviewer: input.reviewer,
        row: input.row,
        refusal: asErrorMessage({ error }),
      },
    );
  }
  try {
    fs.mkdirSync(path.dirname(pathOfVoice), { recursive: true });
    // APPEND is the mechanism that keeps an earlier warmer's record — never the
    // filename, under this key or the `attempt` key it replaced. clamped by
    // `[case7]`, which goes red on a `writeFileSync` here
    fs.appendFileSync(pathOfVoice, line);
  } catch (error) {
    // a failure HERE must not kill the warmer. the ledger above already holds
    // this row, so the money question is fully answered — yet an unguarded throw
    // propagates out of the loop, past `reviewWarmer`'s catch-less `try/finally`,
    // into an entry that has no `.catch()`, and kills a process spawned
    // `stdio: 'ignore'`.
    //
    //    ⇒ so the cost of a write to a CONVENIENCE file is every poke the budget
    //    still owed. the lane then meets the next round cold and pays ~45× on it
    //    (`BOUND_OF_WARMER`) — the exact harm this warmer exists to prevent,
    //    traded away for a file no operation reads.
    //
    // the allowlist NAMES the refusals a write can meet (isErrorOfWriteRefusal):
    // each is survivable here, because sink one already succeeded. every other
    // throw — a code-less logic defect, or an errno no write should raise —
    // RETHROWS (rule.forbid.failhide — a real malfunction must still fail loud).
    if (!isErrorOfWriteRefusal({ error })) throw error;
    // detached, this notice reaches a closed fd and is lost. that is a real
    // residual and not a silent one: the durable marker belongs in the sink a
    // reader consumes, which needs an `act` the grader does not yet hold.
    // ⇒ `.dream/v2026_09_25.fix.a-warmer-sink-failure-renders-a-floor-as-exact.md`
    console.error(
      `💥 MalfunctionError: warmer could not write ${pathOfVoice} — ${asErrorHeadline({ error })}`,
    );
  }

  console.log(JSON.stringify(input.row));
};
