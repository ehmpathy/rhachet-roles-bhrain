import type { GuardProgressEvent } from './GuardProgressEvent';

/**
 * .what = context type that encapsulates cli output callbacks
 * .why = enables progress feedback to propagate through the (input, context) call chain
 *
 * .note = onGuardProgress is always required — the injected callback
 *   decides whether to act on events or stay silent.
 *   tests pass { cliEmit: { onGuardProgress: () => {} } } (no-op)
 *   unless they verify progress events.
 */
export interface ContextCliEmit {
  cliEmit: {
    onGuardProgress: (event: GuardProgressEvent) => void;
  };
}
