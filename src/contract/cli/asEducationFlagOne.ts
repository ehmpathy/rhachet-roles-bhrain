import { ConstraintError } from 'helpful-errors';

/**
 * .what = the one value of a single-value flag, or null when absent; refuses a repeat
 * .why = each education face reads its single-value flags the same way
 */
export const asEducationFlagOne = (input: {
  flags: Record<string, string[]>;
  flag: string;
}): string | null => {
  const values = input.flags[input.flag] ?? [];
  if (values.length > 1)
    throw new ConstraintError(`${input.flag} takes one value`, {
      hint: `pass ${input.flag} once`,
    });
  return values[0] ?? null;
};
