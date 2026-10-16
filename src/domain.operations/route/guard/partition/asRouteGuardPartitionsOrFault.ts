import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';

/**
 * .what = whether a parsed value is a list of strings
 */
const isListOfStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/**
 * .what = whether a parsed value is a record of string lists
 */
const isRecordOfStringLists = (
  value: unknown,
): value is Record<string, string[]> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every(isListOfStrings);

/**
 * .what = whether a parsed value has the shape the tool writes
 */
const isRouteGuardPartitions = (
  value: unknown,
): value is RouteGuardPartitions => {
  if (typeof value !== 'object' || value === null) return false;
  const shape: { all?: unknown; byPeer?: unknown } = value;
  return (
    (shape.all === null || isListOfStrings(shape.all)) &&
    isRecordOfStringLists(shape.byPeer)
  );
};

/**
 * .what = a route's partition declaration, parsed from its file content — or the fault
 *         that names why it does not read
 * .why = the reader refuses loud on a fault, so this owns only the parse and the shape
 *        check. the fault carries the parser's own message, so a human who hand-edited
 *        the file is told which character broke it, never only that it broke
 */
export const asRouteGuardPartitionsOrFault = (input: {
  content: string;
}):
  | { declared: RouteGuardPartitions; fault: null }
  | { declared: null; fault: string } => {
  // a file that is not json is not a declaration; name the parser's own reason
  const parsed: { value: unknown; fault: string | null } = (() => {
    try {
      return { value: JSON.parse(input.content), fault: null };
    } catch (error) {
      // only a parse fault is absorbed; aught else is a defect, and rethrows
      if (error instanceof SyntaxError)
        return { value: null, fault: `not json — ${error.message}` };
      throw error;
    }
  })();
  if (parsed.fault !== null) return { declared: null, fault: parsed.fault };

  // a json value of another shape is not a declaration either
  const value = parsed.value;
  if (!isRouteGuardPartitions(value))
    return {
      declared: null,
      fault:
        'not the shape the tool writes — expected { all: string[] | null, byPeer: Record<string, string[]> }',
    };
  return { declared: { all: value.all, byPeer: value.byPeer }, fault: null };
};
