import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
}): TranscriptSource | null => {
  // compute project slug
  const slug = computeProjectSlug({ cwd: input.cwd });
  const projectDir = path.join(CLAUDE_PROJECTS_DIR, slug);

  // check if project exists
  if (!fs.existsSync(projectDir)) {
    return null;
  }

  // find all transcript files (one per peer brain session)
  const mainFiles = findAllJsonl({ dir: projectDir });
  if (mainFiles.length === 0) {
    return null;
  }

  // build sessions array with each main file and its subagents
  const sessions: TranscriptSession[] = mainFiles.map((mainFile) => {
    const mainFileName = path.basename(mainFile, '.jsonl');
    const subagentsDir = path.join(projectDir, mainFileName, 'subagents');
    const subagentFiles: string[] = [];

    if (fs.existsSync(subagentsDir)) {
      const files = fs.readdirSync(subagentsDir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          subagentFiles.push(path.join(subagentsDir, file));
        }
      }
      // sort by name (they have timestamps in names)
      subagentFiles.sort();
    }

    return { mainFile, subagentFiles };
  });

  return {
    projectDir,
    sessions,
    sessionCount: sessions.length,
  };
};
