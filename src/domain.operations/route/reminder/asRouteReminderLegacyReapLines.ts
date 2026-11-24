import { asNodeErrnoCode } from '../asNodeErrnoCode';
import type { RouteReminderLegacyReapOutcome } from './delRouteReminderLegacyHandles';

/**
 * .what = one human line per legacy reap outcome: a reap line, a stale-file line, or a kept line
 *         that names the fix
 * .why = the findsert writes them to the clone log and the teardown prints them to stdout; one
 *        render keeps both channels word for word alike. an absent handle has no line
 */
export const asRouteReminderLegacyReapLines = (input: {
  outcomes: RouteReminderLegacyReapOutcome[];
}): string[] =>
  input.outcomes.flatMap((outcome) => {
    if (outcome.kind === 'absent') return [];
    if (outcome.kind === 'reaped' && outcome.signalled)
      return [
        `RouteReminder legacy daemon reaped — pid ${outcome.pid}, handle ${outcome.pidPath}`,
      ];
    if (outcome.kind === 'reaped')
      return [
        `RouteReminder legacy handle cleared — pid ${outcome.pid} was already gone, handle ${outcome.pidPath}`,
      ];
    return [asLegacyKeptLine(outcome)];
  });

/**
 * .what = the line for a legacy handle whose reap faulted: what, where, and the fix
 * .why = the sweep keeps that handle, so a human must finish the reap by hand. the fix fits the
 *        fault: an EPERM pid was recycled to a foreign process (never signal it), a torn file names
 *        no pid to stop, and any other fault leaves a live pid to stop by hand
 */
const asLegacyKeptLine = (input: {
  pid: number | null;
  pidPath: string;
  error: Error;
}): string => {
  return `RouteReminder legacy handle kept, reap faulted (${input.pidPath}): ${asLegacyKeptCause(input)} — fix: ${asLegacyKeptFixStep(input)}remove ${input.pidPath}, then run rhx route.reminder.gen`;
};

/**
 * .what = the cause of a kept handle, as one plain clause
 * .why = a raw error headline carries a class name and an errno sentence, which bury the fix a
 *        human reads for. each fault class the sweep keeps gets its own clause, with the errno once
 */
const asLegacyKeptCause = (input: {
  pid: number | null;
  error: Error;
}): string => {
  const code = asNodeErrnoCode(input.error);
  if (code === 'EPERM')
    return `the signal to pid ${input.pid} was refused (EPERM)`;
  if (input.pid === null && !code) return 'the pid file is torn';
  if (input.pid === null) return `the pid file could not be read (${code})`;
  if (code) return `the reap of pid ${input.pid} faulted (${code})`;
  return `the reap of pid ${input.pid} faulted: ${asErrorHeadline({ error: input.error })}`;
};

/**
 * .what = the hand step that precedes the handle removal, per fault
 * .why = an EPERM pid belongs to a foreign process now, so `kill` there fails or hits a stranger;
 *        a torn file names no pid. only a readable pid that faulted for another reason is stopped
 */
const asLegacyKeptFixStep = (input: {
  pid: number | null;
  error: Error;
}): string => {
  if (asNodeErrnoCode(input.error) === 'EPERM')
    return `pid ${input.pid} was recycled to a foreign process, so do not signal it; `;
  if (input.pid === null) return 'the file names no pid; ';
  return `stop pid ${input.pid} by hand (kill ${input.pid}), `;
};

/**
 * .what = the first line of an error's message, its `<Class>Error: ` prefix cut
 * .why = a helpful-error message carries its metadata json below the headline, and its headline
 *        opens with its class name; inline in a line, both bury the fix
 */
const asErrorHeadline = (input: { error: Error }): string => {
  const [headline] = input.error.message.split('\n');
  return (headline ?? '').trim().replace(/^\w+Error: /, '');
};
