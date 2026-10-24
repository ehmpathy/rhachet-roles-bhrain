import { asErrorCauseClause } from '@src/domain.operations/route/asErrorCauseClause';
import { MESSAGE_OF_MULTI_BIND } from '@src/domain.operations/route/bind/MESSAGE_OF_MULTI_BIND';
import { isCallerConstraintError } from '@src/utils/isCallerConstraintError';

/**
 * .what = the one stderr row a status line entry prints for a renderer fault
 * .why = the shared branch-bind lookup advises `--route` to disambiguate a
 *        multi-bind, which is correct for the subcommands that accept `--route`
 *        (route.drive, route.stone.*) but a dead end for the status line — it
 *        accepts no `--route` flag (it derives the branch-bound route from cwd).
 *        to echo that advice sends an operator down a path that is silently
 *        ignored, so for the multi-bind case the row carries status-line-scoped
 *        guidance (unbind the extras). every other fault passes through its own
 *        message. this only reframes the logged row; the caller still rethrows the
 *        original error (fail-loud, never hidden).
 *
 * .note = the row opens with its class behind its glyph (rule.require.qualified-error-headers):
 *         a caller constraint (exit 2) is `✋ ConstraintError:`, all else `💥 MalfunctionError:`.
 *         the row owns that header, so both status line entries print one source
 */
export const asStatusLineFaultRow = (input: { error: unknown }): string => {
  const message = asMessageWithoutClassHeader({
    message: asErrorCauseClause({ error: input.error }),
  });
  const header = asStatusLineFaultHeader({ error: input.error });

  // the multi-bind ambiguity: drop the `--route` advice (unsupported here)
  if (
    isCallerConstraintError(input.error) &&
    message.includes(MESSAGE_OF_MULTI_BIND)
  )
    return `${header} ${MESSAGE_OF_MULTI_BIND} — unbind the extra route(s) so the status line can pick one`;

  // any other fault: surface its own message
  return `${header} ${message}`;
};

/**
 * .what = a message with the class header a helpful error carries at its head removed
 * .why = a helpful error's message opens with its own class (`BadRequestError: …`,
 *        `💥 MalfunctionError: …`); the row already opens with the qualified header, so the
 *        class would print twice
 */
const asMessageWithoutClassHeader = (input: { message: string }): string =>
  input.message.replace(/^(?:[^\s\w]+\s)?[A-Z]\w*Error: /u, '');

/**
 * .what = the qualified header of a status line fault row, by who must fix it
 */
const asStatusLineFaultHeader = (input: { error: unknown }): string =>
  isCallerConstraintError(input.error)
    ? '✋ ConstraintError: [route.status.line]'
    : '💥 MalfunctionError: [route.status.line]';
