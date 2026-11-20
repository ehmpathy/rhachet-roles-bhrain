/**
 * .what = the verdict ledger's name, inside the route's sealed `.route/` dir
 * .why = the ledger is the proof that a human ruled, so it lives where the driver cannot write:
 *        `route.mutate.guard` seals `.route/**` against the driver's own edits, and only the
 *        human-only lever (`rhx route.fulcrum.rule`) appends to it. the route gitignore keeps it
 *        tracked, so a verdict committed on one clone stays proven on every other. a constant of
 *        its own, so a pure reader never imports it from a communicator
 */
export const FULCRUM_VERDICT_LEDGER_NAME = 'fulcrum.verdicts.jsonl';
