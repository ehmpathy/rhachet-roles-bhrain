import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';

/**
 * .what = decides whether a verdict row was ruled over every dispute that now cites its entry
 * .why = a verdict speaks only for the disputes the human saw; one raised since is a concern no
 *        human ruled, whatever the entry's text says
 */
export const isFulcrumVerdictRowOverDisputes = (input: {
  row: FulcrumVerdictRow;
  disputes: string[];
}): boolean => input.disputes.every((key) => input.row.held.includes(key));
