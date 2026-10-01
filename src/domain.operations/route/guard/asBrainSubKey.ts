import { KEYS_BRAIN_SUB } from './GUARD_KEYS';

/**
 * .what = the `brain:` sub-key an INDENTED guard line declares, lowercased — or null
 *         where the line declares none of them
 * .why = the exploded `brain:` form takes `choice:` and `effort:` beneath it, and the
 *        top-level extractor refuses every indented line by construction
 *        (`asDeclaredGuardKey` returns null for any indent). so the nested scope needs
 *        its own reader, and it must fold case and admit space the SAME way the
 *        top-level one does or the two halves of the format disagree
 *
 * 🔴 .note = it checks against `KEYS_BRAIN_SUB` rather than returns whatever key it finds,
 *           which is the OPPOSITE of the top-level extractor's contract. at the top level
 *           an unknown key is reported by the near-miss advisory (the F4 open-set
 *           verdict); here the set is closed by this feature alone, so an unknown sub-key
 *           is simply not one and the caller has no advisory to route it to
 *
 * .note = `\s*` before the colon and the `i` flag are carried over deliberately. each was
 *         a measured silent-drop class at the top level (`brain : opus`, `Brain: opus`),
 *         and a nested reader that refused what the top-level one admits would reproduce
 *         both one indent in
 */
export const asBrainSubKey = (input: { line: string }): string | null => {
  // no indent means the line belongs to the top level, never to a brain block
  const indent = input.line.match(/^(\s*)/)?.[1]?.length ?? 0;
  if (indent === 0) return null;

  // an empty line or a comment declares no key
  const trimmed = input.line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const matched = trimmed.match(/^([a-z][a-z0-9_-]*)\s*:/i);
  if (!matched?.[1]) return null;

  const key = matched[1].toLowerCase();
  if (!(KEYS_BRAIN_SUB as readonly string[]).includes(key)) return null;

  return key;
};
