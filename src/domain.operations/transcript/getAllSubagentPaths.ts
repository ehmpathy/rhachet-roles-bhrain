import * as fs from 'fs';
import * as path from 'path';

/**
 * .what = the subagent transcripts that belong to a main transcript, sorted by name
 * .why = claude writes a session's subagents to `<session>/subagents/*.jsonl` beside the
 *        main file; the snapshot capture and the token report both read them, so the
 *        rule lives in one place
 * .note = the names carry a timestamp, so a name sort is a time sort
 * .note = shared at two callers on purpose: this is claude's on-disk layout, a fact of the
 *         domain rather than a duplicated shape; two copies could disagree on where a
 *         session's subagents live, and the token report would then miss what capture saw
 */
export const getAllSubagentPaths = (input: { path: string }): string[] => {
  const dir = path.join(
    path.dirname(input.path),
    path.basename(input.path, '.jsonl'),
    'subagents',
  );
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .sort()
    .map((name) => path.join(dir, name));
};
