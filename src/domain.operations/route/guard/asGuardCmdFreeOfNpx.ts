import { ConstraintError } from 'helpful-errors';

/**
 * .what = each npx call a guard command may carry, beside the alias that replaces it
 * .why = one table names both the refused pattern and its fix, so the refusal and
 *        its hint cannot drift apart
 */
const NPX_PATTERNS: { pattern: string; alias: string }[] = [
  { pattern: 'npx rhachet', alias: '$rhachet' },
  { pattern: 'npx rhx', alias: '$rhx' },
];

/**
 * .what = casts a guard command to one that reaches rhachet by its alias, or refuses
 * .why = npx adds 500-2000ms latency and has cross-platform issues, and the
 *        guard already hands every command a `$rhx` / `$rhachet` alias
 *
 * .note = ONE rule for review and judge commands alike. two hand copies of it had
 *         already drifted — one carried the fix as a `hint`, the other folded it
 *         into the message under an `alias` key — so a refusal read differently
 *         by which half of the guard raised it
 */
export const asGuardCmdFreeOfNpx = (input: { cmd: string }): string => {
  // a command that reaches rhachet by its alias passes untouched
  const found = NPX_PATTERNS.find((entry) => input.cmd.includes(entry.pattern));
  if (!found) return input.cmd;

  // name the alias that replaces the npx call, and where it points
  throw new ConstraintError(
    `guard uses ${found.pattern} which causes latency and cross-platform issues`,
    {
      hint: `use ${found.alias} alias instead (expands to ./node_modules/.bin/${found.alias.slice(1)})`,
    },
  );
};
