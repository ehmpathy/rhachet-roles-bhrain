// sdk exports for rhachet introspection
export { getInvokeHooks } from '@src/domain.operations/hooks/getInvokeHooks';
// domain operations for consumers who provide their own brain context
export type { StepReflectResult } from '@src/domain.operations/reflect/stepReflect';
export { stepReflect } from '@src/domain.operations/reflect/stepReflect';
export type { StepReviewResult } from '@src/domain.operations/review/stepReview';
export { stepReview } from '@src/domain.operations/review/stepReview';
export { getRoleRegistry } from '@src/domain.roles/getRoleRegistry';

// cli entry points - also available via fast 'rhachet-roles-bhrain/cli' subpath
import { reflect } from '@src/contract/cli/reflect';
import { review } from '@src/contract/cli/review';

export const cli = {
  review,
  reflect,
};
