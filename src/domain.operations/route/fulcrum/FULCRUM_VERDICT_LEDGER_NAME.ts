/**
 * .what = the verdict ledger's name, inside the route's `.fulcrums/` dir
 * .why = the ledger sits beside the entries it proves, so it is tracked with them: a verdict
 *        committed on one clone stays proven on every other. a constant of its own, so a pure
 *        reader never imports it from a communicator
 */
export const FULCRUM_VERDICT_LEDGER_NAME = 'verdicts.jsonl';
