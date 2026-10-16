import type { BadRequestError } from 'helpful-errors';

import { asConstraintErrorHeadline } from './asConstraintErrorHeadline';
import { asHelpfulMessageParts } from './asHelpfulMessageParts';

/**
 * .what = renders a caught caller-fix error under the sanctioned `✋ ConstraintError:` header
 * .why = a BadRequestError — and its `ConstraintError` subclass — is always one the caller
 *        must fix, which is what a constraint names (rule.require.qualified-error-headers).
 *        helpful-errors writes its own lead into `.message`: `BadRequestError: ` for the
 *        parent, `✋ ConstraintError: ` for the subclass. a raw render would read
 *        `✋ BadRequestError:` for one and a doubled header for the other, so the header a
 *        human reads is qualified at the one boundary where it is rendered.
 *
 * .note = the class word is written here, never swapped in — so a message that lacks a
 *         known lead still renders qualified, rather than as a bare glyph. the lead strip
 *         lives in `asConstraintErrorHeadline`, which a framed refusal reuses
 *
 * .note = the metadata bag helpful-errors appends as pretty json is KEPT, one compact
 *         `key: value` line per field, directly under the first line of the message. the bag
 *         is the address the caller needs to act — which guard is `blocked`, which absolute
 *         path a route resolved to — and a render that drops it leaves the caller with a
 *         cause and no address (rule.require.failloud). it sits above any body the message
 *         carries (an example, a list of options), so an address never floats beneath an
 *         example it has no part in. it is never the raw multi-line dump, which buries the
 *         headline (rule.forbid.snapshot-visual-blemishes). `hint` is the one field a human
 *         acts on next, so it closes the block as its own labelled line
 *
 * .note = the render is dumb on purpose: every field a throw site puts in the bag renders.
 *         so a throw site carries ADDRESSES only — never an echo of the caller's own argv,
 *         and never a value its message already states. a key allowlist here would hide
 *         that defect rather than fix it
 */
export const asConstraintErrorHeader = (input: {
  error: BadRequestError;
}): string => {
  // read the headline, with the class lead stripped
  const headline = asConstraintErrorHeadline({ error: input.error });

  // part off the metadata bag
  const parts = asHelpfulMessageParts({ message: headline });

  // part the first line of the message from the body beneath it
  const [lead, ...bodyLines] = parts.headline.split('\n');
  const body = bodyLines.join('\n').trim();

  // render each field but the hint as one compact line, directly under the lead line
  const contextLines = asMetadataContextLines({ metadata: parts.metadata });
  const contextBlock = contextLines.length
    ? `\n\n${contextLines.join('\n')}`
    : '';
  const bodyBlock = body ? `\n\n${body}` : '';
  const hintBlock = parts.hint ? `\n\nhint: ${parts.hint}` : '';
  return `✋ ConstraintError: ${lead}${contextBlock}${bodyBlock}${hintBlock}`;
};

/**
 * .what = one `key: value` line per metadata field, the hint excluded
 * .why = a compact line per field keeps the bag legible beneath a headline; a string reads
 *        bare, and any other value reads as single-line json so its shape stays exact
 */
const asMetadataContextLines = (input: {
  metadata: Record<string, unknown> | null;
}): string[] =>
  Object.entries(input.metadata ?? {})
    .filter(([key, value]) => key !== 'hint' && value !== undefined)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
    );
