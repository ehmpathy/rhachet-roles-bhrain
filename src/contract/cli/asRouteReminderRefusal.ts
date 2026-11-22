import type { BadRequestError } from 'helpful-errors';

import { asConstraintErrorHeadline } from './asConstraintErrorHeadline';
import { asHelpfulMessageParts } from './asHelpfulMessageParts';

/**
 * .what = the refusal frame a route.reminder constraint renders as: its headline, and its fix
 * .why = a reminder verb refuses with a BadRequestError whose `hint` names the fix. the shell
 *        renders it through `emitReviewRefusal`, the frame every `rhx route.*` refusal shares, so
 *        the hint lands as the tree's `fix:` leaf rather than as a raw metadata dump
 */
export const asRouteReminderRefusal = (input: {
  error: BadRequestError;
}): { headline: string; lines: string[] } => {
  const parts = asHelpfulMessageParts({
    message: asConstraintErrorHeadline({ error: input.error }),
  });
  return {
    headline: parts.headline,
    lines: parts.hint ? [`   └─ fix: ${parts.hint}`] : [],
  };
};
