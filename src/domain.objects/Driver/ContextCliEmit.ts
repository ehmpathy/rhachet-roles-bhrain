import type { GuardProgressEvent } from './GuardProgressEvent';

/**
 * .what = position context for guard progress events
 * .why = enables branch format (├─ vs └─) based on position in guard sequence
 */
export interface ContextGuardProgress {
  index: number;
  total: number;
}

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
    onGuardProgress: (
      event: GuardProgressEvent,
      position?: ContextGuardProgress,
    ) => void;
  };
}
