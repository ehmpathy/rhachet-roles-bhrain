/**
 * .what = reads the adjudicated-attempt count out of a `.since` marker's content
 * .why = the regex-plus-parseInt was derived at two call sites in one operation, and a count
 *        derived twice is a count that can disagree with itself — the exact defect this round
 *        repairs one level up, where an ordinal had three derivations at three call sites
 *
 * .note = an absent or unparsable `attempts:` line reads as 0, which is the ASK's value. that
 *         is the safe default in one direction only, and it is the right one: it means "this
 *         driver has not been adjudicated", so no attempt is credited that was never spent.
 *         ⚠️ it does NOT decide the haste cue — `firstAdjudication` does, atomically. so a
 *         mangled marker costs a diagnostic, never a gate.
 */
export const asAttemptCount = (content: string): number => {
  const matched = content.match(/^attempts:\s*(\d+)/m);
  if (!matched?.[1]) return 0;
  return parseInt(matched[1], 10);
};
