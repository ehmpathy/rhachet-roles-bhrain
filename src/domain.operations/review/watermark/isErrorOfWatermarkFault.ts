import { isErrorOfWriteRefusal } from '@src/domain.operations/review/watermark/isErrorOfWriteRefusal';
import { getAllErrorCauses } from '@src/utils/getAllErrorCauses';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

import { ReviewWatermarkParseError } from './ReviewWatermarkParseError';

/**
 * .what = the class names `with-simple-mutex` throws when a hold cannot be had or kept
 * .why = matched by name, never `instanceof`, since the package may carry its own copy
 *        of `helpful-errors` (see `getAllErrorClassNames`)
 */
const NAMES_OF_HOLD_FAULT = [
  'SimpleMutexAcquireTimeoutError',
  'SimpleMutexLeaseExpiredError',
] as const;

/**
 * .what = the class name a watermark whose bytes are not valid json raises
 * .why = a torn write or a hand edit is a fault of the store's CONTENT, not of the code
 *        that asked, so it costs the cache and never the review (`ReviewWatermarkParseError`)
 */
const NAME_OF_PARSE_FAULT = ReviewWatermarkParseError.name;

/**
 * .what = the prefix `with-simple-mutex` gives a backend fault it wraps
 * .why = a disk that refuses the lock entry surfaces as a `MalfunctionError` whose message
 *        opens with this prefix; the raw fault rides on its `cause`
 *
 * .note = `helpful-errors` may lead the message with its qualified header
 *         (`💥 MalfunctionError: `), so the header is optional ahead of the prefix
 */
const PATTERN_OF_HOLD_BACKEND_FAULT = /^(?:\S+ \w+Error: )?withSimpleMutex:/;

/**
 * .what = tells whether a caught error is a fault of the watermark store — its disk, or
 *         its hold — rather than a defect in the code that asked
 * .why = 🔴 a prime must never fail a review whose verdict is written. so a
 *        watermark fault is caught and carried as a fault; every other throw surfaces as
 *        itself (rule.forbid.failhide). the allowlist is by NAME: a filesystem write
 *        refusal anywhere on the cause chain, a hold that timed out or lapsed, a watermark
 *        torn past valid json, or the mutex's own wrap of a backend fault
 */
export const isErrorOfWatermarkFault = (input: { error: unknown }): boolean =>
  getAllErrorCauses(input).some((error) => {
    // a filesystem refusal, bare or wrapped
    if (isErrorOfWriteRefusal({ error })) return true;

    // a hold that could not be taken, or lapsed under its holder
    const names = getAllErrorClassNames({ error });
    // .note = the `as` widens the `as const` tuple to `readonly string[]` so `.includes`
    //         accepts any string; a widen, never a narrow, so it asserts naught
    if (
      names.some((name) =>
        (NAMES_OF_HOLD_FAULT as readonly string[]).includes(name),
      )
    )
      return true;

    // a watermark torn or hand-edited past valid json
    if (names.includes(NAME_OF_PARSE_FAULT)) return true;

    // the mutex's wrap of a fault in its cache backend
    // .note = the `as` reads the field NAME `message` off a caught value of unknown shape;
    //         the field is typed `unknown`, so the `typeof` check below is the gate
    const message = (error as { message?: unknown } | null)?.message;
    return (
      names.includes('MalfunctionError') &&
      typeof message === 'string' &&
      PATTERN_OF_HOLD_BACKEND_FAULT.test(message)
    );
  });
