/**
 * .what = the file name a proposed rule is written under, with the `rule.` prefix held
 * .why = the step-1 prompt asks the brain for `rule.$directive.$topic.md` names, but the
 *        schema accepts any string, so a brain that drops the prefix would write a file the
 *        repo's own rule grammar (`rules101.structure`) does not accept. the prefix is held
 *        at the write, so the convention holds without a hard refusal of the whole step
 *
 * .note = a name that already carries the prefix passes through untouched, so the
 *         transform is idempotent
 */
export const asReflectRuleFileName = (input: { name: string }): string =>
  input.name.startsWith('rule.') ? input.name : `rule.${input.name}`;
