import * as os from 'os';
import * as path from 'path';

/**
 * .what = the directories where claude code stores project transcripts, in search order
 * .why = a session started with `$CLAUDE_CONFIG_DIR` stores its transcripts there, never
 *        under `~/.claude`. a lookup that reads only the home root reports a real
 *        transcript as absent
 *
 * .note = `$CLAUDE_CONFIG_DIR/projects` first, then `~/.claude/projects`; a duplicate drops
 */
export const getAllClaudeProjectsRoots = (input: {
  env: { CLAUDE_CONFIG_DIR: string | null; HOME: string | null };
  cwd: string;
}): string[] => {
  const home = input.env.HOME ?? os.homedir();
  const configDir = input.env.CLAUDE_CONFIG_DIR?.trim() || null;
  const configRoot = configDir
    ? path.join(
        path.isAbsolute(configDir)
          ? configDir
          : path.join(input.cwd, configDir),
        'projects',
      )
    : null;
  const roots = [
    ...(configRoot ? [configRoot] : []),
    path.join(home, '.claude', 'projects'),
  ];
  return [...new Set(roots)];
};
