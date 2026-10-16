import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the clauses that say WHY a warmer cost is a floor — one per cause present
 * .why = a floor has two causes, and they ask a reader for opposite acts. a faulted
 *        poke may have billed unmeasured — a fact about the past. a log with no
 *        terminator means the warmer is still AWAKE or was STOPPED — usually the
 *        former, since a round lands well inside a warmer's plan, so a live process
 *        may still be at spend. the run breadth named both; the tree breadth once
 *        said "faulted or truncated" for either, which sent a reader to hunt a
 *        corrupt ledger while a warmer kept poke after poke. one builder, read by
 *        both breadths, so the two cannot tell two stories of one log
 *        (rule.forbid.duplicate-format-tree-operations,
 *        rule.require.single-source-of-truth-for-render).
 *
 * .note = no pronoun agrees with a count here; each clause routes its count
 *         through `asCountedNoun`, the one home of that decision
 */
export const asWarmerFloorClauses = (input: {
  faults: number;
  unterminated: number;
}): string[] =>
  [
    input.faults === 0
      ? null
      : `${asCountedNoun({ count: input.faults, one: 'poke', many: 'pokes' })} faulted, each of which may have charged unmeasured`,
    input.unterminated === 0
      ? null
      : `NO terminator on ${asCountedNoun({ count: input.unterminated, one: 'warmer log', many: 'warmer logs' })} — still AWAKE or was STOPPED, so the plan is unspent`,
  ].filter((clause): clause is string => clause !== null);
