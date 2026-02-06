import { UnexpectedCodePathError } from 'helpful-errors';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';

import { setStoneAsApproved } from './stones/setStoneAsApproved';
import { setStoneAsPassed } from './stones/setStoneAsPassed';

/**
 * .what = orchestrates set of stone status (passed or approved)
 * .why = enables robots and humans to mark milestones complete
 */
export const stepRouteStoneSet = async (
  input: {
    stone: string;
    route: string;
    as: 'passed' | 'approved';
  },
  context: ContextCliEmit,
): Promise<{
  passed?: boolean;
  approved?: boolean;
  refs?: { reviews: string[]; judges: string[] };
  emit: { stdout: string } | null;
}> => {
  // dispatch to appropriate operation
  if (input.as === 'approved') {
    const result = await setStoneAsApproved({
      stone: input.stone,
      route: input.route,
    });
    return {
      approved: result.approved,
      emit: result.emit,
    };
  }

  if (input.as === 'passed') {
    const result = await setStoneAsPassed(
      {
        stone: input.stone,
        route: input.route,
      },
      context,
    );
    return {
      passed: result.passed,
      refs: result.refs,
      emit: result.emit,
    };
  }

  throw new UnexpectedCodePathError('unsupported --as value', { as: input.as });
};
