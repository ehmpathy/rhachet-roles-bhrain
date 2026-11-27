/**
 * .what = one place a hook runs from: its command, its timeout in seconds, and its author
 */
export interface RepoHookSite {
  command: string;
  timeoutSeconds: number | null;
  author: string | null;
}

/**
 * .what = the field positions of a manifest data row
 * .why = rhachet declares the row order once (`HOOK_DISPATCH_MANIFEST_FIELDS`: event, matcher,
 *        timeout, author, kind, path, frame, args, command, when), with `args` packed into one
 *        field by `\x1e`. the order is fixed, so a field is read by its position — never as
 *        "the last non-empty field", which a set `when` (`before` / `after`) would displace
 */
const FIELD_INDEX = {
  timeout: 2,
  author: 3,
  command: 8,
} as const;

/**
 * .what = every hook site a dispatch manifest holds
 * .why = a data row is `\x1f`-separated in rhachet's declared order. a `#` line is the
 *        human-read copy of the row below it, so only data rows are read
 */
export const asAllManifestHookSites = (input: {
  manifest: string;
}): RepoHookSite[] =>
  input.manifest
    .split('\n')
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split('\x1f'))
    .map((fields) => ({
      command: fields[FIELD_INDEX.command] ?? '',
      timeoutSeconds: Number(fields[FIELD_INDEX.timeout]) || null,
      author: fields[FIELD_INDEX.author] || null,
    }));
