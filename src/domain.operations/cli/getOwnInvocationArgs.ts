import { getInvocationArgs } from './getInvocationArgs';

/**
 * .what = the flags the rhachet harness always injects to identify the invocation
 * .why = `rhx <skill>` prepends --skill/--role/--repo (each with a value) to the argv it hands
 *        the wrapper; they name WHICH skill ran, never part of the skill's own surface
 */
const RHACHET_INJECTED_FLAGS = ['--skill', '--role', '--repo'];

/**
 * .what = the caller's own args — the invocation args minus the rhachet-injected flags
 * .why = leaves only a skill's own surface for strict validation, so a genuine typo is still
 *        caught while the harness flags pass through. handles the space form (`--skill x`) and
 *        the combined form (`--skill=x`)
 */
export const getOwnInvocationArgs = (argv: string[]): string[] => {
  const args = getInvocationArgs(argv);

  // mark each injected flag token, plus the value token after a space-form one
  const dropped = args.flatMap((arg, index) => {
    const flag = arg.split('=')[0]!;
    if (!RHACHET_INJECTED_FLAGS.includes(flag)) return [];
    return arg.includes('=') ? [index] : [index, index + 1];
  });
  return args.filter((_, index) => !dropped.includes(index));
};
