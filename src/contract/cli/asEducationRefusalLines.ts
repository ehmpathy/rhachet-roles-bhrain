import type { BadRequestError } from 'helpful-errors';

import { asConstraintErrorHeadline } from '@src/contract/cli/asConstraintErrorHeadline';
import { asHelpfulMessageParts } from '@src/contract/cli/asHelpfulMessageParts';

/**
 * .what = one metadata value, as a leaf's text
 */
const asLeafText = (input: { value: unknown }): string => {
  if (Array.isArray(input.value)) return input.value.join(', ');
  if (input.value === null) return '(none)';
  return String(input.value);
};

/**
 * .what = the first line of a headline; a helpful-errors message carries its metadata below
 */
const asHeadlineFirstLine = (input: { headline: string }): string =>
  input.headline.split('\n')[0] ?? '';

/**
 * .what = a metadata key as the words a reader reads: `rolesFound` → `roles found`
 * .why = a camelCase field name is the code's word, not the caller's (rule.forbid.ambiguous-labels)
 */
const asFactLabel = (input: { key: string }): string =>
  input.key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

/**
 * .what = one metadata fact as tree lines: a leaf for one value, a label over child branches
 *         for a list of two or more
 * .why = a long list on one line is unscannable; each item earns its own branch
 *        (rule.require.treestruct-output)
 */
const asFactLinesOfOne = (input: { key: string; value: unknown }): string[] => {
  const label = asFactLabel({ key: input.key });
  const items: unknown[] | null = Array.isArray(input.value)
    ? input.value
    : null;
  if (!items || items.length < 2)
    return [`   ├─ ${label} = ${asLeafText({ value: input.value })}`];
  return [
    `   ├─ ${label}`,
    ...items.map(
      (item, index) =>
        `   │  ${index === items.length - 1 ? '└─' : '├─'} ${String(item)}`,
    ),
  ];
};

/**
 * .what = each metadata fact as tree branch lines, the hint left out (it renders as the fix)
 * .why = a refusal shows the facts that caused it as leaves, so a reader sees the why before
 *        the fix (rule.require.errors-name-the-fix)
 */
const asFactLines = (input: {
  metadata: Record<string, unknown> | null;
}): string[] =>
  Object.entries(input.metadata ?? {}).flatMap(([key, value]) =>
    key === 'hint' ? [] : asFactLinesOfOne({ key, value }),
  );

/**
 * .what = an education refusal as the lines a caller reads: the qualified header, each fact, the fix
 * .why = one render for the cli and for every test that pins a refusal, so a snapshot shows the
 *        treestruct a caller sees, never the raw error message with its json metadata
 */
export const asEducationRefusalLines = (input: {
  error: BadRequestError;
}): string[] => {
  const parts = asHelpfulMessageParts({
    message: asConstraintErrorHeadline({ error: input.error }),
  });
  return [
    `✋ ConstraintError: ${asHeadlineFirstLine({ headline: parts.headline })}`,
    ...asFactLines({ metadata: parts.metadata }),
    `   └─ fix: ${parts.hint ?? 'clear the cause above, then rerun'}`,
  ];
};
