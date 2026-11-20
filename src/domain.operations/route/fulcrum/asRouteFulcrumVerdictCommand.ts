import type { RouteFulcrumDisputeEntry } from './asRouteFulcrumDisputeState';

/**
 * .what = the rule command for one entry, the verdict a marked placeholder
 * .why = one render for the ask branch and the reflected leaf; the `<…>` marks the one word the
 *        human picks, so a paste cannot run a bare pipe
 */
export const asRouteFulcrumVerdictCommand = (input: {
  entry: RouteFulcrumDisputeEntry;
}): string =>
  `rhx route.fulcrum.rule --case ${input.entry.frontmatter.case} --as <upheld|conceded>`;
