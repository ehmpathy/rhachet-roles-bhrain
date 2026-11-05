import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type {
  TokenSpendReport,
  TokenSpendSkip,
} from '@src/domain.objects/Reflector/TokenSpendReport';
import type { TranscriptCall } from '@src/domain.objects/Reflector/TranscriptCall';
import { asSubagentParentUuid } from '@src/domain.operations/transcript/asSubagentParentUuid';
import { getAllSubagentPaths } from '@src/domain.operations/transcript/getAllSubagentPaths';

import { asErrorFacts } from './asErrorFacts';
import { asTokenSpendCorpus } from './asTokenSpendCorpus';
import { asTokenSpendOfTranscript } from './asTokenSpendOfTranscript';
import { getAllInSequence } from './getAllInSequence';
import { getAllTokenRatesByModel } from './getAllTokenRatesByModel';
import { getAllTranscriptCallsFromFile } from './getAllTranscriptCallsFromFile';
import { getAllTranscriptPaths } from './getAllTranscriptPaths';

/**
 * .what = one transcript read whole: its calls, and its subagents' calls
 */
interface TranscriptRead {
  path: string;
  chosenBy: string;
  subagentOf: string | null;
  calls: TranscriptCall[];
  partialLinesSkipped: number;
  subagents: { path: string; calls: TranscriptCall[] }[];
}

/**
 * .what = the token spend report for the transcripts a set of `--from` selectors names
 * .why = the one entry point of `reflect.on.token.spend`: find the files, read their
 *        calls, price them at their models' specs, and report where the tokens went
 *
 * .note = one transcript: no metered call is a constraint (exit 2); a torn mid-file line
 *         is a malfunction (exit 1)
 * .note = a corpus (two or more files, or any glob): such a file is skipped and named; only an
 *         all-skipped corpus halts
 */
export const getOneTokenSpendReport = async (input: {
  selectors: string[];
  cwd: string;
  env: {
    CLAUDE_CONFIG_DIR: string | null;
    CLAUDE_CODE_SESSION_ID: string | null;
    HOME: string | null;
  };
}): Promise<TokenSpendReport> => {
  const { transcripts } = await getAllTranscriptPaths(input);
  const isCorpus = isTranscriptCorpus({ transcripts });

  // read each transcript, one at a time; in a corpus a constraint skips the file, never halts
  const outcomes = await getAllInSequence({
    items: transcripts,
    step: (transcript) => getTranscriptReadOrSkip({ ...transcript, isCorpus }),
  });
  const { read, skipped } = asReadsAndSkips({ outcomes });

  // an all-skipped corpus has naught to report
  if (read.length === 0) throw asErrorForAllSkipped({ skipped });

  // price every model named, from one discovery of the installed brain specs
  const ratesByModel = await getAllTokenRatesByModel({
    models: asModelsOfReads({ read }),
  });

  // report each transcript, then sum the corpus
  const reports = read.map((entry) =>
    asTokenSpendOfTranscript({ ...entry, ratesByModel }),
  );
  return asTokenSpendCorpus({ reports, skipped });
};

/**
 * .what = whether the selectors asked for a corpus: more than one file, or any glob
 * .why = a glob asks for a corpus whatever it matches today, so its failure contract must not
 *        flip between halt and skip as the count of files on disk moves between one and two
 */
const isTranscriptCorpus = (input: {
  transcripts: { chosenBy: string }[];
}): boolean =>
  input.transcripts.length > 1 ||
  input.transcripts.some((transcript) => transcript.chosenBy === 'glob');

/**
 * .what = one transcript read, or — in a corpus — the skip that names why it could not be
 * .why = a corpus names a bad file and goes on; a lone transcript halts on it
 */
const getTranscriptReadOrSkip = async (input: {
  path: string;
  chosenBy: string;
  isCorpus: boolean;
}): Promise<{ read: TranscriptRead } | { skip: TokenSpendSkip }> => {
  try {
    return { read: await getTranscriptRead(input) };
  } catch (error) {
    if (!input.isCorpus) throw error;
    if (error instanceof UnexpectedCodePathError)
      return { skip: asSkip({ path: input.path, kind: 'malformed', error }) };
    if (error instanceof BadRequestError)
      return { skip: asSkip({ path: input.path, kind: 'unmetered', error }) };
    throw error;
  }
};

/**
 * .what = the outcomes parted into the transcripts read and the files skipped, in order
 * .why = the read ones are reported; the skipped ones are named beside the report
 */
const asReadsAndSkips = (input: {
  outcomes: ({ read: TranscriptRead } | { skip: TokenSpendSkip })[];
}): { read: TranscriptRead[]; skipped: TokenSpendSkip[] } => ({
  read: input.outcomes.flatMap((outcome) =>
    'read' in outcome ? [outcome.read] : [],
  ),
  skipped: input.outcomes.flatMap((outcome) =>
    'skip' in outcome ? [outcome.skip] : [],
  ),
});

/**
 * .what = one transcript's calls, and its subagents' calls
 * .why = a subagent file passed by its own path is its own thread, and names its parent;
 *        a main transcript with no metered call has naught to report, and says why
 */
const getTranscriptRead = async (input: {
  path: string;
  chosenBy: string;
}): Promise<TranscriptRead> => {
  const subagentOf = asSubagentParentUuid({ path: input.path });
  const main = await getAllTranscriptCallsFromFile({
    path: input.path,
    thread: subagentOf === null ? 'main' : 'subagent',
  });
  if (main.calls.length === 0)
    throw new BadRequestError('transcript holds no metered calls', {
      path: input.path,
      records: `${main.records} (${main.recordsWithSpend} assistant records with message.usage)`,
      why: 'a fixture, or a session that crashed before its first reply, has no usage to read',
      hint: 'point at another transcript',
      hintRun: 'rhx reflect.on.token.spend --from <path-to-another.jsonl>',
      or: 'read the whole dir as a corpus, which skips such a file',
      orRun: `rhx reflect.on.token.spend --from '${path.dirname(input.path)}/*.jsonl'`,
    });
  const subagentReads = await getAllInSequence({
    items: getAllSubagentPaths({ path: input.path }),
    step: (subagentPath) =>
      getAllTranscriptCallsFromFile({ path: subagentPath, thread: 'subagent' }),
  });

  // a live subagent's half-written tail is as real as the main file's, so both are counted
  const partialLinesSkipped = subagentReads.reduce(
    (sum, subagent) => sum + subagent.partialLinesSkipped,
    main.partialLinesSkipped,
  );
  return {
    path: input.path,
    chosenBy: input.chosenBy,
    subagentOf,
    calls: main.calls,
    partialLinesSkipped,
    subagents: subagentReads.map((subagent) => ({
      path: subagent.path,
      calls: subagent.calls,
    })),
  };
};

/**
 * .what = a corpus skip from the error that caused it: the file at fault, the bare cause,
 *         and the torn line
 * .why = the skipped section names where to look; the line is what a human opens
 *
 * .note = the file at fault is the one the error names — a torn subagent file fails its
 *         parent's read, and the line it names sits in the subagent, never the parent
 */
const asSkip = (input: {
  path: string;
  kind: TokenSpendSkip['kind'];
  error: BadRequestError | UnexpectedCodePathError;
}): TokenSpendSkip => {
  const { message, facts } = asErrorFacts({ error: input.error });
  const line = facts?.line;
  const pathAtFault = facts?.path;
  return {
    path: typeof pathAtFault === 'string' ? pathAtFault : input.path,
    kind: input.kind,
    reason: message,
    line: typeof line === 'string' ? line : null,
  };
};

/**
 * .what = the halt for a corpus where no file could be read
 * .why = all-malformed is a malfunction of the files; any file with no usage is a
 *        constraint the caller can repoint
 */
const asErrorForAllSkipped = (input: {
  skipped: TokenSpendSkip[];
}): BadRequestError | UnexpectedCodePathError => {
  const isAllMalformed = input.skipped.every(
    (entry) => entry.kind === 'malformed',
  );
  // the key is `matched`, so the leaf renders `matched = N · metered = 0 · skipped = N` — the
  // same line the corpus header shows, never a chain of `=`
  const details = {
    matched: `${input.skipped.length} · metered = 0 · skipped = ${input.skipped.length}`,
    skipped: input.skipped.map((entry) =>
      [
        entry.path,
        entry.line ? `@ line ${entry.line}` : null,
        `(${entry.reason})`,
      ]
        .filter((part) => part !== null)
        .join(' '),
    ),
    hint: asHintForAllSkipped({ skipped: input.skipped }),
  };
  if (isAllMalformed)
    return new UnexpectedCodePathError('no transcript could be read', details);
  return new BadRequestError('no transcript could be read', details);
};

/**
 * .what = the fix an all-skipped corpus names, by the kinds of skip it holds
 * .why = a torn file needs a re-copy and an unmetered file needs a repoint; a corpus that
 *        holds both must name both, or the human repoints a file that is merely torn
 */
const asHintForAllSkipped = (input: { skipped: TokenSpendSkip[] }): string => {
  const hasMalformed = input.skipped.some(
    (entry) => entry.kind === 'malformed',
  );
  const hasUnmetered = input.skipped.some(
    (entry) => entry.kind === 'unmetered',
  );
  if (hasMalformed && hasUnmetered)
    return 're-copy each malformed file from its source, and point past each unmetered one';
  if (hasMalformed)
    return 're-copy the files from their source; each one is torn mid-file';
  return 'point at transcripts with metered calls';
};

/**
 * .what = every model named across the reads, main threads and subagents alike
 * .why = the rates are discovered once, for every model a call was billed under
 */
const asModelsOfReads = (input: { read: TranscriptRead[] }): string[] => [
  ...new Set(
    input.read.flatMap((entry) => [
      ...entry.calls.map((call) => call.model),
      ...entry.subagents.flatMap((subagent) =>
        subagent.calls.map((call) => call.model),
      ),
    ]),
  ),
];
