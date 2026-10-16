import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';

/**
 * .what = the `route.stone.set --as absorbed --that <slug>` command, in parts
 * .why = every surface that teaches the absorb — the halt prompt, the stance ack, the
 *        refusals, the malfunction levers — must name the same flag grammar, so it is
 *        composed here, once (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = `flags` serves a surface that wraps after the head; `command` is the whole line
 */
export const asRouteStoneAbsorbCommand = (input: {
  stone: string;
  that: string;
}): { head: string; flags: string; command: string } => {
  const head = asRouteStoneSetCommandHead({ stone: input.stone });
  const flags = `--as absorbed --that ${input.that}`;
  return { head, flags, command: `${head} ${flags}` };
};
