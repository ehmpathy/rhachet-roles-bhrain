/**
 * .what = decides if the caller is human based on TTY status
 * .why = gates approval commands to human-only via terminal detection
 */
export const getDecisionIsCallerHuman = (input: {
  isTTY: boolean;
}): { isHuman: boolean } => {
  return { isHuman: input.isTTY };
};
