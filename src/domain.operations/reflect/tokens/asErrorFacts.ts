import type { HelpfulError } from 'helpful-errors';

/**
 * .what = a helpful error's core message and its metadata, apart
 * .why = the error tree renders the message as its header and each metadata fact as a
 *        leaf; helpful-errors keeps the two private and serializes them into one message
 *
 * .note = reads only the public api: `redact(['metadata', 'cause'])` yields the core
 *         message, and the rest of the full message is the metadata json the library
 *         wrote. a shape it cannot parse yields `facts: null`, so the render degrades to
 *         the message alone, never a crash
 */
export const asErrorFacts = (input: {
  error: HelpfulError;
}): { message: string; facts: Record<string, unknown> | null } => {
  const core = input.error.redact(['metadata', 'cause']).message;
  const message = asMessageBare({ message: core });
  const full = input.error.message;

  // a full message that no longer holds the core one is a shape we do not know; degrade
  // on purpose to the full message alone, so no fact is ever sliced from the wrong offset
  const offset = full.indexOf(message);
  if (offset < 0) return { message: full, facts: null };

  const rest = full.slice(offset + message.length).trim();
  return { message, facts: asFactsParsed({ text: rest }) };
};

/**
 * .what = the message without the class names helpful-errors prefixes onto it
 * .why = the tree header already names the class; a second name reads as two classes
 * .note = a redacted clone is constructed anew, so its message may carry the prefix twice
 */
const asMessageBare = (input: { message: string }): string =>
  input.message.replace(/^(\w+Error: )+/, '');

/**
 * .what = the metadata json as a record, or null when it is absent or not an object
 */
const asFactsParsed = (input: {
  text: string;
}): Record<string, unknown> | null => {
  if (input.text === '') return null;
  try {
    const value: unknown = JSON.parse(input.text);
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return null;
    return Object.fromEntries(Object.entries(value));
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
