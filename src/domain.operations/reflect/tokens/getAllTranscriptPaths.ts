import * as fs from 'fs';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';

import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';
import { getAllClaudeProjectsRoots } from '@src/domain.operations/transcript/getAllClaudeProjectsRoots';
import { compareStrings } from '@src/utils/compareStrings';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { asGroupsByKey } from './asGroupsByKey';
import { asTranscriptSelectorKind } from './asTranscriptSelectorKind';

/**
 * .what = how a transcript was found
 * .why = the header says how `@current` chose its file, so a wrong pick is visible
 */
export type TranscriptChosenBy =
  | 'path'
  | 'uuid'
  | 'glob'
  | 'session-id'
  | 'mtime';

/**
 * .what = the transcript files a set of `--from` selectors names
 * .why = a human points at a transcript by path, by session uuid, by glob over a corpus,
 *        or by `@current` for the live session; each one names files on disk
 *
 * .note = a uuid and `@current` search `$CLAUDE_CONFIG_DIR/projects`, then
 *         `~/.claude/projects`; a uuid found under both roots is ambiguous and halts
 * .note = a glob never matches a subagent file; subagents are read with their parent
 * .note = every selector must name a file: one that names none halts, even when another
 *         selector in the same call matched, so no typed selector is ever dropped
 */
export const getAllTranscriptPaths = async (input: {
  selectors: string[];
  cwd: string;
  env: {
    CLAUDE_CONFIG_DIR: string | null;
    CLAUDE_CODE_SESSION_ID: string | null;
    HOME: string | null;
  };
}): Promise<{
  transcripts: { path: string; chosenBy: TranscriptChosenBy }[];
}> => {
  const roots = getAllClaudeProjectsRoots({ env: input.env, cwd: input.cwd });
  const rootsNamed = asRootsNamed({ roots, env: input.env });
  const selectors = input.selectors.length > 0 ? input.selectors : ['@current'];

  // look up every selector concurrently; Promise.all keeps the selector order
  const found = (
    await Promise.all(
      selectors.map((selector) =>
        asPathsFromSelector({ selector, roots, rootsNamed, ...input }),
      ),
    )
  ).flat();

  // keep one entry per path: the first selector that named it decides its chosen-by
  return {
    transcripts: asGroupsByKey({
      items: found,
      keyOf: (entry) => entry.path,
    }).map((group) => group[0]!),
  };
};

/**
 * .what = the files one selector names; at least one, or a halt that names the selector
 * .why = each selector form has its own lookup and its own failure
 */
const asPathsFromSelector = async (input: {
  selector: string;
  roots: string[];
  rootsNamed: string[];
  cwd: string;
  env: { CLAUDE_CODE_SESSION_ID: string | null; HOME: string | null };
}): Promise<{ path: string; chosenBy: TranscriptChosenBy }[]> => {
  const selector = asHomeExpanded({ value: input.selector, env: input.env });
  const kind = asTranscriptSelectorKind({ selector });

  // @current: the harness's session id, else the newest transcript of this cwd
  if (kind === 'current') {
    const sessionId = input.env.CLAUDE_CODE_SESSION_ID?.trim() || null;
    if (sessionId)
      return [
        {
          path: getPathByUuid({ uuid: sessionId, ...input }),
          chosenBy: 'session-id',
        },
      ];
    return [{ path: getNewestPathForCwd(input), chosenBy: 'mtime' }];
  }

  // a bare uuid: look it up under the roots
  if (kind === 'uuid')
    return [
      { path: getPathByUuid({ uuid: selector, ...input }), chosenBy: 'uuid' },
    ];

  // a glob: every matched transcript, subagents excluded; no match names the glob
  if (kind === 'glob') {
    const matches = (
      await enumFilesFromGlob({
        glob: selector,
        cwd: input.cwd,
        dot: true,
        ignore: ['**/node_modules/**', '**/subagents/**'],
      })
    )
      .filter((match) => match.endsWith('.jsonl'))
      .sort();
    if (matches.length === 0)
      throw new BadRequestError('transcript glob matched no file', {
        selector: input.selector,
        cwd: input.cwd,
        hint: 'check the glob, and quote it so the shell passes it whole',
      });
    return matches.map((match) => ({ path: match, chosenBy: 'glob' as const }));
  }

  // a path: it must exist. the roots are not named here — a path is never looked up under
  // them, and a halt names only the roots it searched, each with its `(0 matches)`
  const absolute = path.isAbsolute(selector)
    ? selector
    : path.join(input.cwd, selector);
  if (!fs.existsSync(absolute))
    throw new BadRequestError('transcript not found', {
      selector: input.selector,
      path: absolute,
      hint: 'pass a path that exists, a session uuid, or a glob',
      hintRun: 'rhx reflect.on.token.spend --from <path-to/….jsonl>',
    });

  // a directory is not a transcript: name the glob that reads the files inside it
  if (fs.statSync(absolute).isDirectory())
    throw new BadRequestError('transcript path is a directory', {
      selector: input.selector,
      path: absolute,
      hint: 'pass one .jsonl file, or a quoted glob over the dir',
      hintRun: `rhx reflect.on.token.spend --from '${path.join(input.selector, '*.jsonl')}'`,
    });
  return [{ path: absolute, chosenBy: 'path' }];
};

/**
 * .what = the one transcript a session uuid names under the roots
 * .why = a uuid absent from every root, or present under two, must halt and say where
 *        it looked — never pick one silently
 */
const getPathByUuid = (input: {
  uuid: string;
  roots: string[];
  rootsNamed: string[];
}): string => {
  const matches = input.roots.flatMap((root) => {
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .map((slug) => path.join(root, slug, `${input.uuid}.jsonl`))
      .filter((candidate) => fs.existsSync(candidate));
  });
  if (matches.length === 0)
    throw new BadRequestError('transcript not found', {
      uuid: input.uuid,
      roots: asRootsWithNoMatch({ rootsNamed: input.rootsNamed }),
      hint: 'check the uuid, or pass the transcript path directly',
      hintRun: `rhx reflect.on.token.spend --from <path-to/${input.uuid}.jsonl>`,
    });
  if (matches.length > 1)
    throw new BadRequestError('transcript uuid is ambiguous', {
      uuid: input.uuid,
      matches,
      hint: 'pass the path of the one you mean',
    });
  return matches[0]!;
};

/**
 * .what = the newest transcript under this cwd's project dir, across the roots
 * .why = the fallback for `@current` when the harness exports no session id
 */
const getNewestPathForCwd = (input: {
  cwd: string;
  roots: string[];
  rootsNamed: string[];
}): string => {
  const slug = computeProjectSlug({ cwd: input.cwd });
  const candidates = input.roots.flatMap((root) => {
    const dir = path.join(root, slug);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.jsonl'))
      .flatMap((name) => {
        // a file removed between the list and the stat is no longer a candidate
        const file = path.join(dir, name);
        const stat = fs.statSync(file, { throwIfNoEntry: false });
        return stat ? [{ file, mtime: stat.mtimeMs }] : [];
      });
  });

  // newest by mtime; an equal mtime falls to the path, so one input always picks one file
  const newest = [...candidates].sort(
    (a, b) => b.mtime - a.mtime || compareStrings(a.file, b.file),
  )[0];
  if (!newest)
    throw new BadRequestError('no transcript for this directory', {
      cwd: input.cwd,
      slug,
      roots: asRootsWithNoMatch({ rootsNamed: input.rootsNamed }),
      hint: 'pass a path, a session uuid, or a glob',
    });
  return newest.file;
};

/**
 * .what = the roots as a halt names them, the unset `$CLAUDE_CONFIG_DIR` root included
 * .why = a clone's transcripts live under its `$CLAUDE_CONFIG_DIR`; when that var is unset,
 *        a halt that lists only `~/.claude/projects` reads as "that is everywhere I looked"
 */
const asRootsNamed = (input: {
  roots: string[];
  env: { CLAUDE_CONFIG_DIR: string | null };
}): string[] => {
  const isConfigUnset = !input.env.CLAUDE_CONFIG_DIR?.trim();
  return isConfigUnset
    ? ['$CLAUDE_CONFIG_DIR/projects (unset)', ...input.roots]
    : input.roots;
};

/**
 * .what = each searched root with its match count, for a halt that found naught
 * .why = a list of bare paths does not say whether a root was read and empty, or never read;
 *        `(0 matches)` says it was searched, and `(unset)` says it could not be
 */
const asRootsWithNoMatch = (input: { rootsNamed: string[] }): string[] =>
  input.rootsNamed.map((root) =>
    root.endsWith('(unset)') ? root : `${root} (0 matches)`,
  );

/**
 * .what = expands a `~/` prefix to the home directory
 * .why = a human writes `~/.claude/...`; a quoted selector reaches us unexpanded
 * .note = an unset `$HOME` falls back to the os home, as the roots lookup does, so a
 *         `~/` never turns into a path relative to the cwd
 */
const asHomeExpanded = (input: {
  value: string;
  env: { HOME: string | null };
}): string => {
  if (!input.value.startsWith('~/')) return input.value;
  return path.join(input.env.HOME ?? os.homedir(), input.value.slice(2));
};
