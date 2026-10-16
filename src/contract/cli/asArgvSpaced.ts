/**
 * .what = rewrites each `--flag=value` token into the space form `--flag value`
 * .why = a human types both shapes. without this, `--of=tree` was refused as an
 *        unknown flag named `of=tree` — a refusal that blamed the flag for its
 *        form and never named the form the command does read
 *
 * .note = shared by `review`, `review._.cost`, and `review.by`, so all three
 *         commands read one form the same way (rule.prefer.most-common-denominator)
 */
export const asArgvSpaced = (input: { args: string[] }): string[] =>
  input.args.flatMap((arg) =>
    arg.startsWith('--') && arg.includes('=')
      ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)]
      : [arg],
  );
