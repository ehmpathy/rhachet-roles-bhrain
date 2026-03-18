import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
   * path to main transcript file (most recent *.jsonl)
   */
  mainFile: string;

  /**
   * paths to compaction/subagent transcript files
   */
  compactionFiles: string[];

  /**
   * total episode count (main + compactions)
   */
  episodeCount: number;
}

/**
 * .what = base directory for claude code projects
 * .why = standard location for claude code transcript storage
 */
const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude/projects');

/**
 * .what = computes claude code project slug from directory path
 * .why = matches claude code's path-to-slug conversion
 *
 * claude code transforms paths: / → -, _ → -, . → -
 * e.g., /home/user/_worktrees/repo.branch -> -home-user--worktrees-repo-branch
 */
export const computeProjectSlug = (input: { cwd: string }): string => {
  return input.cwd
    .replace(/\//g, '-') // slashes become dashes
    .replace(/_/g, '-') // underscores become dashes
    .replace(/\./g, '-'); // dots become dashes
};

/**
 * .what = finds most recent jsonl file in directory by mtime
 * .why = the main transcript is the most recently modified jsonl file
 */
const findMostRecentJsonl = (input: { dir: string }): string | null => {
  const files = fs.readdirSync(input.dir);
  const jsonlFiles = files
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({
      name: f,
      path: path.join(input.dir, f),
      mtime: fs.statSync(path.join(input.dir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return jsonlFiles[0]?.path ?? null;
};

/**
 * .what = discovers claude code transcript source for a directory
 * .why = enables snapshot capture from claude code project
 */
export const getTranscriptSource = (input: {
  cwd: string;
}): TranscriptSource | null => {
  // compute project slug
  const slug = computeProjectSlug({ cwd: input.cwd });
  const projectDir = path.join(CLAUDE_PROJECTS_DIR, slug);

  // check if project exists
  if (!fs.existsSync(projectDir)) {
    return null;
  }

  // find main transcript file
  const mainFile = findMostRecentJsonl({ dir: projectDir });
  if (!mainFile) {
    return null;
  }

  // find compaction files
  // they live in <UUID>/subagents/ directories
  const compactionFiles: string[] = [];
  const mainFileName = path.basename(mainFile, '.jsonl');
  const subagentsDir = path.join(projectDir, mainFileName, 'subagents');

  if (fs.existsSync(subagentsDir)) {
    const subagentFiles = fs.readdirSync(subagentsDir);
    for (const file of subagentFiles) {
      if (file.endsWith('.jsonl')) {
        compactionFiles.push(path.join(subagentsDir, file));
      }
    }
    // sort by name (they have timestamps in names)
    compactionFiles.sort();
  }

  return {
    projectDir,
    mainFile,
    compactionFiles,
    episodeCount: 1 + compactionFiles.length,
  };
};
