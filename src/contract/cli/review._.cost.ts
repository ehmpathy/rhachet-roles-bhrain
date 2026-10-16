import * as path from 'path';

import { FLAGS_OF_DISPATCHER } from '@src/contract/cli/FLAGS_OF_DISPATCHER';
import { IS_CACHEABLE_SECTION } from '@src/domain.objects/Reviewer/PromptSectionChars';
import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneRefusalOfAtPath } from '@src/domain.operations/review/getOneRefusalOfAtPath';
import { getOneReviewedTreeAbove } from '@src/domain.operations/review/getOneReviewedTreeAbove';
import { getOneReviewedTreeAtOrAbove } from '@src/domain.operations/review/getOneReviewedTreeAtOrAbove';
import { genReviewGroveProgressLine } from '@src/domain.operations/review/grove/genReviewGroveProgressLine';
import { genReviewGroveReport } from '@src/domain.operations/review/grove/genReviewGroveReport';
import { genReviewGroveStdout } from '@src/domain.operations/review/grove/genReviewGroveStdout';
import { isReviewRunDir } from '@src/domain.operations/review/isReviewRunDir';
import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import { genReviewMeterReport } from '@src/domain.operations/review/meter/genReviewMeterReport';
import { genReviewMeterStdout } from '@src/domain.operations/review/meter/genReviewMeterStdout';
import { genReviewRunStdout } from '@src/domain.operations/review/meter/genReviewRunStdout';
import { getAllReviewRunMeters } from '@src/domain.operations/review/meter/getAllReviewRunMeters';
import { getOnePrefixCensusOfRuns } from '@src/domain.operations/review/meter/getOnePrefixCensusOfRuns';
import { getOnePrefixPairOfRun } from '@src/domain.operations/review/meter/getOnePrefixPairOfRun';
import { getOneReviewRunMeterAt } from '@src/domain.operations/review/meter/getOneReviewRunMeterAt';
import { getOneTargetSplitOfRunMeter } from '@src/domain.operations/review/meter/getOneTargetSplitOfRunMeter';
import { getAllReviewerLevels } from '@src/domain.operations/route/guard/getAllReviewerLevels';
import { asCountedNoun } from '@src/utils/asCountedNoun';
import { asShellSingleQuoted } from '@src/utils/asShellSingleQuoted';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

import { asArgvSpaced } from './asArgvSpaced';

/**
 * .what = the positions of the `breadth` axis — how far a figure reaches
 * .why = a closed set, so a typo is caught at parse with the valid set shown rather
 *        than handled by a message after the fact (rule.prefer.prevent-over-correct)
 */
const BREADTHS = ['run', 'tree', 'grove'] as const;
type Breadth = (typeof BREADTHS)[number];

/**
 * .what = tells whether a raw string names a breadth position
 * .why = narrows at the boundary, so the dispatch below is total over the union
 */
const isBreadth = (input: string | null): input is Breadth =>
  input !== null && (BREADTHS as readonly string[]).includes(input);

/**
 * .what = the words this command USED to answer to, and what each became
 * .why = a retired name is not a typo, and the two must not be refused alike.
 *        a human who types `--of fleet` made no guess — they repeated a word
 *        this repo taught them, and a bare "not a breadth · valid: run | tree |
 *        grove" leaves them to infer WHICH of the three replaced it.
 *
 *        the inference is not free: `fleet` → `grove` is a rename of one axis
 *        position, but `meter` → `tree` is a rename that ALSO dropped a breadth
 *        out of the name entirely, and `corpus` names a tool that was deleted
 *        rather than renamed. three different answers behind one error message.
 *
 *        an error names the fix, never merely the symptom
 *        (rule.require.errors-name-the-fix).
 */
const RETIRED_BREADTHS: Record<string, string> = {
  fleet: 'renamed to `grove` — a fleet is ships; a grove is what holds trees',
  meter: 'renamed to `tree` — the breadth is now an axis position, not a name',
  corpus:
    'deleted — it ESTIMATED a prompt we no longer send. `--of run` measures one',
};

/**
 * .what = the `was:` line for a breadth word this repo once answered to, or none
 * .why = the `--of` refusal spread a ternary inline to decide whether the line
 *        appears, which a reader had to simulate (`rule.forbid.inline-decode-friction`)
 */
const asRetiredBreadthLines = (input: { of: string | null }): string[] => {
  const was = input.of === null ? undefined : RETIRED_BREADTHS[input.of];
  if (was === undefined) return [];
  return [`   ├─ was:   ${was}`];
};

/**
 * .what = what each breadth position answers, in one sentence, from one source
 * .why = two surfaces describe the axis — `--help` and the `--of` refusal. both read
 *        this table, so a driver who types a bad `--of` reads the same axis `--help`
 *        documents; two literals would drift apart where no test could see it
 *        (rule.require.single-source-of-truth-for-render)
 */
const DESCRIPTION_OF_BREADTH: Record<Breadth, string> = {
  run: 'ONE review invocation — its cost AND what its prompt was made of',
  tree: "this worktree's review history, rolled up by reviewer, level, stone, round",
  grove:
    'every tree on this machine, rolled up by tree, route, stone, reviewer',
};

/**
 * .what = renders one line per position on the `--of` axis, in the shape the
 *         caller's surface asks for
 * .why = the block is DERIVED from `BREADTHS` + `DESCRIPTION_OF_BREADTH`, never
 *        re-typed — which is what stops the axis drift the note above records.
 *        `--help` and the refusal render the SAME axis, so they read ONE builder
 *        and differ only in the label each surface prints
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = the label column is padded to the widest label this call renders plus
 *         a gutter, never to a hand-typed width. a longer position added to
 *         `BREADTHS` widens both surfaces at once, so they cannot part.
 */
const getAllAxisLines = (input: {
  /** the prefix each row opens with — an indent, a branch glyph */
  prefix: string;
  /** the label a position reads as on this surface */
  label: (breadth: Breadth) => string;
  /** the spaces between the widest label and its description */
  gutter: number;
}): string[] => {
  const widthOfLabel = Math.max(
    ...BREADTHS.map((one) => input.label(one).length),
  );
  return BREADTHS.map(
    (breadth) =>
      `${input.prefix}${input.label(breadth).padEnd(widthOfLabel + input.gutter)}${DESCRIPTION_OF_BREADTH[breadth]}`,
  );
};

/**
 * .what = prints usage
 * .why = a command must explain itself on demand (rule.require.help-on-demand)
 */
const printHelp = (): void => {
  const axis = getAllAxisLines({
    prefix: '    ',
    label: (breadth) => `--of ${breadth}`,
    gutter: 3,
  }).join('\n');

  console.log(`
🦉 review._.cost — what review cost, at the breadth you ask for

  usage
    rhx review._.cost --of run       [--at <tree|rundir>] [--json]
    rhx review._.cost --of tree      [--at <dir>] [--json | --trace]
    rhx review._.cost --of grove     [--at <dir>] [--json | --limit <n>]

  the axis
${axis}

  inputs
    --of <breadth>  required, one of ${BREADTHS.join(' | ')}
    --at <dir>      where to read — cwd for run and tree, the parent of cwd for grove;
                    run also takes one run's log dir
    --limit <n>     rows per axis — grove only, not with --json, default 15
    --trace         add the round × reviewer cross-tab — tree only, not with --json
    --json          emit json, not a tree
    --help, -h      show this and exit

  what it reads
    ${DIR_OF_REVIEW_LOGS}/*/
      ├─ input.args.json        the scope the review was given
      ├─ metrics.compiled.json  what the prompt was made of, per named input
      └─ metrics.realized.json  the measured tokens and cost — never an estimate

  each run is graded, at every breadth
    metered   metrics present; every figure measured
    refused   died at validation; nil cost is a fact, reads $0
    unknown   got past validation, metrics absent; reads absent, never $0.00

  a 0.0% cache rate names its cause
    cold (first round)  no prior prompt to share; no act owed
    cold (lapsed Nm)    the prefix aged past the ${MINUTES_OF_CACHE_REACH}-minute reach — a real loss;
                        a shorter pause between rounds holds it
    warm               a repeat within the reach, yet the cache was not read

  by level
    read from the guard as it stands now, so a promoted lane re-files its past runs.
    an unread guard reads "(no level — guard unread)", never L1

  --trace
    the rollups are marginals and hide a step; --trace shows round × reviewer in
    key order (<stone> i<NNN> · <slug>), so a lever's effect reads in sequence

  --of run --at
    a dir whose name leads with an iso stamp is one run; any other dir is a tree,
    and its latest run is read. --of tree and --of grove refuse a run dir

  cache.set 0
    measured, not absent — these brains bill no cache write. it stays in every
    rate's denominator, so a brain that does bill one is not undercounted

  prefix rows — did the cache serve what two rounds shared
    expected   the longest prefix this round shares with its prior round, in tok est.
    cache.get  what the cache served; reach = cache.get / expected
    breaks in  head · tail · whole
    served       the cache read up to the shared prefix
    missed       a prefix was shared, the cache served none — the ttl or the pin
    self-cached  the cache read came from the run's own turns
    over-reach   the cache read past the shared prefix — the instrument is off
    unshared     no prefix shared — the prompt layout broke
    unmeasured   a prompt or a meter is absent
    --of run shows the pair; tree and grove count verdicts. pairs never cross trees

  which input bought this — answered at all three breadths
    --of run     per run, exact, plus the directories each target came from
    --of tree    by input, summed over this tree's runs it could read, unread count beside it
    --of grove   by input, summed over every tree's runs it could read, unread count beside it
    the directory rows sum only the runs that recorded where their target mass came from

  examples
    rhx review._.cost --of run
    rhx review._.cost --of run --at ${DIR_OF_REVIEW_LOGS}/2026-09-23T16-00-00-000Z.pid1.abc
    rhx review._.cost --of tree
    rhx review._.cost --of tree --trace
    rhx review._.cost --of grove --limit 25
    rhx review._.cost --of grove --json
`);
};

/**
 * .what = what argv said about a flag that takes a value — three states, never two
 * .why = `absent` and `valueless` are DIFFERENT FACTS and a `string | null`
 *        return collapses them into one. the collapse is a failhide: `--at` with
 *        no value read as `null`, and `null` fell through `at ?? process.cwd()`
 *        to the default — so `rhx review._.cost --of tree --at` priced the
 *        current directory while the human had plainly asked for another one, and
 *        no line of output said so (rule.forbid.failhide).
 *
 *        an omitted flag means "use the default"; a flag typed with its value
 *        forgotten means "I meant to name one and did not". only the first may
 *        silently default (rule.forbid.unexpected-defaults).
 */
type FlagRead =
  | { state: 'absent' }
  | { state: 'given'; value: string }
  | { state: 'valueless' };

/**
 * .what = reads a value-taking flag from argv, in three states
 * .why = one reader, so the flags cannot drift on how they parse
 *
 * .note = a next token that itself opens with `--` is NOT a value. without that
 *         check `--at --of tree` reads `"--of"` as a directory name, and the
 *         breadth flag is swallowed by the neighbour it was typed beside — which
 *         fails later, elsewhere, and names the wrong cause.
 *
 * .note = an EMPTY value is valueless too. `--at=`, `--at ""`, and `--at "$X"`
 *         with `$X` unset each hand over `''`, and `''` slips past `at ?? cwd`
 *         (`??` replaces only null and undefined) — the same silent default the
 *         three states exist to refuse
 */
const getOneFlagRead = (input: { argv: string[]; flag: string }): FlagRead => {
  const at = input.argv.indexOf(input.flag);
  if (at === -1) return { state: 'absent' };
  const next = input.argv[at + 1];
  if (next === undefined || next === '' || next.startsWith('--'))
    return { state: 'valueless' };
  return { state: 'given', value: next };
};

/**
 * .what = the value a flag carried, or null where none was given
 * .why = one name for the narrow each flag that takes a value needs once its
 *        valueless slip is refused, so the dispatcher reads a value, not a tag check
 */
const asFlagValue = (input: { read: FlagRead }): string | null =>
  input.read.state === 'given' ? input.read.value : null;

/**
 * .what = whether a flag was typed at all, with a value or without one
 * .why = a flag a breadth does not take is refused in both shapes, so the refusals
 *        ask "was it typed?" rather than re-read the three-state tag
 */
const isFlagTyped = (input: { read: FlagRead }): boolean =>
  input.read.state !== 'absent';

/**
 * .what = whether `--at` names one review RUN while the breadth reads many (tree or grove)
 * .why = the three-term guard that sends a run dir to `--of run`, named once
 */
const isRunDirGivenToTreeBreadth = (input: {
  at: string | null;
  of: Breadth;
}): boolean =>
  input.at !== null && input.of !== 'run' && isReviewRunDir({ at: input.at });

/**
 * .what = why a breadth other than `tree` has no two axes for `--trace` to cross
 * .why = the clause the `--trace` refusal prints, keyed by breadth rather than
 *        chosen by a ternary inside the refusal's template
 */
const WHY_NO_CROSS_TAB_OF_BREADTH: Record<Breadth, string> = {
  run: 'it reports a single run',
  // never printed: `tree` takes `--trace`, so no refusal reads this row. declared so
  // the table is total over `Breadth` and the refusal needs no narrow of its own
  tree: 'it crosses round × reviewer, and takes --trace',
  grove: 'it folds every round together',
};

/**
 * .what = why a breadth other than `grove` takes no row bound
 * .why = the clause the `--limit` refusal prints, keyed by breadth. one shared clause
 *        once told a tree reader their report "renders no rollup", which `--help` and the
 *        report itself contradict — a tree DOES roll up, it just renders every row
 */
const WHY_NO_ROW_BOUND_OF_BREADTH: Record<Breadth, string> = {
  run: 'it reports a single run, so it has no rollup rows to bound',
  tree: 'its rollups render every row, since one tree holds few enough lanes and rounds to read whole',
  // never printed: `grove` takes `--limit`, so no refusal reads this row. declared so
  // the table is total over `Breadth`
  grove: 'it bounds each axis to 15 rows, and takes --limit',
};

/**
 * .what = a flag whose acceptance depends on the breadth and on `--json`
 */
type CostFlagScoped = '--trace' | '--limit';

/**
 * .what = which breadth takes each breadth-scoped flag
 * .why = the rule every flag × breadth refusal expresses, declared once as data. as
 *        four hand-written `if` blocks it lived only as control flow, so a fifth flag
 *        or a fourth breadth had to remember each pair, and a missed pair brought back
 *        the accepted-and-inert flag this command refuses (rule.forbid.failhide)
 *
 * .note = both flags are refused beside `--json` as well: the json is the whole
 *         report — every row on every axis, cross-tab or not — so neither flag would
 *         change it
 */
const BREADTH_OF_COST_FLAG: Record<CostFlagScoped, Breadth> = {
  '--trace': 'tree',
  '--limit': 'grove',
};

/**
 * .what = the copy each flag refusal prints, per flag and per refusal shape
 * .why = one place a refusal's words live, keyed by flag, so the transformer that
 *        decides WHICH refusal fires never also spells HOW it reads
 */
const COPY_OF_COST_FLAG_REFUSAL: Record<
  CostFlagScoped,
  {
    whyOfBreadth: (input: { of: Breadth }) => string[];
    takesOfBreadth: string;
    fixOfBreadth: string;
    whyOfJson: string[];
    takesOfJson: string;
    fixOfJson: string;
  }
> = {
  '--trace': {
    whyOfBreadth: ({ of }) => [
      '   ├─ why:   --trace renders the round × reviewer CROSS-TAB, and',
      `   │         --of ${of} crosses no two axes — ${WHY_NO_CROSS_TAB_OF_BREADTH[of]}`,
    ],
    takesOfBreadth: '--of tree [--trace]',
    fixOfBreadth: 'rhx review._.cost --of tree --trace',
    whyOfJson: [
      '   ├─ why:   --trace adds the round × reviewer CROSS-TAB to the tree, and',
      '   │         --json emits the whole report, cross-tab or not',
    ],
    takesOfJson: '--of tree [--trace]  or  --of tree --json',
    fixOfJson: 'rhx review._.cost --of tree --json',
  },
  '--limit': {
    whyOfBreadth: ({ of }) => [
      '   ├─ why:   --limit bounds how many ROLLUP ROWS an axis renders, and',
      `   │         --of ${of} takes no row bound — ${WHY_NO_ROW_BOUND_OF_BREADTH[of]}`,
    ],
    takesOfBreadth: '--of grove [--limit N]',
    fixOfBreadth: 'rhx review._.cost --of grove --limit 25',
    whyOfJson: [
      '   ├─ why:   --limit bounds how many ROLLUP ROWS the grove renders, and',
      '   │         --json emits the whole report, every row on every axis',
    ],
    takesOfJson: '--of grove [--limit N]  or  --of grove --json',
    fixOfJson: 'rhx review._.cost --of grove --json',
  },
};

/**
 * .what = the first flag × breadth (or flag × `--json`) refusal this invocation earns,
 *         or null where every typed flag belongs
 * .why = the one transformer the orchestrator calls, so the four refusals are a walk of
 *        `BREADTH_OF_COST_FLAG` rather than four guards of one shape
 *
 * .note = breadth refusals are checked before json refusals, `--trace` before `--limit`
 *         for the breadth and `--limit` before `--trace` for json — the order the
 *         refusals have always fired in, so an invocation with two faults names the same one
 */
const getOneCostFlagRefusal = (input: {
  of: Breadth;
  json: boolean;
  typed: Record<CostFlagScoped, boolean>;
}): { headline: string; lines: string[] } | null => {
  // a flag typed under a breadth that does not take it
  const flagOffBreadth = (['--trace', '--limit'] as const).find(
    (flag) => input.typed[flag] && BREADTH_OF_COST_FLAG[flag] !== input.of,
  );
  if (flagOffBreadth) {
    const copy = COPY_OF_COST_FLAG_REFUSAL[flagOffBreadth];
    return {
      headline: `${flagOffBreadth} is not a flag "--of ${input.of}" takes`,
      lines: [
        ...copy.whyOfBreadth({ of: input.of }),
        `   ├─ takes: ${copy.takesOfBreadth}`,
        `   └─ fix:   ${copy.fixOfBreadth}`,
      ],
    };
  }

  // a flag typed beside `--json`, which emits the whole report regardless
  const flagBesideJson = input.json
    ? (['--limit', '--trace'] as const).find((flag) => input.typed[flag])
    : undefined;
  if (flagBesideJson) {
    const copy = COPY_OF_COST_FLAG_REFUSAL[flagBesideJson];
    return {
      headline: `${flagBesideJson} is not a flag --json takes`,
      lines: [
        ...copy.whyOfJson,
        `   ├─ takes: ${copy.takesOfJson}`,
        `   └─ fix:   ${copy.fixOfJson}`,
      ],
    };
  }

  return null;
};

/**
 * .what = the grove's row bound: 15 where `--limit` was not given, else the number typed
 * .why = the default and its cast in one place. the result may be NaN or below 1;
 *        `isRowLimitValid` is the guard, so a bad bound is refused, never coerced
 */
const ROW_LIMIT_DEFAULT = 15;
const asRowLimit = (input: { raw: string | null }): number =>
  input.raw === null ? ROW_LIMIT_DEFAULT : Number(input.raw);

/**
 * .what = whether a row bound is a whole number, 1 or greater
 * .why = NaN and a bound below 1 both render an empty grove that is not empty
 */
const isRowLimitValid = (input: { limit: number }): boolean =>
  Number.isInteger(input.limit) && input.limit >= 1;

/**
 * .what = halts on a flag typed with its value forgotten
 * .why = one shape for the three flags, so a malformed input fails the same way
 *        whichever flag carried it — and names the fix rather than the symptom
 *        (rule.require.errors-name-the-fix)
 */
const exitOnValuelessFlag = (input: {
  flag: string;
  expects: string;
  fix: string;
}): never => {
  emitReviewRefusal({
    kind: 'constraint',
    headline: `${input.flag} was given with no value`,
    lines: [
      `   ├─ expects: ${input.expects}`,
      '   ├─ why:     an omitted flag takes its default; a flag typed with its',
      '   │           value forgotten is a slip, and must not read as either',
      `   └─ fix:     ${input.fix}`,
    ],
  });
  process.exit(2);
};

/**
 * .what = the flags this command reads, by name
 * .why = the allowlist an unknown flag is refused against, declared once
 *
 * .note = `skill`, `repo`, `mode` are the outer `rhachet run` dispatcher's own
 *         flags, forwarded verbatim into argv — as `review.ts`'s `FLAGS_KNOWN`
 *         documents. they are tolerated here and read by naught
 */
const FLAGS_KNOWN_OF_COST = new Set([
  'of',
  'at',
  'limit',
  'json',
  'trace',
  'help',
]);
const FLAGS_SHORT_KNOWN_OF_COST = new Set(['-h']);

/**
 * .what = the flags whose value rides in the NEXT token
 * .why = the stray-token walk must know which tokens are values, so a value is
 *        never read as a positional — and `--json foo` still reads `foo` as stray
 */
const FLAGS_VALUED = new Set(['of', 'at', 'limit', ...FLAGS_OF_DISPATCHER]);

/**
 * .what = whether the token at an index is the value a valued flag consumed
 * .why = a value may open with a dash (`--limit -5`), and must be read as that
 *        flag's value — refused there by its own check — never as a flag of its own
 */
const isArgValueOfFlag = (input: {
  argv: string[];
  index: number;
}): boolean => {
  const prior = input.argv[input.index - 1];
  return (
    prior !== undefined &&
    prior.startsWith('--') &&
    FLAGS_VALUED.has(prior.slice(2))
  );
};

/**
 * .what = every token that is neither a flag nor a value a flag consumed
 * .why = this command takes no positional. a stray `tree` (meant as `--of tree`)
 *        was silently dropped, so the run went on without the one word typed
 */
const getAllArgsStray = (input: { argv: string[] }): string[] =>
  input.argv.filter(
    (arg, index) =>
      !arg.startsWith('-') && !isArgValueOfFlag({ argv: input.argv, index }),
  );

/**
 * .what = every flag typed more than once, each named once
 * .why = `getOneFlagRead` reads the FIRST occurrence, so `--of tree --of grove`
 *        ran as `tree` and dropped `grove` with no word. which one the human meant
 *        is theirs to say, never ours to guess
 */
const getAllFlagsRepeated = (input: { argv: string[] }): string[] => {
  const flags = input.argv.filter((arg) => arg.startsWith('--'));
  return [
    ...new Set(flags.filter((flag, index) => flags.indexOf(flag) !== index)),
  ];
};

/**
 * .what = every flag in argv that this command does not read, long or short
 * .why = a misspelled flag is refused by name rather than run as absent. the
 *        short form counts too: `-h` is read, which teaches that short flags are
 *        read, so a typed `-j` must not fall through unremarked
 */
const getAllFlagsUnknown = (input: { argv: string[] }): string[] => {
  const flagsLong = input.argv
    .filter((arg) => arg.startsWith('--') && arg.length > 2)
    .filter((arg) => !FLAGS_KNOWN_OF_COST.has(arg.slice(2)))
    .filter((arg) => !FLAGS_OF_DISPATCHER.has(arg.slice(2)));
  const flagsShort = input.argv.filter(
    (arg, index) =>
      arg.startsWith('-') &&
      !arg.startsWith('--') &&
      arg.length > 1 &&
      !FLAGS_SHORT_KNOWN_OF_COST.has(arg) &&
      !isArgValueOfFlag({ argv: input.argv, index }),
  );
  return [...flagsLong, ...flagsShort];
};

/**
 * .what = reads whether a valueless flag was set
 * .why = the peer of `getOneFlagValue` for the flags that carry no value, so EVERY
 *        flag on this command is read through one of the two — and `argv` is read
 *        in exactly one place, at the dispatcher, rather than re-scanned per branch
 */
const isFlagSet = (input: { argv: string[]; flag: string }): boolean =>
  input.argv.includes(input.flag);

/**
 * .what = refuses a breadth whose corpus holds no run, and names the fix
 * .why = an empty corpus is a FACT, not a fault — but it must name the fix, or a
 *        human reads a silent exit as a broken tool
 *        (rule.require.errors-name-the-fix).
 *
 * .note = folded because all three breadths refused in prose that was identical
 *         but for one word. `emitCostOfRun` said *"no review run to price"* and
 *         `emitCostOfTree` *"no reviews to price"* over byte-identical why/fix/exit
 *         lines — so a repair to one refusal reached two of three, and the third
 *         drifted silently. the same file had already folded `exitOnValuelessFlag`
 *         and `getOneFlagRead` for exactly this reason; the refusals were the one
 *         duplicated shape left unfolded.
 */
const exitOnEmptyCorpus = (input: {
  /** the one-line verdict, minus its glyph */
  header: string;
  /** the `label: value` rows between the header and the why — the breadth's own */
  deets: string[];
  why: string;
  fix: string;
}): never => {
  emitReviewRefusal({
    kind: 'constraint',
    headline: input.header,
    lines: [
      ...input.deets.map((deet) => `   ├─ ${deet}`),
      `   ├─ why: ${input.why}`,
      `   └─ fix: ${input.fix}`,
    ],
  });
  process.exit(2);
};

/**
 * .what = refuses a read the filesystem barred, and names the fix
 * .why = the ONE failure mode in this cli that reached a human as a raw node
 *        stack. every other refusal — an absent `--of`, a valueless flag, an out
 *        of range `--limit`, an empty corpus — emits an owl block and exits 2,
 *        where an unreadable log root threw past every one of them.
 *
 *        an absent log dir is a FACT this command reports on purpose; a BARRED
 *        one is a wall a human must act on. they arrive as the same empty read,
 *        so the pair must answer differently or the wall reads as a fact
 *        (rule.forbid.failhide, rule.require.errors-name-the-fix).
 *
 * .note = the OS's own sentence is the deet, emitted verbatim. it already names
 *         the exact path that was barred, which the walk cannot — a grove read
 *         descends many roots, and the barred one is rarely the root asked for.
 */
const exitOnDeniedRead = (input: { error: unknown }): never => {
  emitReviewRefusal({
    kind: 'constraint',
    headline: 'a directory on the read path is barred',
    lines: [
      `   ├─ os says: ${String(input.error)}`,
      '   ├─ why:     the path IS there and this process may not read it — a',
      '   │           mode bit or an ownership rule refused, not an absent log',
      '   └─ fix:     chmod u+rx <that dir>, or run as its owner',
    ],
  });
  process.exit(2);
};

/**
 * .what = renders one breadth's report, as json or as stdout
 * .why = the json/stdout dispatch was repeated verbatim in all three breadths, so a
 *        change to the shape — a blank line, a `--json` field — had to be made three
 *        times or the surfaces drifted (rule.require.single-source-of-truth-for-render)
 *
 * .note = `stdout` is a THUNK on purpose. the render runs to a page of prose, and
 *         `--json` must never pay for it.
 *
 * .note = `seam` publishes the cacheable/per-round split into the json, spread from
 *         `IS_CACHEABLE_SECTION` itself rather than re-typed here.
 *
 *         the tty renders the seam per row (`cacheable` / `per round`)
 *         and the json carried only chars — so a pipe consumer had to re-declare the
 *         six-key split on their side, and a copied decision drifts. that is this
 *         branch's own top-listed defect: `isTargetDiffSent` bound two of three call
 *         sites and the third drifted until it was deleted.
 *
 *         it sits HERE, once per document, rather than on the report objects: the
 *         seam is STATIC, so a `cacheable: true` per row would serialize one constant
 *         thousands of times and invite a per-row value to diverge from it.
 *
 * .note = `seam` is a LEGEND for the census each breadth ships — `run`
 *         (`run.prompt.sections`), `tree` (`report.inputs.sections`), `grove`
 *         (`inputs.sections`). every breadth attributes chars, so every document carries it
 *
 * .note = the seam keys off the BREADTH, never off the corpus. a `run` whose
 *         artifact was unreadable emits `prompt: null` AND the seam — because the two
 *         say different things: the seam says *this document type attributes chars,
 *         here is how to read them*, and the null says *this one run could not be
 *         read*. to drop the seam there would conflate an unreadable run with a
 *         breadth that never answers the question — the same conflation
 *         `getOneAccountedCost` refuses between `refused` and `unknown`.
 */
const emitReport = (input: {
  json: boolean;
  payload: object;
  stdout: () => string;
}): void => {
  if (input.json) {
    console.log(
      JSON.stringify({ ...input.payload, seam: IS_CACHEABLE_SECTION }, null, 2),
    );
    return;
  }

  console.log('');
  console.log(input.stdout());
  console.log('');
};

/**
 * .what = the why + fix every TREE-scoped breadth refuses with
 * .why = `--of run` and `--of tree` read the same log root, so they refuse for the
 *        same reason and are fixed the same way. stated once
 */
const WHY_OF_ABSENT_TREE_LOGS =
  'review logs are git-ignored ephemera, local to the machine that ran them';
const FIX_OF_ABSENT_TREE_LOGS =
  'run a review here first, or point --at at a tree where reviews ran';

/**
 * .what = the deets a TREE-scoped refusal carries — where it read, and where the
 *         reviews are, when they sit above
 * .why = `looked in:` alone is honest and unhelpful. `--at` defaults to the BARE
 *        cwd, while `rule.forbid.cwd-outside-gitroot` forbids the WRITER from
 *        writing anywhere but the git root — so a driver who ran a guard from a
 *        subdirectory misses by CONSTRUCTION, and reads *"run a review here first"*
 *        about reviews that ran minutes ago.
 *
 *        the walk answers the question the bare line raises. it changes no read
 *        and no default; it only names what the refusal already implies
 *        (rule.require.errors-name-the-fix, rule.require.discoverability).
 */
const asRefusalOfAbsentTreeLogs = async (input: {
  breadth: 'run' | 'tree';
  cwd: string;
  root: string;
}): Promise<{ deets: string[]; fix: string }> => {
  // a `--at` that names no directory at all is a typo or a stale path, never a tree
  // that has yet to run a review. "run a review here" would name the WRONG fix,
  // since "here" is not there (rule.require.errors-name-the-fix)
  const refusalOfAt = await getOneRefusalOfAtPath({ at: input.cwd });
  if (refusalOfAt)
    return {
      deets: [refusalOfAt.headline, `looked in: ${input.root}`],
      fix: refusalOfAt.fix,
    };

  const above = await getOneReviewedTreeAbove({ cwd: input.cwd });
  if (above === null)
    return {
      deets: [`looked in: ${input.root}`],
      fix: FIX_OF_ABSENT_TREE_LOGS,
    };

  return {
    deets: [
      `looked in: ${input.root}`,
      `🔭 but reviews DID run above: ${above}`,
      `did you mean: rhx review._.cost --of ${input.breadth} --at ${above}`,
    ],
    fix: FIX_OF_ABSENT_TREE_LOGS,
  };
};

/**
 * .what = reports ONE review run's spend and composition
 * .why = the breadth that had no surface until the axis was spelled as one
 *
 * .note = `--at` here names a TREE or a RUN, and the path says which
 *         (`getOneReviewRunMeterAt`). the two cases refuse DIFFERENTLY on purpose:
 *         a tree with no reviews is told to run one; a run dir that is not on disk
 *         is told its path is wrong. to hand the tree's fix to a human who named a
 *         run would send them to re-run a review that already ran
 *         (rule.require.errors-name-the-fix).
 */
const emitCostOfRun = async (input: {
  cwd: string;
  json: boolean;
}): Promise<void> => {
  // every breadth renders the locus a run RECORDED in `metrics.compiled.json`.
  // `withLocus` adds only the FALLBACK — a read of the rendered prompt for a run
  // compiled before the locus was recorded — and it is on at THIS breadth alone: one
  // extra read is affordable for a single run, and a corpus-wide fold would read a
  // megabyte per legacy run. `--of tree` and `--of grove` therefore count such a run
  // as unread, and say so beside the directory rows
  // (rule.require.report-both-cost-levers-with-trend-and-locus)
  const { root, run } = await getOneReviewRunMeterAt({
    at: input.cwd,
    withLocus: true,
  });

  // `return`, never a bare call. `exitOnEmptyCorpus` answers `never`, and a
  // function EXPRESSION that answers `never` narrows naught in typescript unless
  // it carries an explicit type annotation — so a bare call would leave `run`
  // typed `ReviewRunMeter | null` below, and the narrow would be re-asserted
  if (run === null && isReviewRunDir({ at: input.cwd }))
    return exitOnEmptyCorpus({
      header: 'that review run is not on disk',
      deets: [`looked for: ${path.resolve(input.cwd)}`, `under root: ${root}`],
      why: 'the path NAMES a review run (its head is an iso stamp), so it was read as one rather than as a tree',
      fix: `list the runs that ARE there: ls ${asShellSingleQuoted({ value: root })}`,
    });

  if (run === null)
    return exitOnEmptyCorpus({
      header: 'no review run to price',
      ...(await asRefusalOfAbsentTreeLogs({
        breadth: 'run',
        cwd: input.cwd,
        root,
      })),
      why: WHY_OF_ABSENT_TREE_LOGS,
    });

  // a run that compiled no prompt — a refusal at the overflow gate — has no census to
  // say how much of its target mass is bodies and how much is diffs, and that split is
  // what decides whether a narrower file radius or a partition is the lever. so it is
  // re-derived from the run's recorded scope. it keys on the run's OWN dir, so `--at`
  // omitted, `--at <tree>`, and `--at <rundir>` render one split for one run
  const split = await getOneTargetSplitOfRunMeter({ run });

  // this round set against its reviewer's prior round — what the cache could have
  // served, beside what it did serve
  const prefix = await getOnePrefixPairOfRun({ run, root });

  emitReport({
    json: input.json,
    payload: { root, run, split, prefix },
    stdout: () => genReviewRunStdout({ run, root, split, prefix }),
  });
};

/**
 * .what = reports one worktree's review history
 * .why = the breadth a driver asks after a guarded stone
 */
const emitCostOfTree = async (input: {
  cwd: string;
  json: boolean;
  trace: boolean;
}): Promise<void> => {
  const { root, runs } = await getAllReviewRunMeters({ cwd: input.cwd });

  if (runs.length === 0)
    return exitOnEmptyCorpus({
      header: 'no reviews to price',
      ...(await asRefusalOfAbsentTreeLogs({
        breadth: 'tree',
        cwd: input.cwd,
        root,
      })),
      why: WHY_OF_ABSENT_TREE_LOGS,
    });

  // the ONE filesystem read the report itself cannot make. `genReviewMeterReport`
  // is a pure fold, so the guard join happens here, at the boundary that already
  // owns i/o — and the report stays testable with no fixture tree on disk
  // `tree: input.cwd`, the SAME base `getAllReviewRunMeters` read the corpus
  // from — because a run's route is relative to its tree, never to the process.
  // `--at <dir>` moves both together or neither
  const { levels, guardsUnread } = await getAllReviewerLevels({
    runs,
    tree: input.cwd,
  });

  // name each guard that is there and could not be read. its runs still price,
  // filed "(no level — guard unread)"; the warn says which file, why, and the fix that
  // clears that cause. STDERR, so a `--json` document on stdout stays parseable. the
  // frame is the shared emitter's; the command still proceeds, since the runs still
  // price, so it speaks as a `warn` and never wears an error class that means "halted"
  // (rule.require.qualified-error-headers · rule.require.exit-code-semantics)
  for (const guard of guardsUnread)
    emitReviewRefusal({
      kind: 'warn',
      headline: `guard unread — ${guard.path}`,
      lines: [
        `   ├─ ${guard.reason}`,
        `   ├─ fix: ${guard.fix}`,
        `   └─ its runs read "(no level — guard unread)" until the guard reads again`,
      ],
    });

  const report = genReviewMeterReport({ runs, levels });

  // every reviewer's round beside its prior round, and the verdict counts over them
  const prefix = await getOnePrefixCensusOfRuns({ runs });

  emitReport({
    json: input.json,
    payload: { root, report, prefix },
    // `trace` shapes the STDOUT alone. `--json` already carries every axis
    // unconditionally, because a consumer selects with `jq` and pays no read cost
    // for a row they skip — the row budget the flag exists to protect is a
    // HUMAN's attention, and a document has none
    stdout: () =>
      genReviewMeterStdout({
        report,
        root,
        trace: input.trace,
        prefix: prefix.verdicts,
      }),
  });
};

/**
 * .what = the two hint lines that name a reviewed tree the empty grove sat inside of
 * .why = a grove walked from inside a reviewed tree finds naught, and the fix is the
 *        tree's parent; no tree found, no hint (rule.require.errors-name-the-fix)
 */
const asReviewedTreeHintLines = (input: {
  treeReviewed: string | null;
}): string[] => {
  // no reviewed tree above the root, so there is no better grove to name
  if (input.treeReviewed === null) return [];

  return [
    `🔭 but reviews DID run in a tree at: ${input.treeReviewed}`,
    `did you mean: rhx review._.cost --of grove --at ${path.dirname(input.treeReviewed)}`,
  ];
};

/**
 * .what = reports every tree on this machine
 * .why = the breadth a wisher asks. review logs scatter across worktrees, so no
 *        single tree can answer "where did the tokens go"
 */
const emitCostOfGrove = async (input: {
  root: string;
  limit: number;
  json: boolean;
}): Promise<void> => {
  // a root that is not there, or is a file, refuses in the tree and run breadths'
  // own words — never as an empty walk that reads "0 trees seen"
  const refusalOfAt = await getOneRefusalOfAtPath({ at: input.root });
  if (refusalOfAt)
    return exitOnEmptyCorpus({
      header: 'no review logs to price',
      deets: [refusalOfAt.headline],
      why: 'the grove walks the worktrees UNDER a directory, so --at must name one',
      fix: refusalOfAt.fix,
    });

  // the header goes out BEFORE the call, never on the first event. the tree walk
  // itself probes every worktree on the machine, so a header deferred to the first
  // event leaves the first seconds as silent as the whole command used to be
  console.error('');
  console.error(`🦉 price every tree under ${input.root}`);

  const report = await genReviewGroveReport({
    root: input.root,
    // STDERR, never stdout. `--json` writes a document to stdout that a reader
    // pipes into `jq`, and a progress line mixed into it makes that document
    // unparseable. stderr keeps the status visible AND the payload clean, so the
    // two never trade against each other (rule.require.status-feedback)
    //
    // clamped both ways, and both proven red: sever `onProgress` and the three
    //   `expectGroveExitedCleanAndSpoke` sites go red (4 failed); move it to
    //   stdout and the json-purity case plus every stdout snapshot go red (17)
    onProgress: (progress) =>
      console.error(genReviewGroveProgressLine({ progress })),
  });

  // the gate counts RUNS, never trees-with-a-log-dir. a tree whose log root is
  // PRESENT and holds zero runs passes a `treesWithLogs` gate and then renders a
  // corpus of zeroes — a `$0.00` grove total that reads as "this machine spent
  // naught on reviews", which is a measurement nobody made
  // (rule.forbid.failhide). `--of tree` already refuses that shape; this is the
  // container half, and it counted the wrong quantity
  if (report.runsFound === 0) {
    // the commonest empty grove is a root that IS a reviewed tree: `--at` defaults
    // to the cwd's parent, so a run from `my-tree/src/` walks `my-tree/*` and finds
    // naught. name the grove that would answer, rather than only the symptom
    // (rule.require.errors-name-the-fix)
    const treeReviewed = await getOneReviewedTreeAtOrAbove({ at: input.root });
    return exitOnEmptyCorpus({
      header: 'no review logs to price',
      // a DIFFERENT pair of deets than the tree breadths, which is why the
      // fold takes them as a list rather than a fixed `looked in:` line. the
      // grove walked many roots, so it says which pattern it walked and how many
      // trees it saw — an empty answer over 40 trees is a different fact than an
      // empty answer over 0
      deets: [
        `walked: ${input.root}/*/${DIR_OF_REVIEW_LOGS}`,
        `trees seen: ${report.trees.length}`,
        // the discriminator a reader needs to tell the two empties apart: no
        // tree carried a log root at all, or some did and held no run
        `trees with a log root: ${report.treesWithLogs}`,
        ...asReviewedTreeHintLines({ treeReviewed }),
      ],
      why: 'review logs are git-ignored ephemera, written only where a review RAN',
      fix: 'point --at at the root whose worktrees drove guarded routes',
    });
  }

  // the blank that parts the progress block from the report rides the success path
  // alone: a refusal opens with its own blank, so a shared blank here stacked two
  // ahead of the empty-corpus refusal and one ahead of a barred read
  // (rule.forbid.snapshot-visual-blemishes)
  console.error('');

  emitReport({
    json: input.json,
    payload: report,
    stdout: () => genReviewGroveStdout({ report, limit: input.limit }),
  });
};

/**
 * .what = runs a breadth's report, and turns a barred read into a refusal
 * .why = ONE wrapper for the three breadths, because all three read the same
 *        filesystem and would otherwise each grow their own catch — the shape
 *        this file already folded three times (`exitOnValuelessFlag`,
 *        `getOneFlagRead`, `exitOnEmptyCorpus`).
 *
 * .note = it allowlists EXACTLY two errno codes and rethrows every other error
 *         untouched, so a real defect still reaches the human with its stack.
 *         a bare `catch` here would be `rule.forbid.failhide`'s named mega-blocker
 *         — a report of `$0.00` over a corpus nobody could read.
 */
const withRefusalOnDeniedRead = async (
  run: () => Promise<void>,
): Promise<void> => {
  try {
    await run();
  } catch (error) {
    if (isErrorOfDenial({ error })) return exitOnDeniedRead({ error });
    throw error;
  }
};

/**
 * .what = dispatches by breadth and prints the report
 * .why = the one place with console.log + process.exit for this command
 */
export const reviewCost = async (): Promise<void> => {
  // one shape to parse: the caller's own tokens, each `--flag=value` spaced out
  const argv = asArgvSpaced({ args: getInvocationArgs(process.argv) });

  if (isFlagSet({ argv, flag: '--help' }) || isFlagSet({ argv, flag: '-h' })) {
    printHelp();
    return;
  }

  // a typo of a flag this command reads (`--jsno`, `--limt`) must not run as
  // if it were absent — the tree renders where json was asked for, and each
  // refusal below that names a flag a breadth does not take is bypassed by the
  // misspelled name (rule.forbid.failhide, as review.ts and review.by.ts refuse)
  const flagsUnknown = getAllFlagsUnknown({ argv });
  if (flagsUnknown.length > 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: `${asCountedNoun({ count: flagsUnknown.length, one: 'unknown flag', many: 'unknown flags' })}: ${flagsUnknown.join(' · ')}`,
      lines: [
        `   ├─ known: ${[...[...FLAGS_KNOWN_OF_COST].map((flag) => `--${flag}`), ...FLAGS_SHORT_KNOWN_OF_COST].join(' ')}`,
        '   └─ fix:   rhx review._.cost --help',
      ],
    });
    process.exit(2);
  }

  // a stray word must not run as though it were never typed (rule.forbid.failhide)
  const argsStray = getAllArgsStray({ argv });
  if (argsStray.length > 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: `${asCountedNoun({ count: argsStray.length, one: 'stray arg', many: 'stray args' })}: ${argsStray.map((arg) => JSON.stringify(arg)).join(' · ')}`,
      lines: [
        '   ├─ why: this command takes no positional — each value rides a flag',
        '   └─ fix: rhx review._.cost --of tree',
      ],
    });
    process.exit(2);
  }

  // a flag typed twice names two values; which one was meant is the human's call
  const flagsRepeated = getAllFlagsRepeated({ argv });
  if (flagsRepeated.length > 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: `${asCountedNoun({ count: flagsRepeated.length, one: 'flag', many: 'flags' })} typed more than once: ${flagsRepeated.join(' · ')}`,
      lines: [
        '   ├─ why: each flag takes one value; a second would be dropped in silence',
        '   └─ fix: keep one of each, e.g. rhx review._.cost --of tree',
      ],
    });
    process.exit(2);
  }

  const readOfOf = getOneFlagRead({ argv, flag: '--of' });
  if (readOfOf.state === 'valueless')
    exitOnValuelessFlag({
      flag: '--of',
      expects: `one of: ${BREADTHS.join(' | ')}`,
      fix: 'rhx review._.cost --of tree',
    });
  const of = asFlagValue({ read: readOfOf });

  // `--of` is REQUIRED and has no default. the three breadths read three
  // different corpora at three different costs, so a default would silently pick
  // one — and the wrong one is a walk of every tree on the machine. an error that
  // names the valid set is the discoverable path (rule.require.discoverability)
  if (!isBreadth(of)) {
    emitReviewRefusal({
      kind: 'constraint',
      headline:
        of === null
          ? '--of is required — review cost is asked at a breadth'
          : `--of "${of}" is not a breadth`,
      lines: [
        // a word this repo once answered to gets its own line, above the valid set —
        // so the human reads what became of THEIR word, not merely what is legal now
        ...asRetiredBreadthLines({ of }),
        `   ├─ valid: ${BREADTHS.join(' | ')}`,
        // rendered from `DESCRIPTION_OF_BREADTH`, never re-typed, so the refusal and
        // `--help` teach one axis
        ...getAllAxisLines({
          prefix: '   ├─ ',
          label: (breadth) => `${breadth}:`,
          gutter: 1,
        }),
        '   └─ fix:   rhx review._.cost --of tree',
      ],
    });
    process.exit(2);
  }

  const readOfAt = getOneFlagRead({ argv, flag: '--at' });
  if (readOfAt.state === 'valueless')
    exitOnValuelessFlag({
      flag: '--at',
      expects: 'a directory to read from',
      fix: 'rhx review._.cost --of tree --at ../other-worktree',
    });
  const at = asFlagValue({ read: readOfAt });
  const json = isFlagSet({ argv, flag: '--json' });
  const trace = isFlagSet({ argv, flag: '--trace' });

  // a RUN dir handed to a breadth that reads a TREE is caught here, with the
  // breadth named as the fix. it would refuse anyway — `asReviewLogsDir` re-appends
  // `.log/bhrain/review` under it and finds naught — but the refusal it would reach
  // says "run a review here first" about a run dir that holds a finished review.
  // an error that names the WRONG fix is worse than one that names none: the
  // human acts on it (rule.require.errors-name-the-fix, rule.prefer.prevent-over-correct)
  if (isRunDirGivenToTreeBreadth({ at, of })) {
    emitReviewRefusal({
      kind: 'constraint',
      // the headline names no breadth's shape, and reads the breadth's own
      // description, so `--of grove` is never called a tree
      headline: `--at names one review RUN, and --of ${of} reads more than one`,
      lines: [
        `   ├─ given: ${at}`,
        `   ├─ --of ${of}: ${DESCRIPTION_OF_BREADTH[of]}`,
        '   ├─ why:   its head is an iso stamp, so it is a log dir this repo minted',
        '   │         — a single run, never a tree that holds runs',
        '   ├─ takes: --of run [--at <rundir>]',
        `   └─ fix:   rhx review._.cost --of run --at ${at}`,
      ],
    });
    process.exit(2);
  }

  // `--limit` is read before the breadth branch, so every breadth validates it —
  // `--of run --limit abc` refuses rather than run clean with the flag unread
  const readOfLimit = getOneFlagRead({ argv, flag: '--limit' });

  // a breadth-scoped flag typed where it would do naught — under a breadth that does
  // not take it, or beside `--json` — is refused in both shapes, well-formed or not.
  // a flag a driver typed deliberately, accepted and inert, is the silent no-op this
  // command refuses (rule.forbid.failhide, rule.forbid.surprises)
  const refusalOfFlag = getOneCostFlagRefusal({
    of,
    json,
    typed: { '--trace': trace, '--limit': isFlagTyped({ read: readOfLimit }) },
  });
  if (refusalOfFlag) {
    emitReviewRefusal({ kind: 'constraint', ...refusalOfFlag });
    process.exit(2);
  }

  if (of === 'run')
    return await withRefusalOnDeniedRead(
      async () => await emitCostOfRun({ cwd: at ?? process.cwd(), json }),
    );
  if (of === 'tree')
    return await withRefusalOnDeniedRead(
      async () =>
        await emitCostOfTree({ cwd: at ?? process.cwd(), json, trace }),
    );

  if (readOfLimit.state === 'valueless')
    exitOnValuelessFlag({
      flag: '--limit',
      expects: 'a whole number, 1 or greater',
      fix: 'rhx review._.cost --of grove --limit 25',
    });
  const limitRaw = asFlagValue({ read: readOfLimit });

  // `--limit` is VALIDATED, never merely coerced. `Number('abc')` is NaN, and NaN
  // poisons both halves of the render in the same direction: `rows.slice(0, NaN)` is
  // `[]`, so every axis renders empty, AND `rows.length > NaN` is false, so the
  // `… and N more` disclosure is suppressed. the report does not fail — it reports a
  // corpus that does not exist, which is the precise failhide this whole meter is
  // built to refuse (rule.forbid.failhide).
  //
  // `0` and a negative land in the same place by a different door, so the guard is on
  // the RANGE and not merely on NaN. caught at parse with the valid set named, rather
  // than handled after the fact (rule.prefer.prevent-over-correct)
  const limit = asRowLimit({ raw: limitRaw });
  if (!isRowLimitValid({ limit })) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: `--limit "${limitRaw}" is not a row count`,
      lines: [
        '   ├─ valid: a whole number, 1 or greater',
        '   ├─ why:   --limit bounds how many rows each axis RENDERS, so a',
        '   │         bound below 1 would print an empty grove that is not empty',
        '   └─ fix:   rhx review._.cost --of grove --limit 25',
      ],
    });
    process.exit(2);
  }

  return await withRefusalOnDeniedRead(
    async () =>
      await emitCostOfGrove({
        root: at ?? path.dirname(process.cwd()),
        limit,
        json,
      }),
  );
};
