import type {
  RouteStoneGuard,
  RouteStoneGuardBrain,
} from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = the ONE rule for what counts as "this stone declares a brain"
 * .why = two sites gate on it — `applyStoneBrainOnEntry`'s I/O short-circuit and
 *        `setStoneBrain`'s authoritative gate. one shared rule keeps them from a silent
 *        disagreement (`rule.forbid.domain-term-inconsistency`)
 *
 * .note = a TYPE GUARD, so `brain` rides past the gate typed non-optional
 *         (`rule.require.assure-via-type-checks`)
 * 🔴 .note = it tests the UNION OF THE AXES, never mere presence: `{ choice: '', effort:
 *           null }` is truthy, and past the gate `setStoneBrain` would dispatch no say yet
 *           report `requested` (`rule.forbid.failhide`). `finalizeBrain` in
 *           `parseStoneGuard` refuses that shape too — a deliberate second guard, since
 *           the arm it protects lies rather than throws
 * .note = POSITIONAL, like every `is*` here (`isUuid(value)`): a predicate narrows the
 *         argument it is handed, so a `{ guard }` literal would narrow a throwaway object
 */
export const isStoneBrainDeclared = (
  guard: RouteStoneGuard | null | undefined,
): guard is RouteStoneGuard & { brain: RouteStoneGuardBrain } =>
  Boolean(guard?.brain?.choice || guard?.brain?.effort);
