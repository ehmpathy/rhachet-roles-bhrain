/**
 * .what = the label a judge halt prints above a remedy only a human may run
 * .why = the `approved?` judge holds on absent human approval, and `setStoneAsApproved` refuses a
 *        caller with no TTY, so that remedy is a human's alone. the label names that owner.
 *
 * 🔴 it is NOT the urgent halt's label. an urgent top-up is the driver's own lever — the budget
 *    command checks no actor — so `asJudgeUrgentHaltLines` reads `REMEDY_LABEL_BUDGET_GRANT`.
 *    a judge names the owner the mechanism enforces, never one by analogy
 *    (`define.invariant.review.peer.judge.urgent-guides-the-budget-grant`).
 */
export const JUDGE_HALT_ASK_HUMAN_LABEL = 'please ask your human to';
