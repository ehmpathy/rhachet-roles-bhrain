/**
 * .what = evaluate whether a tool invocation writes to claude native memory
 * .why = native memory is machine-local and invisible in git — not durable, not
 *        reusable. this verdict feeds a hook that halts such writes and redirects
 *        the bot to durable capture in .agent/repo=.this/role=any/{briefs,skills}.
 */

/**
 * .what = pattern that matches claude native-memory paths precisely
 * .why = target ONLY the machine-local auto-memory, never config or durable files
 *
 * matches (block):
 * - ~/.claude/projects/<slug>/memory/MEMORY.md
 * - ~/.claude/projects/<slug>/memory/user_role.md
 * - /home/x/.claude/sub/dir/memory/note.md
 *
 * does NOT match (allow):
 * - ~/.claude/settings.json           (config, not memory)
 * - ~/.claude/CLAUDE.md               (already durable, git-friendly)
 * - repo/CLAUDE.md                    (in-repo, durable)
 * - .agent/repo=.this/role=any/...    (the durable target)
 *
 * pattern breakdown:
 * - \.claude\/ = literal ".claude/" (the native memory root)
 * - .* = any subpath (e.g. projects/<slug>/)
 * - (\/memory\/|\/MEMORY\.md) = a memory subdir OR the MEMORY.md index file
 */
const NATIVE_MEMORY_PATH_PATTERN = /\.claude\/.*(\/memory\/|\/MEMORY\.md)/;

/**
 * .what = indicators that a bash command writes (not merely reads) a path
 * .why = a read of native memory is harmless; only a write must be halted.
 *        mirrors the write-detection of the ehmpathy forbid-tmp-writes hook.
 */
const BASH_WRITE_INDICATORS = [
  />\s*/, // redirect: > or >>
  /\btee\b/, // tee / tee -a
  /\bcp\b/, // cp into path
  /\bmv\b/, // mv into path
  /\bteesafe\b/, // rhx teesafe
];

/**
 * .what = detect a native-memory path written by a bash command
 * .why = Bash tool sends a command string, not a file_path; a Write|Edit-only
 *        matcher would be trivially bypassable via `echo … | teesafe ~/.claude/…`
 */
const getMemoryPathFromBashWrite = (input: {
  command: string;
}): string | null => {
  // a write indicator must be present, else it is a read — allow
  const hasWriteIntent = BASH_WRITE_INDICATORS.some((re) =>
    re.test(input.command),
  );
  if (!hasWriteIntent) return null;

  // find a native-memory path referenced in the command
  const match = input.command.match(
    /([^\s"']*\.claude\/[^\s"']*(?:\/memory\/|\/MEMORY\.md)[^\s"']*)/,
  );
  return match ? (match[1] ?? null) : null;
};

/**
 * .what = extract the path to check from a tool invocation
 * .why = Write/Edit carry file_path; Bash carries a command to inspect for writes
 */
const extractMemoryPathToCheck = (input: {
  toolName: string;
  toolInput: { file_path: string | null; command: string | null };
}): string | null => {
  // bash tool: only a write into a memory path counts
  if (input.toolName === 'Bash' && input.toolInput.command) {
    return getMemoryPathFromBashWrite({ command: input.toolInput.command });
  }

  // file-based tools (Write/Edit): the file_path is the write target
  if (
    (input.toolName === 'Write' || input.toolName === 'Edit') &&
    input.toolInput.file_path
  ) {
    return input.toolInput.file_path;
  }

  return null;
};

/**
 * .what = decide whether a tool invocation writes to claude native memory
 * .why = the hook halts on 'blocked' and nudges toward durable capture
 */
export const getMemoryGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path: string | null; command: string | null };
}):
  | { verdict: 'allowed' }
  | { verdict: 'blocked'; reason: string; path: string } => {
  // extract the candidate write path (null when not a relevant write)
  const pathToCheck = extractMemoryPathToCheck(input);

  // no memory-write path found: allow
  if (!pathToCheck) {
    return { verdict: 'allowed' };
  }

  // a precise native-memory path: block
  if (NATIVE_MEMORY_PATH_PATTERN.test(pathToCheck)) {
    return {
      verdict: 'blocked',
      reason: `write to claude native memory is forbidden: ${pathToCheck}`,
      path: pathToCheck,
    };
  }

  return { verdict: 'allowed' };
};
