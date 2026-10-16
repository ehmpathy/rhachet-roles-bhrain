import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

/**
 * .what = the errno codes that mean "the path is not there", and no more than that
 * .why = 🔴 an ABSENT artifact is a FACT this subsystem reports on purpose — a tree
 *        that never reviewed, a run that died before it wrote metrics, a target that
 *        vanished between enumeration and stat. every other fs error is a DEFECT.
 *
 *        the two must never collapse, because the grades downstream read them
 *        apart: `refused` renders `$0` — a MEASURED nil — so an EACCES that arrives
 *        as an absence is a confident zero over a file nobody could read.
 *
 * .note = ENOTDIR rides beside ENOENT because a path whose PARENT is a file answers
 *         ENOTDIR for the identical reason ENOENT would: the artifact is not there.
 */
const CODES_OF_ABSENCE = ['ENOENT', 'ENOTDIR'] as const;

/**
 * .what = tells whether a caught fs error means the path was simply not there
 * .why = 🔴 the one allowlist every fs reader here shares. a bare
 *        `.catch(() => null)` allowlists the entire error class, so a permission
 *        denial, a stale handle, or an IO fault all arrive as "absent" — and the
 *        meter renders absence as a measured fact (rule.forbid.failhide).
 *
 *        declared once so no two readers can drift on which codes are benign: one
 *        decision, read everywhere, never re-derived.
 *
 * .note = 🟡 it deliberately states no count of its readers. a count in prose is a
 *         claim that goes stale the moment a reader is added or removed, and it went
 *         stale here — it read "five" against four. grep the callers; the compiler
 *         knows, and this comment cannot.
 *
 * .note = 🔴 it reads the code off the SHAPE via `getFsErrorCode`, never off
 *         `instanceof Error`. a native fs rejection crosses the jest vm realm, where
 *         `instanceof` answers false against the sandboxed `Error` — so an instanceof
 *         guard grades every ENOENT a defect, and only under test. the `code` field
 *         survives that hop; `getFsErrorCode` exists for exactly this reason.
 *
 * .note = answers FALSE for a throw that carries no string `code`, so a programmer
 *         error surfaces rather than reads as an empty corpus.
 */
export const isErrorOfAbsence = (input: { error: unknown }): boolean => {
  const code = getFsErrorCode(input.error);
  if (code === null) return false;
  return (CODES_OF_ABSENCE as readonly string[]).includes(code);
};
