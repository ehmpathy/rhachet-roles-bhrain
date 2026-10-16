/**
 * .what = the exit code a `route.stone.set` result owes the shell — 0 or 2
 * .why = exit 2 is the CONSTRAINT code: "the act did not happen; you must fix a cause first"
 *        (rule.require.exit-code-semantics). it is owed only where the act was refused — a
 *        guard that blocked a passage, an approval or overrule or force that was not granted, a
 *        feedback absorption whose `.taken` is absent.
 *
 * 🔴 a recorded STANCE is a success, whichever stance it is. `--as conceded` and
 *    `--as disputed` both write their row and print the next act; neither is a refusal. a
 *    concede keeps the hold on the STONE, but the hold is reported where it is enforced — the
 *    entrance gate and the guard refuse the next `--as arrived` with exit 2 — never by this
 *    command, whose own act succeeded. an exit 2 here cut a driver's `&&` chain of
 *    dispositions after the first one, and made rhachet print `blocked by constraints` over a
 *    write that had landed (2026-10-06, dogfood).
 */
export const asRouteStoneSetExitCode = (input: {
  result: {
    passed?: boolean;
    challenged?: boolean;
    approved?: boolean;
    overruled?: boolean;
    forced?: boolean;
    absorbed?: boolean;
    /** a stance result — accepted so the whole step result fits, and never read as a refusal */
    disputed?: boolean;
    conceded?: boolean;
  };
}): 0 | 2 => {
  // the act was refused — the driver must act before it can happen
  const isRefused =
    input.result.passed === false ||
    input.result.challenged === true ||
    input.result.approved === false ||
    input.result.overruled === false ||
    input.result.forced === false ||
    input.result.absorbed === false;
  return isRefused ? 2 : 0;
};
