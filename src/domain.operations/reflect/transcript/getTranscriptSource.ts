import * as fs from 'fs';
import * as path from 'path';

import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';
import { getAllClaudeProjectsRoots } from '@src/domain.operations/transcript/getAllClaudeProjectsRoots';
import { getAllSubagentPaths } from '@src/domain.operations/transcript/getAllSubagentPaths';

/**
 * .what = a single transcript session with its subagent files
 * .why = represents one claude code conversation and its spawned subagents
 */
export interface TranscriptSession {
  /**
   * path to the main transcript file for this session
   */
  mainFile: string;

  /**
   * paths to subagent transcript files for this session
   */
  subagentFiles: string[];
}

/**
 * .what = transcript source info from claude code project
 * .why = provides paths to transcript files for snapshot capture
 */
export interface TranscriptSource {
  /**
   * path to claude code project directory
   */
  projectDir: string;

  /**
   * all transcript sessions (one per peer brain)
   */
  sessions: TranscriptSession[];

  /**
   * total session count (number of peer brains)
   */
  sessionCount: number;
}

/**
 * .what = finds all jsonl files in directory sorted by mtime (newest first)
 * .why = captures all peer brain transcripts for complete experience preservation
 */
const findAllJsonl = (input: { dir: string }): string[] => {
  const files = fs.readdirSync(input.dir);
  const jsonlFiles = files
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({
      name: f,
      path: path.join(input.dir, f),
      mtime: fs.statSync(path.join(input.dir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return jsonlFiles.map((f) => f.path);
};

/**
 * .what = discovers claude code transcript source for a directory
 * .why = enables snapshot capture from claude code project
 */
export const getTranscriptSource = (input: {
  cwd: string;
  env: { CLAUDE_CONFIG_DIR: string | null; HOME: string | null };
}): TranscriptSource | null => {
  // compute project slug; take the first root that holds it
  // .note = `$CLAUDE_CONFIG_DIR/projects` first, then `~/.claude/projects`
  const slug = computeProjectSlug({ cwd: input.cwd });
  const projectDir =
    getAllClaudeProjectsRoots({ env: input.env, cwd: input.cwd })
      .map((root) => path.join(root, slug))
      .find((dir) => fs.existsSync(dir)) ?? null;

  // check if project exists
  if (!projectDir) {
    return null;
  }

  // find all transcript files (one per peer brain session)
  const mainFiles = findAllJsonl({ dir: projectDir });
  if (mainFiles.length === 0) {
    return null;
  }

  // build sessions array with each main file and its subagents
  const sessions: TranscriptSession[] = mainFiles.map((mainFile) => ({
    mainFile,
    subagentFiles: getAllSubagentPaths({ path: mainFile }),
  }));

  return {
    projectDir,
    sessions,
    sessionCount: sessions.length,
  };
};
