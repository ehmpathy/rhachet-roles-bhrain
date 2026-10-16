import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';

/**
 * .what = the `route.stone.set --as conceded|disputed` command for one concern, in parts
 * .why = every surface that teaches a stance — the halt prompt, the stance ack, the refusals,
 *        the malfunction levers — must name the same flag grammar, so it is composed here,
 *        once (rule.forbid.duplicate-format-tree-operations). a change to the grammar then
 *        lands in one place, never in each renderer
 *
 * .note = each part serves a surface's layout:
 *         - `head`    = `rhx route.stone.set --stone <stone>`
 *         - `stance`  = `--as <stance> --with <slug> --about <concern>`
 *         - `tail`    = the flag the stance REQUIRES (`--severity` on a concede, `--why` on a
 *                       dispute), so a copied command is never refused at the boundary
 *         - `flags`   = `stance` + `tail`, for a surface that wraps after the head
 *         - `command` = the whole command, on one line
 */
export const asRouteStoneStanceCommand = (
  input: {
    stone: string;
    with: string;
    about: string;
  } & ({ as: 'conceded' } | { as: 'disputed'; why: string }),
): {
  head: string;
  stance: string;
  tail: string;
  flags: string;
  command: string;
} => {
  const head = asRouteStoneSetCommandHead({ stone: input.stone });
  const stance = `--as ${input.as} --with ${input.with} --about ${input.about}`;
  const tail =
    input.as === 'conceded' ? `--severity better|urgent` : `--why ${input.why}`;
  const flags = `${stance} ${tail}`;
  return { head, stance, tail, flags, command: `${head} ${flags}` };
};
