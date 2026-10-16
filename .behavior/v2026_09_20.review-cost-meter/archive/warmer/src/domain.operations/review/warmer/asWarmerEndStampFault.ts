import { MalfunctionError } from 'helpful-errors';

import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';
import { isErrorOfWatermarkFault } from '@src/domain.operations/review/watermark/isErrorOfWatermarkFault';

/**
 * .what = the fault a warmer's end stamp must throw, or null where the stamp fault may lapse
 * .why = 🔴 the end stamp runs after the warmer's life, and its catch must allowlist what it
 *        tolerates and throw the rest (rule.forbid.failhide) — yet it may never mask the
 *        life's own fault. so:
 *        - a watermark fault lapses on its own → null
 *        - a clean life → the stamp's fault is the only fault, thrown as itself
 *        - a faulted life → one error that names BOTH, whose `cause` is the life's fault,
 *          so the life's fault stands first and the stamp's fault is never swallowed
 */
export const asWarmerEndStampFault = (input: {
  stampFault: unknown;
  life: { fault: unknown } | null;
}): { fault: unknown } | null => {
  // a watermark fault lapses on its own, once the promised wake goes by
  if (isErrorOfWatermarkFault({ error: input.stampFault })) return null;

  // a clean life: the stamp's fault is the only fault
  if (input.life === null) return { fault: input.stampFault };

  // a faulted life: chain the life's fault beneath one error that names both
  const lifeFault = input.life.fault;
  const cause =
    lifeFault instanceof Error
      ? lifeFault
      : new Error(asErrorMessage({ error: lifeFault }));
  return {
    fault: new MalfunctionError(
      `review._.warmer faulted, and could not stamp its record ended either: ${asErrorMessage({ error: input.stampFault })}`,
      {
        cause,
        lifeFault: asErrorMessage({ error: lifeFault }),
        stampFault: asErrorMessage({ error: input.stampFault }),
      },
    ),
  };
};
