import { types } from 'util';

import { isToleratedIoWriteError } from './isToleratedIoWriteError';

/**
 * .what = runs an io act; returns null on success, the fault on a tolerated io fault, and rethrows
 *         any other fault
 * .why = a caller that must react to an expected io fault (reap, surface) reads the fault as a
 *        value, while a defect outside the io class still fails loud (rule.forbid.failhide)
 */
export const withToleratedIoFaultAsValue = async (
  logic: () => Promise<unknown>,
): Promise<Error | null> => {
  try {
    await logic();
    return null;
  } catch (error: unknown) {
    // isNativeError, never `instanceof Error`: a node fs error from another vm realm (jest) fails
    // `instanceof` yet is a real Error
    if (!types.isNativeError(error)) throw error;
    if (!isToleratedIoWriteError({ error })) throw error;
    return error;
  }
};
