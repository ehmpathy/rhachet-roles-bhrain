import { asRouteFulcrumCommandRows } from './asRouteFulcrumCommandRows';
import { asRouteFulcrumDisputeLines } from './asRouteFulcrumDisputeLines';
import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';

/**
 * .what = the refusal tree a dispute gate throws: headline, the open disputes, a closer, commands
 * .why = the approval, gated-passage, and gateless-last-stone refusals share one shape, so a change
 *        to the tree lands once and every surface agrees
 */
export const asRouteFulcrumDisputeRefusalLines = (input: {
  headline: string;
  state: RouteFulcrumDisputeState;
  closer: string;
  commands: string[];
}): string[] => [
  `🗿 ${input.headline}`,
  ...asRouteFulcrumDisputeLines({ state: input.state }).map(
    (line) => `   ${line}`,
  ),
  `   └─ ${input.closer}`,
  ...asRouteFulcrumCommandRows({ commands: input.commands }).map(
    (row) => `      ${row}`,
  ),
];
