export * from '@src/contract/sdk';
export type { StepReflectResult } from '@src/domain.operations/reflect/stepReflect';
// domain operations for consumers who provide their own brain context
export { stepReflect } from '@src/domain.operations/reflect/stepReflect';
export type { StepReviewResult } from '@src/domain.operations/review/stepReview';
export { stepReview } from '@src/domain.operations/review/stepReview';

import { reflect } from '@src/contract/cli/reflect';
// cli entry points for portable skill dispatch
import { review } from '@src/contract/cli/review';

export const cli = {
  review,
  reflect,
};
