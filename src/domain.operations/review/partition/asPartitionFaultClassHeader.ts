import type { PartitionFaultKind } from './asPartitionFaultKind';

/**
 * .what = the qualified class header a partition fault's kind opens with
 * .why = a fault a human reads names WHO FIXES IT (rule.require.qualified-error-headers): a
 *        constraint is the caller's to clear, so `✋ ConstraintError:`; a transient fault or a
 *        malfunction is the system's, so `💥 MalfunctionError:`
 */
export const asPartitionFaultClassHeader = (input: {
  kind: PartitionFaultKind;
}): string =>
  input.kind === 'constraint.alone' || input.kind === 'constraint.lane-wide'
    ? '✋ ConstraintError:'
    : '💥 MalfunctionError:';
