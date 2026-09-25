import { BadRequestError } from 'helpful-errors';

/**
 * .what = validates a raw --clone-addr flag value carries the canonical `@:<addr>` form
 * .why = rhachet's own clone address uses the `@:` sigil to tell its parser "this is a CLONE
 *        grain, not an actor grain" (asCloneRef). RouteReminder's cloneAddr rides that SAME
 *        address end to end — into sayToClone's `rhx clone say <addr>` call, and into every
 *        pid-path / crash-log / handle key derived from it — so it must carry the identical `@:`
 *        form everywhere: one canonical shape, never a bare serial in one place and a prefixed
 *        one in another. that split is exactly what invites a caller to forget which style a
 *        given surface expects. a caller who drops the sigil gets a fix named in the error, the
 *        same "did you mean '@:...'" shape rhachet's own asCloneRef gives
 *        (rule.require.errors-name-the-fix).
 */
export const asRouteReminderCloneAddr = (input: { raw: string }): string => {
  if (input.raw.startsWith('@:')) return input.raw;
  throw new BadRequestError(
    `'${input.raw}' is not a clone address — clone addresses start with '@:'. did you mean '@:${input.raw}'?`,
    { raw: input.raw, hint: `use '@:${input.raw}'` },
  );
};
