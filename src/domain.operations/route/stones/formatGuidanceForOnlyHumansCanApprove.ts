/**
 * .what = formats guidance text for bot when only humans can approve
 * .why = extracts decode-friction from orchestrator into named transformer
 */
export const formatGuidanceForOnlyHumansCanApprove = (): string => {
  return [
    'as a driver, you should:',
    '   ├─ `--as passed` to signal work complete, proceed',
    '   ├─ `--as arrived` to signal work complete, request review',
    '   └─ `--as blocked` to escalate if stuck',
    '',
    'the human will run `--as approved` when ready.',
  ].join('\n');
};
