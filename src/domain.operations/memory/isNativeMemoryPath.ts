/**
 * .what = pattern that matches claude native-memory paths precisely
 * .why = target ONLY the machine-local auto-memory, never config or durable files
 *
 * matches (block):
 * - ~/.claude/projects/<slug>/memory/MEMORY.md
 * - ~/.claude/projects/<slug>/memory/user_role.md
 * - /home/x/.claude/sub/dir/memory/note.md
 * - ~/.claude/projects/<slug>/memory  (the dir itself, as a `cd` names it)
 *
 * does NOT match (allow):
 * - ~/.claude/settings.json           (config, not memory)
 * - ~/.claude/CLAUDE.md               (already durable, git-friendly)
 * - repo/CLAUDE.md                    (in-repo, durable)
 * - .agent/repo=.this/role=any/...    (the durable target)
 *
 * pattern breakdown:
 * - ^\.claude\/ = literal ".claude/" (the native memory root), at the slice start
 * - .* = any subpath (e.g. projects/<slug>/)
 * - (\/memory(\/|$)|\/MEMORY\.md) = a memory dir (or a path in it) OR the MEMORY.md index file
 */
const NATIVE_MEMORY_PATH_PATTERN = /^\.claude\/.*(\/memory(\/|$)|\/MEMORY\.md)/;

/**
 * .what = decide whether a path lies in claude native memory
 * .why = the one test the guard blocks on; named so each caller reads as intent
 * .note = tested from the first `.claude/` only, since the `.*` after it already
 *         spans each later one; an open start rescanned the path from every
 *         `.claude/` in it, quadratic in a long word
 */
export const isNativeMemoryPath = (input: { path: string }): boolean => {
  const indexRoot = input.path.indexOf('.claude/');
  return (
    indexRoot >= 0 &&
    NATIVE_MEMORY_PATH_PATTERN.test(input.path.slice(indexRoot))
  );
};
