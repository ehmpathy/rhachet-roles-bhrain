import { asHelpfulMessageParts } from './asHelpfulMessageParts';

/**
 * .what = renders an error's message as a `cause:` row of a refusal tree
 * .why = a HelpfulError appends its metadata to its message as multi-line json. printed
 *        raw, that block is debug noise inside a human-read frame
 *        (rule.forbid.snapshot-visual-blemishes), and at column 0 it cuts the tree in two.
 *        so the metadata block is dropped, and its `hint` — the one field a human acts on —
 *        rides as a labelled row under the rail
 *
 * .note = blank lines are dropped: inside a tree they read as the end of the block
 * .note = a cause whose tail does not parse as a metadata block keeps every line, indented
 *         under the rail, so an unknown shape is never silently lost (rule.forbid.failhide)
 */
export const asTreeCauseLines = (input: { cause: string }): string[] => {
  const { headline, hint } = asHelpfulMessageParts({ message: input.cause });
  const [head, ...rest] = headline
    .split('\n')
    .filter((line) => line.trim() !== '');
  return [
    `   ├─ cause: ${head ?? '(no message)'}`,
    ...rest.map((line) => `   │    ${line}`),
    ...(hint ? [`   │    hint: ${hint}`] : []),
  ];
};
