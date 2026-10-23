import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the error for a skill subprocess that exited 127 — a skill that never launched —
 *         or null for any other exit
 * .why  = a skill that never ran prints naught, so a harness that returns `code: 127` as a
 *         result lets every content assertion beneath it fail on an empty string. the loudest
 *         of those reads as a behavior defect in the skill, when the cause is the host or the
 *         fixture (an absent binary, a broken selflink, a saturated host that cannot spawn).
 *         a launch failure is a malfunction of the harness, never a result (rule.require.failloud)
 */
export const asSkillLaunchFailureOrNull = (input: {
  code: number;
  stderr: string;
}): MalfunctionError<{ hint: string }> | null => {
  // any exit but 127 is a skill result
  if (input.code !== 127) return null;

  // name the launch and carry stderr, which holds the shell's own cause
  return new MalfunctionError(
    `skill subprocess never launched (exit 127): ${input.stderr.trim() || '(no stderr)'}`,
    {
      hint: 'check the blackbox selflink, the PATH of the fixture, and host process limits',
    },
  );
};
