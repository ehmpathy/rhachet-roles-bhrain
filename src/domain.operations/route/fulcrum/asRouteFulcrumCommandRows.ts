import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

/**
 * .what = renders the ask commands as `├─` / `└─` rows, with no indent
 * .why = the refusal, the gateless refusal, the drive halt, and the judge each close on the same
 *        command list; each caller prefixes its own indent
 */
export const asRouteFulcrumCommandRows = (input: {
  commands: string[];
}): string[] =>
  input.commands.map(
    (command, index) =>
      `${asTreeBranchMarkers({ isLast: index === input.commands.length - 1 }).elbow} ${command}`,
  );
