/**
 * .what = formats guidance text for bot when stone is already approved
 * .why = extracts decode-friction from orchestrator into named transformer
 */
export const formatGuidanceForAlreadyApproved = (input: {
  stone: string;
}): string => {
  return [
    'to continue, run:',
    `   └─ rhx route.stone.set --stone ${input.stone} --as passed`,
  ].join('\n');
};
