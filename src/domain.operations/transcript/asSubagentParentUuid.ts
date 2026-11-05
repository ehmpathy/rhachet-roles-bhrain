import * as path from 'path';

/**
 * .what = the session uuid a subagent transcript belongs to, or null for a main transcript
 * .why = claude writes a subagent to `<dir>/<session-uuid>/subagents/<name>.jsonl`; a file
 *        passed by its own path is read as a subagent thread, and its header names its parent
 */
export const asSubagentParentUuid = (input: {
  path: string;
}): string | null => {
  const dir = path.dirname(input.path);
  if (path.basename(dir) !== 'subagents') return null;
  return path.basename(path.dirname(dir));
};
