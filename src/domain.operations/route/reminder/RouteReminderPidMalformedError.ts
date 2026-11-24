import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = the RouteReminder TORN pid fault — a pid file whose body is not a strict positive integer
 * .why = a dedicated type so a caller that keeps a torn handle (the legacy sweep) names the fault by
 *        its OWN identity, never by a message match or by the base UnexpectedCodePathError, which
 *        other invariant breaks also throw
 *
 * .note = it extends UnexpectedCodePathError, so a generic check still reads it as an unexpected
 *         code path
 */
export class RouteReminderPidMalformedError extends UnexpectedCodePathError {}
