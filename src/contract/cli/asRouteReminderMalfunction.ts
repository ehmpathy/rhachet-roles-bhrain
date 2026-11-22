/**
 * .what = the frame a route.reminder malfunction renders as: its headline, a fix leaf, then each
 *         stack frame as a leaf beneath a `stack` label
 * .why = a fault outside the caller-constraint class is the system's to fix. a human reads it behind
 *        a `💥 MalfunctionError:` header that names who acts, with the stack kept for the defect
 *        report, never a raw stack as the whole output (rule.require.qualified-error-headers,
 *        rule.require.errors-name-the-fix)
 */
export const asRouteReminderMalfunction = (input: {
  error: Error;
}): { headline: string; lines: string[] } => {
  const fix =
    'fix: a defect in route.reminder, not a flag to change; report it with its stack';
  const frames = asStackFrames({ stack: input.error.stack ?? '' });
  if (!frames.length)
    return { headline: input.error.message, lines: [`   └─ ${fix}`] };
  return {
    headline: input.error.message,
    lines: [
      `   ├─ ${fix}`,
      '   └─ stack',
      ...frames.map(
        (frame, index) =>
          `      ${index === frames.length - 1 ? '└─' : '├─'} ${frame}`,
      ),
    ],
  };
};

/**
 * .what = the `at …` frames of a stack, trimmed
 * .why = the stack's first line repeats the message the headline already holds
 */
const asStackFrames = (input: { stack: string }): string[] =>
  input.stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '));
