import { ConstraintError } from 'helpful-errors';

/**
 * .what = the refusal a `route.stone.set` act throws when its `--stone` matches no stone
 * .why = a driver who mistyped the stone must read the valid names beside the refusal, never
 *        guess them (rule.forbid.friction-hazards). every act that looks a stone up renders
 *        the one shape here, so the names and the fix read alike on each act
 *        (rule.require.single-source-of-truth-for-render)
 */
export const asStoneNotFoundError = (input: {
  act: string;
  route: string;
  pattern: string;
  stones: Array<{ name: string }>;
}) =>
  new ConstraintError(
    [
      `stone not found for --as ${input.act}: ${input.pattern}`,
      ``,
      `pass the stone name exactly as stonesAvailable spells it.`,
    ].join('\n'),
    // the bag holds only what the caller cannot already see: the act and the pattern ride
    // in the headline, so the names that would have matched are the one address left
    { stonesAvailable: input.stones.map((one) => one.name) },
  );
