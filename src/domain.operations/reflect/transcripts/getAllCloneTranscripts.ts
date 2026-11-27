import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import { getAllInSequence } from '@src/domain.operations/reflect/tokens/getAllInSequence';
import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';
import { getAllClaudeProjectsRoots } from '@src/domain.operations/transcript/getAllClaudeProjectsRoots';

import {
  asTranscriptSessionStats,
  type TranscriptSessionStats,
} from './asTranscriptSessionStats';

/**
 * .what = one session transcript of one clone, with its stats
 * .why = a human resumes a session by its id AND the config dir it was written under: a
 *        session forked into two actors holds one id in two dirs
 */
export type CloneTranscript = {
  actor: string;
  configDir: string;
  slug: string;
  session: string;
  path: string;
  bytes: number;
  stats: TranscriptSessionStats | null;
  fault: string | null;
};

/**
 * .what = the projects roots to search, each with the actor that owns it
 * .why = each clone of this repo runs under `.agent/.actors/<actor>/brain/.claude`; the
 *        human's own sessions sit under `$CLAUDE_CONFIG_DIR` or `~/.claude`
 */
const getAllProjectsRootsOwned = (input: {
  repoRoot: string;
  cwd: string;
  env: { CLAUDE_CONFIG_DIR: string | null; HOME: string | null };
}): { actor: string; root: string }[] => {
  const actorsDir = path.join(input.repoRoot, '.agent', '.actors');
  const ofActors = fs.existsSync(actorsDir)
    ? fs
        .readdirSync(actorsDir)
        .sort()
        .map((name) => ({
          actor: name.replace(/^actor\.via\./, ''),
          root: path.join(actorsDir, name, 'brain', '.claude', 'projects'),
        }))
    : [];
  const ofHuman = getAllClaudeProjectsRoots({
    env: input.env,
    cwd: input.cwd,
  }).map((root) => ({ actor: 'human', root }));

  // one entry per root: an actor's dir set as `$CLAUDE_CONFIG_DIR` keeps its actor name
  const seen = new Set<string>();
  return [...ofActors, ...ofHuman].filter((owned) => {
    if (!fs.existsSync(owned.root) || seen.has(owned.root)) return false;
    seen.add(owned.root);
    return true;
  });
};

/**
 * .what = an entry with only the keys the stats read
 * .why = a 100MB transcript held whole as parsed objects would hold every tool result
 */
const asEntryLean = (input: {
  entry: Record<string, unknown>;
}): Record<string, unknown> => {
  const { type, isMeta, isSidechain, isCompactSummary, timestamp } =
    input.entry;
  const message = input.entry.message as { content?: unknown } | undefined;
  return {
    type,
    isMeta,
    isSidechain,
    isCompactSummary,
    timestamp,
    message: type === 'user' ? { content: message?.content } : undefined,
    attachment: type === 'attachment' ? input.entry.attachment : undefined,
  };
};

/**
 * .what = reads one transcript line by line into its stats
 * .why = a long session runs past 100MB; a stream holds one line at a time, not the file
 * .note = a torn line (a write in flight) is skipped, not fatal
 */
const getOneTranscriptSessionStats = async (input: {
  path: string;
}): Promise<TranscriptSessionStats> => {
  const lines = readline.createInterface({
    input: fs.createReadStream(input.path, 'utf8'),
    crlfDelay: Infinity,
  });
  const entries: Record<string, unknown>[] = [];
  for await (const line of lines) {
    if (!line.trim()) continue;
    const entry = (() => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
    })();
    if (entry) entries.push(asEntryLean({ entry }));
  }
  return asTranscriptSessionStats({ entries });
};

/**
 * .what = every session transcript of every clone in this repo, with its stats
 * .why = several clones work one tree under distinct actors; to find the session a human
 *        spoke to, each transcript must be read for its last human prompt
 * .note = scope `tree` keeps this tree's project dir only; `all` keeps every project dir
 * .note = a transcript that cannot be read is kept with its fault, never dropped
 */
export const getAllCloneTranscripts = async (input: {
  repoRoot: string;
  cwd: string;
  scope: 'tree' | 'all';
  session: string | null;
  env: { CLAUDE_CONFIG_DIR: string | null; HOME: string | null };
}): Promise<CloneTranscript[]> => {
  const slugOfTree = computeProjectSlug({ cwd: input.repoRoot });
  const found = getAllProjectsRootsOwned(input).flatMap(({ actor, root }) =>
    fs
      .readdirSync(root)
      .filter((slug) => input.scope === 'all' || slug === slugOfTree)
      .filter((slug) => fs.statSync(path.join(root, slug)).isDirectory())
      .flatMap((slug) =>
        fs
          .readdirSync(path.join(root, slug))
          .filter((name) => name.endsWith('.jsonl'))
          .filter((name) => !input.session || name.startsWith(input.session))
          .map((name) => ({
            actor,
            configDir: path.dirname(root),
            slug,
            session: path.basename(name, '.jsonl'),
            path: path.join(root, slug, name),
          })),
      ),
  );

  // read one transcript at a time: hundreds of files, some past 100MB, read at once would
  // open every file together. a fault stays on its row
  return getAllInSequence({
    items: found,
    step: async (transcript): Promise<CloneTranscript> => {
      const bytes =
        fs.statSync(transcript.path, { throwIfNoEntry: false })?.size ?? 0;
      try {
        const stats = await getOneTranscriptSessionStats({
          path: transcript.path,
        });
        return { ...transcript, bytes, stats, fault: null };
      } catch (error) {
        return {
          ...transcript,
          bytes,
          stats: null,
          fault: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
};
