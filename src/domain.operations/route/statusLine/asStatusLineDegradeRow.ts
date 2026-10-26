import { asErrorCauseClause } from '@src/domain.operations/route/asErrorCauseClause';

/**
 * .what = the stderr row for a phase derivation that faulted and degraded the line
 * .why = the row is data: the render returns it, the cache stores it, and the cli entry
 *        prints it on the miss and on every hit after, so a hit replays what the miss said
 *
 * .note = it keeps the extant degrade prefix `[route.status.line] fault:` (route fulcrum F9);
 *         the cause reads `<ErrorName>: <message>`, as the stderr dump of an Error opens
 */
export const asStatusLineDegradeRow = (input: {
  stone: string;
  error: unknown;
}): string => {
  const cause =
    input.error instanceof Error
      ? `${input.error.name}: ${input.error.message}`
      : asErrorCauseClause({ error: input.error });
  return `[route.status.line] fault: phase derivation faulted for stone "${input.stone}", degraded to plain stone line: ${cause}`;
};
