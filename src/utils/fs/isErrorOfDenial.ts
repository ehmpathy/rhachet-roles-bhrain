import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = the errno codes that mean "the path is there and you may not read it"
 * .why = 🔴 the exact complement of `CODES_OF_ABSENCE`, and the pair is the point:
 *        an ABSENT log dir is a FACT a tree reports on purpose, where a DENIED one
 *        is a wall a human must act on. they are the two fs failures that both
 *        arrive as an empty read, and they need opposite answers — absence reads as
 *        an empty corpus, denial reads as a refusal that names the fix.
 *
 * .note = EPERM rides beside EACCES because a read barred by an ownership rule
 *         rather than a mode bit answers EPERM for the identical reason EACCES
 *         would: the path is there and this process may not have it.
 */
const CODES_OF_DENIAL = ['EACCES', 'EPERM'] as const;

/**
 * .what = tells whether a caught fs error means the path was there but barred
 * .why = 🔴 it is what lets the cli REFUSE rather than crash, without a bare
 *        top-level catch — which is `rule.forbid.failhide`'s named mega-blocker
 *        shape. the catch that reads this predicate allowlists two codes and
 *        rethrows every other error untouched, so a real defect still surfaces
 *        loud with its stack. without it, a denied read surfaces as a raw node
 *        stack rather than a refusal that names the fix
 *        (rule.require.errors-name-the-fix).
 *
 * .note = 🔴 it reads the code off the SHAPE via `getFsErrorCode`, never off
 *         `instanceof Error`, for the same realm reason its absence peer does: a
 *         native fs rejection crosses the jest vm boundary, where `instanceof`
 *         answers false against the sandboxed `Error`.
 *
 * .note = answers FALSE for a throw that carries no string `code`, so a programmer
 *         error surfaces as a defect rather than as a polite refusal.
 */
export const isErrorOfDenial = (input: { error: unknown }): boolean => {
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  return (CODES_OF_DENIAL as readonly string[]).includes(code);
};
