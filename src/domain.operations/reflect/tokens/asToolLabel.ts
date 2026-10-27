/**
 * .what = the inventory label of a tool result, from the tool use it answers
 * .why = `Bash` carries every skill's output; without a split by command head, review
 *        spend and test-log spend hide inside one row. so a Bash use is labeled
 *        `Bash · <skill>` for `rhx <skill>` or `rhachet run --skill <skill>`, else
 *        `Bash · <first word>`
 */
export const asToolLabel = (input: {
  name: string;
  command: string | null;
}): string => {
  if (input.name !== 'Bash' || input.command === null) return input.name;
  return `Bash · ${asCommandHead({ command: input.command })}`;
};

/**
 * .what = the head of a shell command: the skill name for an rhachet call, else the first word
 * .why = the head is what a human would cut or summarize, so it is the unit of the row
 */
const asCommandHead = (input: { command: string }): string => {
  // split into words; a skill may sit after a pipe, e.g. `printf … | rhx git.commit.set`
  const words = input.command.trim().split(/\s+/);

  // `rhx <skill>`, wherever it sits in the command
  const rhxIndex = words.findIndex((word) => word === 'rhx');
  if (rhxIndex >= 0 && words[rhxIndex + 1]) return words[rhxIndex + 1]!;

  // `rhachet run --skill <skill>`, with or without npx
  const skillIndex = words.indexOf('--skill');
  if (words.includes('rhachet') && skillIndex >= 0 && words[skillIndex + 1])
    return words[skillIndex + 1]!;

  // any other command is named by its first word
  return words[0] ?? 'bash';
};
