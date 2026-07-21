import { RUNTIME_GUARD_VAR_NAMES } from '../RUNTIME_GUARD_VAR_NAMES';

/**
 * the set of `$VAR` tokens a guard may legitimately carry after a copy-time replay:
 * the runtime vars (left literal, substituted at judge-run time) plus `$BEHAVIOR_DIR_REL`
 * (already replayed by getGuardWithCopyTimeVars before this scan runs).
 */
const ALLOWED_VARS = new Set<string>([
  ...RUNTIME_GUARD_VAR_NAMES,
  '$BEHAVIOR_DIR_REL',
]);

/**
 * matches a BARE template var token: `$` then a letter/underscore then word chars.
 * this grammar (i011.B2) deliberately does NOT match shell CONTROL syntax that appears
 * literally in guard `run:` lines:
 * - `$(cmd)` command substitution — `(` is not a letter, so `$(` never matches
 * - `${...}` / `${1:-x}` parameter expansion — `{` is not a letter, so `${` never matches
 * - positional/special params `$1` `$@` `$*` `$#` `$?` — a digit/sigil is not a letter
 *
 * KNOWN THIN SPOT (documented, examined): a bare shell env var like `$HOME`/`$PATH`
 * WOULD match. this is acceptable — the scan only runs on provenance-tagged templates,
 * and verified bhuild templates use only the runtime allowlist. a supplier that needs a
 * literal `$HOME` in a run line should add an explicit shell-env allowlist, not loosen
 * this grammar.
 */
const BARE_VAR_TOKEN = /\$[A-Za-z_][A-Za-z0-9_]*/g;

/**
 * .what = lists any `$VAR` in the content that is outside the runtime allowlist
 * .why = runtime vars are MEANT to stay literal; only a truly-unknown `$VAR` (e.g. a
 *   future supplier adds `$FOO`) is a defect. the result feeds getGuardUpgradeDecision
 *   as the 'unknown-var' decision — it is NOT a throw (fatality happens once, at the
 *   route-level apply gate).
 */
export const getUnknownGuardVars = (input: { content: string }): string[] => {
  const tokens = input.content.match(BARE_VAR_TOKEN) ?? [];
  const offenders = tokens.filter((token) => !ALLOWED_VARS.has(token));
  return [...new Set(offenders)];
};
