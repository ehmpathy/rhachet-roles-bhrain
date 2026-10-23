/**
 * .what = names the first stance-only flag a caller passed, or null when none was passed
 * .why = `--with`, `--about`, `--why`, and `--severity` belong to `--as disputed | conceded`
 *        alone; on any other `--as` they would be dropped with no word. the orchestrator
 *        refuses them loud, and this names which flag to cite, so the guard reads as one
 *        named claim rather than a nested ternary (rule.forbid.inline-decode-friction)
 *
 * .note = the order is the order the refusal has always cited them in
 */
export const asStrayAbsorptionFlag = (input: {
  with?: string;
  about?: string;
  why?: string;
  severity?: string;
}): '--with' | '--about' | '--why' | '--severity' | null => {
  const flags = [
    { flag: '--with', value: input.with },
    { flag: '--about', value: input.about },
    { flag: '--why', value: input.why },
    { flag: '--severity', value: input.severity },
  ] as const;
  return flags.find((one) => one.value !== undefined)?.flag ?? null;
};
