import {
  LIBRARIAN_COMMANDS,
  type LibrarianCommand,
} from './LIBRARIAN_COMMANDS';

/**
 * .what = the `--help` render of one librarian command, as treestruct lines
 * .why = help is on demand and reads from the same declaration the arg parse reads
 *        (`LIBRARIAN_COMMANDS`), so the two cannot drift (rule.require.help-on-demand)
 */
export const asLibrarianHelpLines = (input: {
  command: LibrarianCommand;
}): string[] => {
  const spec = LIBRARIAN_COMMANDS[input.command];

  // a required flag reads bare; an optional one reads in brackets
  const usage = spec.flags
    .map((flag) => {
      const shape =
        flag.kind === 'boolean'
          ? `--${flag.name}`
          : `--${flag.name} <${flag.name}>`;
      return flag.required ? shape : `[${shape}]`;
    })
    .join(' ');
  return [
    `🦉 ${input.command} — ${spec.summary}`,
    '',
    `📚 ${input.command} --help`,
    `   ├─ usage: rhx ${input.command} ${usage}`,
    '   ├─ flags',
    ...spec.flags.map(
      (flag, index) =>
        `   │  ${index === spec.flags.length - 1 ? '└─' : '├─'} --${flag.name}  ${flag.sense}`,
    ),
    '   └─ exit: 0 on success · 2 on bad input (no --glob, an unknown flag, or a glob that names no file)',
  ];
};
