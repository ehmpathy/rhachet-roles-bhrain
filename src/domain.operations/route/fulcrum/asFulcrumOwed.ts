/**
 * .what = the confidence at and above which a misread dispute owes a reflection, not a human
 * .why = `define.invariant.review.peer.dispute.sure-misread-owes-a-reflection` — one constant,
 *        so a move of the line is one edit
 */
export const FULCRUM_REFLECT_CONFIDENCE_FLOOR = 0.9;

/**
 * .what = derives who settles a dispute from its ground and its confidence
 * .why = a sure misread is a defect in the rubric, owed upstream as a reflection; every other
 *        dispute — an unsure one, or a dirty one (the reviewer is right, the fix costs too much) —
 *        is a call the human owns (F4, ruled)
 */
export const asFulcrumOwed = (input: {
  ground: 'wrong' | 'dirty';
  confidence: number;
}): 'human' | 'reflect' =>
  input.ground === 'wrong' &&
  input.confidence >= FULCRUM_REFLECT_CONFIDENCE_FLOOR
    ? 'reflect'
    : 'human';
