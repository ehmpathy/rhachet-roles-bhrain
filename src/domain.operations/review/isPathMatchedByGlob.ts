/**
 * .what = the anchored regex source for one glob, with standard segment semantics
 * .why = `*` and `**` are two different claims: `*` stays within one path segment, `**`
 *        spans segments. a matcher that reads `*` as `**` makes a narrow glob claim a whole
 *        subtree — so `src/review/*` claimed every file beneath it, and no two partitions
 *        could be drawn disjoint
 *
 * .note = every character that is not a glob token is literal, so `review.*` matches the
 *         dot and never `reviewX…`
 */
const asGlobRegexSource = (input: { glob: string }): string => {
  // walk the glob once; each token maps to its regex, every other char is escaped
  const tokens =
    input.glob.match(/\*\*\/|\*\*|\*|\?|\{[^{}]*\}|\[[^\]/]+\]|[^*?{[]+|./g) ??
    [];
  return tokens
    .map((token) => {
      if (token === '**/') return '(?:.*/)?';
      if (token === '**') return '.*';
      if (token === '*') return '[^/]*';
      if (token === '?') return '[^/]';
      if (/^\[[^\]/]+\]$/.test(token))
        return `[${token.slice(1, -1).replace(/^!/, '^').replace(/\\/g, '\\\\')}]`;
      if (/^\{[^{}]*\}$/.test(token))
        return `(?:${token
          .slice(1, -1)
          .split(',')
          .map((member) => asGlobRegexSource({ glob: member.trim() }))
          .join('|')})`;
      return token.replace(/[.+^$()|[\]\\{}]/g, '\\$&');
    })
    .join('');
};

/**
 * .what = checks if a file path matches a glob pattern
 * .why = drives `--paths-wout` exclusion, the polluter exemption, and `--partition` claims
 *        as one named transformer, so one pattern reads one way under every flag
 *
 * .note = three match modes, in order:
 *   - exact: file path equals the pattern
 *   - suffix: pattern names a final path segment (e.g. "secret.ts")
 *   - wildcard: pattern has *, ?, a {a,b} brace list, or a [ab] class, matched with
 *     standard glob semantics — `*` and `?` within one segment, `**` across segments, `**\/`
 *     for zero or more directories, `[ab]` / `[!ab]` one char of a class. a pattern with no
 *     `/` tests the basename, as `.gitignore` does, so `*.ts` still means a `.ts` file at
 *     any depth
 *
 * .note = a bracketed literal name (`file.[ref].md`) still matches itself, since the exact
 *         and suffix modes run before the wildcard mode
 *
 * .note = 🔴 a brace list is an alternation, `{ts,md}` → `(ts|md)`. `--paths-with` selects
 *         files through a real glob library, where braces work and `*` stops at a `/`; this
 *         matcher must agree with it, or one pattern holds two senses by flag
 */
export const isPathMatchedByGlob = (input: {
  path: string;
  glob: string;
}): boolean => {
  const { path: filePath, glob } = input;

  // exact path match
  if (filePath === glob) return true;

  // suffix match: pattern names a final segment of the path
  if (filePath.endsWith(`/${glob}`)) return true;

  // wildcard match: standard glob semantics, anchored
  if (
    glob.includes('*') ||
    glob.includes('?') ||
    /\{[^{}]*,[^{}]*\}/.test(glob) ||
    /\[[^\]/]+\]/.test(glob)
  ) {
    // a slash-free pattern tests the basename, as .gitignore does
    const subject = glob.includes('/')
      ? filePath
      : (filePath.split('/').pop() ?? filePath);
    return new RegExp(`^${asGlobRegexSource({ glob })}$`).test(subject);
  }

  return false;
};
