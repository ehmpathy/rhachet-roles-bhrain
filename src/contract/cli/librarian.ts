/**
 * .what = cli entrypoint for the librarian skills that read a glob set of briefs:
 *         census.minpeer, census.cues, brief.min.moveout
 * .why = enables shell invocation via package-level import, isolated on its own cli subpath so
 *        a skill loads minimal modules (see rule.require.isolated-cli-subpath-exports). the logic
 *        lives in `domain.operations/librarian` as pure transformers; this file reads and writes
 *        files, then renders the report
 */
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { getOwnInvocationArgs } from '@src/domain.operations/cli/getOwnInvocationArgs';
import { asBriefCueCensus } from '@src/domain.operations/librarian/asBriefCueCensus';
import { asLibrarianCliArgs } from '@src/domain.operations/librarian/asLibrarianCliArgs';
import { asLibrarianHelpLines } from '@src/domain.operations/librarian/asLibrarianHelpLines';
import { asMinLinesAbsentFromPeer } from '@src/domain.operations/librarian/asMinLinesAbsentFromPeer';
import { asMinWithWhySectionsMoved } from '@src/domain.operations/librarian/asMinWithWhySectionsMoved';
import { getAllFilesFromGlobs } from '@src/domain.operations/librarian/getAllFilesFromGlobs';
import type { LibrarianCommand } from '@src/domain.operations/librarian/LIBRARIAN_COMMANDS';

import { asArgvSpaced } from './asArgvSpaced';
import { asConstraintErrorHeader } from './asConstraintErrorHeader';

type LibrarianCliArgs = ReturnType<typeof asLibrarianCliArgs>;

/**
 * .what = read one file as utf8 text (communicator: raw i/o)
 */
const readText = async (input: { file: string }): Promise<string> =>
  fs.readFile(input.file, 'utf8');

/**
 * .what = whether a path is itself a symlink, not merely one that resolves
 * .why = a symlinked min is edited where its source lives, so a move skips it
 */
const isSymlink = async (input: { file: string }): Promise<boolean> =>
  (await fs.lstat(input.file)).isSymbolicLink();

/**
 * .what = the `.md` peer path of a `.md.min` path
 */
const asPeerPath = (input: { file: string }): string =>
  input.file.replace(/\.min$/, '');

/**
 * .what = the `.md.min` files of a glob set
 * .why = the min commands read only mins, and a set of other files is no input to them
 */
const getAllMinFilesFromGlobs = async (input: {
  globs: string[];
}): Promise<string[]> =>
  (await getAllFilesFromGlobs({ globs: input.globs })).filter((file) =>
    file.endsWith('.md.min'),
  );

/**
 * .what = run one librarian command: parse the own args, render help or the report, refuse bad input
 * .why = the three commands share one lifecycle, so the help short-circuit and the exit-2 render of a
 *        caller error live in one place
 *
 * .note = a caller error exits 2 via `process.exitCode`, never `process.exit`: an exit truncates
 *         stdout that a pipe has not drained. any other throw propagates to the wrapper's backstop
 */
const runLibrarianCommand = async (input: {
  command: LibrarianCommand;
  run: (args: LibrarianCliArgs) => Promise<string[]>;
}): Promise<void> => {
  try {
    const args = asLibrarianCliArgs({
      args: asArgvSpaced({ args: getOwnInvocationArgs(process.argv) }),
      command: input.command,
    });

    // --help: print usage, exit 0, never read a file
    if (args.wantHelp) {
      console.log(asLibrarianHelpLines({ command: input.command }).join('\n'));
      return;
    }

    // run the command, then print its lines
    const lines = await input.run(args);
    if (lines.length > 0) console.log(lines.join('\n'));
  } catch (error) {
    if (!(error instanceof BadRequestError)) throw error;
    console.error(asConstraintErrorHeader({ error }));
    process.exitCode = 2;
  }
};

/**
 * .what = the branch glyph of a row in a list: `├─` for each but the last, `└─` for the last
 */
const asBranch = (input: { index: number; count: number }): string =>
  input.index === input.count - 1 ? '└─' : '├─';

/**
 * .what = the lines of a tree: the owl vibe line, a blank, a librarian root, then its leaves
 * .why = one render for all three reports (rule.require.stdout-is-treestruct), so the form cannot drift
 */
const asTreeLines = (input: {
  vibe: string;
  root: string;
  leaves: string[];
}): string[] => [
  `🦉 ${input.vibe}`,
  '',
  `📚 ${input.root}`,
  ...input.leaves.map(
    (leaf, index) =>
      `   ${asBranch({ index, count: input.leaves.length })} ${leaf}`,
  ),
];

/**
 * .what = census.minpeer — the lines of each min that its `.md` peer lacks
 * .why = a line may leave a min only if its `.md` still carries it; the answer is a set
 *        membership, so it is computed, never guessed
 *
 * exits 0 on a report (it never gates), 2 on bad input
 */
export const censusMinpeer = async (): Promise<void> =>
  runLibrarianCommand({
    command: 'census.minpeer',
    run: async (args) => {
      const files = await getAllMinFilesFromGlobs({ globs: args.globs });
      const censuses = await Promise.all(
        files.map(
          async (
            file,
          ): Promise<{
            file: string;
            hasPeer: boolean;
            total: number;
            absent: string[];
          }> => {
            const peer = asPeerPath({ file });
            if (!existsSync(peer))
              return { file, hasPeer: false, total: 0, absent: [] };
            const census = asMinLinesAbsentFromPeer({
              minText: await readText({ file }),
              peerText: await readText({ file: peer }),
            });
            return { file, hasPeer: true, ...census };
          },
        ),
      );

      // emit mode: one absent line per row, prefixed by its min, for a diff
      if (args.wantEmit)
        return censuses.flatMap((census) => [
          ...(census.hasPeer ? [] : [`${census.file}\t<no .md peer>`]),
          ...census.absent.map((line) => `${census.file}\t${line}`),
        ]);

      // report mode: a row per min (optional), then the total
      const totalLines = censuses.reduce(
        (sum, census) => sum + census.total,
        0,
      );
      const totalAbsent = censuses.reduce(
        (sum, census) => sum + census.absent.length,
        0,
      );
      const rows = args.wantFiles
        ? censuses.map(
            (census) =>
              `${
                census.hasPeer
                  ? `${String(census.absent.length).padStart(3)} / ${String(census.total).padStart(3)} absent`
                  : 'no .md peer   '
              }  ${path.basename(census.file)}`,
          )
        : [];
      return asTreeLines({
        vibe: 'census.minpeer — min lines absent from the .md beside them',
        root: `census.minpeer (${files.length} mins)`,
        leaves: [
          ...rows,
          `total: ${totalAbsent} of ${totalLines} min lines absent from their .md`,
        ],
      });
    },
  });

/**
 * .what = the estimate of tokens a count of chars costs, as chars/4 with a thousands separator
 */
const asTokens = (input: { chars: number }): string =>
  Math.round(input.chars / 4).toLocaleString('en-US');

/**
 * .what = the share of a whole a part makes, as a rounded percent
 */
const asShare = (input: { part: number; whole: number }): string =>
  input.whole === 0 ? '0%' : `${Math.round((100 * input.part) / input.whole)}%`;

/**
 * .what = census.cues — the cue share of each brief in a glob set
 * .why = `rule.prefer.rules-that-refout` says a rule keeps its cue at say and refs out its
 *        argument. `--emit` lists every cue line so a census taken before a rewrite and one
 *        taken after can be diffed, and a dropped line is named
 *
 * exits 0 on a report (it never gates), 2 on bad input
 */
export const censusCues = async (): Promise<void> =>
  runLibrarianCommand({
    command: 'census.cues',
    run: async (args) => {
      const files = await getAllFilesFromGlobs({ globs: args.globs });
      const censuses = await Promise.all(
        files.map(async (file) => ({
          file,
          ...asBriefCueCensus({ text: await readText({ file }) }),
        })),
      );

      // emit mode: one cue line per row, prefixed by its file, for a before/after diff
      if (args.wantEmit)
        return censuses.flatMap((census) =>
          census.cueLines.map((line) => `${census.file}\t${line.trim()}`),
        );

      // report mode: a row per file (optional), then the total
      const totalCue = censuses.reduce(
        (sum, census) => sum + census.cueChars,
        0,
      );
      const totalArg = censuses.reduce(
        (sum, census) => sum + census.argChars,
        0,
      );
      const rows = args.wantFiles
        ? censuses.map(
            (census) =>
              `cue ${asShare({ part: census.cueChars, whole: census.cueChars + census.argChars }).padStart(4)} · ` +
              `~${asTokens({ chars: census.cueChars })} cue / ~${asTokens({ chars: census.cueChars + census.argChars })} all  ` +
              `${path.basename(census.file)}`,
          )
        : [];
      return asTreeLines({
        vibe: 'census.cues — cue vs argument, per rule.prefer.rules-that-refout',
        root: `census.cues (${files.length} files, ~tokens = chars/4, an estimate)`,
        leaves: [
          ...rows,
          `total: cue ${asShare({ part: totalCue, whole: totalCue + totalArg })} · ~${asTokens({ chars: totalCue })} cue ` +
            `+ ~${asTokens({ chars: totalArg })} argument = ~${asTokens({ chars: totalCue + totalArg })}`,
        ],
      });
    },
  });

/**
 * .what = brief.min.moveout — move the `.why` sections of a glob set of mins out to the `.md` beside each
 * .why = a min that keeps a `.why` section pays it on every boot; the `.md` already holds the
 *        full argument, so the section is moved, never lost. plan lists each section; apply
 *        rewrites each min and leaves each `.md` untouched
 *
 * a symlinked min is skipped, and so is a min with no `.md` beside it
 * exits 0 on success, 2 on bad input
 */
export const briefMinMoveout = async (): Promise<void> =>
  runLibrarianCommand({
    command: 'brief.min.moveout',
    run: async (args) => {
      const files = await getAllMinFilesFromGlobs({ globs: args.globs });
      const verb = args.mode === 'apply' ? 'moved' : 'would move';

      // one pass per min, in order; a skipped min yields no row
      const outcomes = await Promise.all(
        files.map(async (file) => {
          const peer = asPeerPath({ file });
          if (await isSymlink({ file })) return null;
          if (!existsSync(peer)) return null;
          const moved = asMinWithWhySectionsMoved({
            minText: await readText({ file }),
            mdText: await readText({ file: peer }),
          });

          // apply rewrites the min only; the .md is the source the move leans on
          if (args.mode === 'apply' && moved.sectionsMoved.length > 0)
            await fs.writeFile(file, moved.textNext);
          return { file, ...moved };
        }),
      );
      const judged = outcomes.flatMap((outcome) => (outcome ? [outcome] : []));
      const rows = judged.flatMap((outcome) => [
        ...outcome.sectionsMoved.map(
          (section) =>
            `${verb}  ${outcome.file}  ${section.header}  (${section.lineCount} lines)`,
        ),
        ...outcome.sectionsHeld.map(
          (section) =>
            `held (${section.reason})  ${outcome.file}  ${section.header}`,
        ),
      ]);
      const countMoved = judged.reduce(
        (sum, outcome) => sum + outcome.sectionsMoved.length,
        0,
      );
      const countHeld = judged.reduce(
        (sum, outcome) => sum + outcome.sectionsHeld.length,
        0,
      );
      return asTreeLines({
        vibe: 'brief.min.moveout — the argument goes to the .md, the cue stays',
        root: `brief.min.moveout (${args.mode}, ${files.length} mins)`,
        leaves: [...rows, `${verb} ${countMoved} sections · held ${countHeld}`],
      });
    },
  });
