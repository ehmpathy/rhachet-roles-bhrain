/**
 * .what = cli entrypoint for the learner learn.domain.terms skill
 * .why = enables shell invocation via package-level import, isolated on its own
 *        cli subpath so the onStop hook loads minimal modules (see
 *        rule.require.isolated-cli-subpath-exports)
 *
 * two faces, one skill (mirrors the driver's route.drive):
 *   --when hook.onStop → staleness check; exit 2 to hold the stop when the
 *                        distillation is stale, else exit 0 (read-only, never writes)
 *   (no --when)        → the clone's reflect-and-distill guide; findserts the
 *                        glossary scaffold, then prints how to distill
 */
import { BadRequestError } from 'helpful-errors';

import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { genDomainTermsScaffold } from '@src/domain.operations/learn/genDomainTermsScaffold';
import { getDomainTermsPaths } from '@src/domain.operations/learn/getDomainTermsPaths';
import { getSweepProgress } from '@src/domain.operations/learn/getSweepProgress';
import { isProgressArticulated } from '@src/domain.operations/learn/isProgressArticulated';
import { isSweepStale } from '@src/domain.operations/learn/isSweepStale';

/**
 * .what = emit the established two-line header — mascot + slogan, then scroll + command
 * .why = all three faces (clone guide, onStop nudge, --help) open the SAME way; render
 *        from ONE place so the headers can never drift out of sync
 *        (rule.require.single-source-of-truth-for-render). the slogan varies by face
 *        (the nudge is a staleness reminder, the others a plain invocation) but the
 *        shape — `🦉 <slogan>` / blank / `📜 <command>` — is identical for all
 */
const emitHeader = (
  emit: (line: string) => void,
  input: { slogan: string; command: string },
): void => {
  emit(`🦉 ${input.slogan}`);
  emit('');
  emit(`📜 ${input.command}`);
};

/**
 * .what = the flag portion of a token — the part before any `=` (e.g. `--help=x` → `--help`)
 * .why = one splitter so both the help check and the allowlist parse the combined
 *        `--flag=value` form the same way (rule.require.ubiqlang — one parse of a token)
 */
const asFlagName = (arg: string): string => arg.split('=')[0]!;

/**
 * .what = the flags the rhachet harness always injects to identify the invocation
 * .why = `rhx <skill>` prepends --skill/--role/--repo (each with a value) to the argv it
 *        hands the wrapper; they name WHICH skill ran, they are NOT part of this skill's
 *        own surface. they must be stripped before the strict allowlist runs, else
 *        assertKnownFlags rejects the harness's own flags and the onStop hook can never fire
 */
const RHACHET_INJECTED_FLAGS = ['--skill', '--role', '--repo'];

/**
 * .what = the caller's own args — the invocation args minus the rhachet-injected flags
 * .why = leaves only this skill's surface (--when / --help) for strict validation, so a
 *        genuine typo or stray positional is still caught while the harness flags pass
 *        through. handles both the space form (`--skill x`) and the combined (`--skill=x`)
 */
const getOwnArgs = (argv: string[]): string[] => {
  const args = getInvocationArgs(argv);
  // mark each injected flag token, plus the value token after a space-form one
  const dropped = new Set<number>();
  args.forEach((arg, index) => {
    if (!RHACHET_INJECTED_FLAGS.includes(asFlagName(arg))) return;
    dropped.add(index);
    // `--skill=x` carries its value inline; `--skill x` puts it in the next token
    if (!arg.includes('=')) dropped.add(index + 1);
  });
  return args.filter((_, index) => !dropped.has(index));
};

/**
 * .what = detect a --help / -h request in argv (both bare and `--help=` combined forms)
 * .why = a help request must short-circuit BEFORE either face runs, so the clone face
 *        never writes on a --help (rule.require.help-on-demand). the combined `--help=x`
 *        form must also count, else it silently falls through to the clone face that writes
 */
const isHelpRequested = (argv: string[]): boolean => {
  const args = getOwnArgs(argv);
  return args.some((arg) => ['--help', '-h'].includes(asFlagName(arg)));
};

/**
 * .what = the flags this skill recognizes (its whole surface)
 * .why = one allowlist so assertKnownFlags can reject all else — a typo like
 *        --wen must fail loud, never silently fall through to the clone face
 */
const KNOWN_FLAGS = ['--when', '--help', '-h'];

/**
 * .what = is this token one the skill recognizes?
 * .why = accepts the conventional combined `--flag=value` form a human expects
 *        (rule.forbid.friction-hazards), via asFlagName. the posix `--` marker is
 *        already filtered by getInvocationArgs, so it never reaches here
 */
const isKnownToken = (arg: string): boolean =>
  KNOWN_FLAGS.includes(asFlagName(arg));

/**
 * .what = reject any token the skill does not recognize (unknown flags AND stray positionals)
 * .why = an unrecognized token — a typo `--wen`, a `--verbose`, or a bare positional `foo` —
 *        must NOT be silently ignored, else the clone face runs and writes when the caller
 *        intended the hook face or a no-op. this skill has ZERO positional args, so any token
 *        that is not a known flag (nor a --when value) is a fault. fail-loud
 *        (rule.forbid.friction-hazards, safe-by-default)
 */
const assertKnownFlags = (argv: string[]): void => {
  const args = getOwnArgs(argv);
  // the token right after a space-form `--when` is its VALUE, not a flag — skip it so
  // a value that starts with `-` (e.g. `--when -x`) reads as the value and parseWhen
  // gives the precise `invalid --when: -x` error, not a generic unknown-token one
  const whenIndex = args.indexOf('--when');
  const whenValueIndex = whenIndex === -1 ? -1 : whenIndex + 1;
  const unknown = args.filter(
    (arg, index) => index !== whenValueIndex && !isKnownToken(arg),
  );
  if (unknown.length === 0) return;
  throw new BadRequestError(
    `unexpected arg(s): ${unknown.join(', ')}. this skill accepts only: --when hook.onStop | --help | -h`,
    { unknown },
  );
};

/**
 * .what = validate a --when value into the one supported hook context
 * .why = an absent or wrong value is a caller error, never a silent fall-through to
 *        the clone face (which writes). fail-loud on both (rule.forbid.failhide)
 */
const asWhenValue = (value: string | undefined): 'hook.onStop' => {
  if (value === 'hook.onStop') return 'hook.onStop';
  // render the fault legibly: an absent token reads '(absent)', an empty value
  // (e.g. the combined `--when=` form) reads '(empty)' — never a blank before the
  // period, which would read as a cryptic error (rule.forbid.friction-hazards)
  const shown =
    value === undefined ? '(absent)' : value === '' ? '(empty)' : value;
  throw new BadRequestError(
    `invalid --when: ${shown}. only 'hook.onStop' is supported`,
    { when: value ?? null },
  );
};

/**
 * .what = parse the --when hook context from argv
 * .why = selects the hook face vs the clone face; only hook.onStop is a hook
 *        context here (this skill has no onBoot face). accepts both the combined
 *        `--when=value` and the space-separated `--when value` forms
 */
const parseWhen = (argv: string[]): 'hook.onStop' | undefined => {
  const args = getOwnArgs(argv);

  // combined form `--when=value` → validate its inline value
  const combined = args.find((arg) => arg.startsWith('--when='));
  if (combined) return asWhenValue(combined.slice('--when='.length));

  // no --when at all → clone face
  const whenIndex = args.indexOf('--when');
  if (whenIndex === -1) return undefined;

  // space-separated form `--when value` → validate the next token
  return asWhenValue(args[whenIndex + 1]);
};

/**
 * .what = the shared distill guidance body — the how (reflect + act) + the canon
 * .why = both faces teach the SAME moves and cite the SAME canon; render them from
 *        ONE place, into a caller-supplied sink (stdout for the clone guide, stderr
 *        for the onStop nudge), so the two renders can never drift
 *        (rule.require.single-source-of-truth-for-render,
 *        rule.forbid.duplicate-format-tree-operations). every line is a mid-branch
 *        (`├─`), so each face wraps it with its own opener and closer
 */
const emitDistillMoves = (
  emit: (line: string) => void,
  input: { progressPath: string; glossaryReadmePath: string },
): void => {
  emit('   ├─ do this now — review + redistill the terms this round touched');
  emit(
    '   │  ├─ 1. recall — which domain objects & operations did you declare or engage?',
  );
  emit(
    '   │  │        split each name into its terms (getStone → verb `get` + noun `stone`)',
  );
  emit(
    '   │  ├─ 2. conform-or-dispute each EXTANT term (already in the glossary):',
  );
  emit(
    '   │  │     ├─ your contract uses the canonical word → conform, you are done',
  );
  emit(
    '   │  │     └─ you reached for a synonym → rename to the canonical word,',
  );
  emit(
    '   │  │           or open a dispute in its `.reason` (adhere, or argue — never drift)',
  );
  emit(
    '   │  ├─ 3. pave the path for each NEW term (born this round, not yet in the glossary):',
  );
  emit('   │  │     ├─ write its `term=<x>._.choice.*` cluster:');
  emit(
    '   │  │     │     ├─ term=<x>._.choice._.md              (say: chosen word, kind, forbidden synonyms)',
  );
  emit(
    '   │  │     │     ├─ term=<x>._.choice.reason.md         (ref: etymology, disputes, evidence — required)',
  );
  emit(
    '   │  │     │     └─ term=<x>._.choice.example=<abc>.md  (ref: one per notable example — optional)',
  );
  emit(
    '   │  │     └─ or cite it — point to the extant declaration you reused',
  );
  emit(
    '   │  └─ 4. articulate progress.md — REQUIRED, the last step every round:',
  );
  emit(
    '   │        ├─ what you conformed, disputed, and paved this round — and why',
  );
  emit(
    '   │        ├─ a term the round SETTLED (declared dobj/dop, judged synonym) → capture it NOW',
  );
  emit(
    '   │        ├─ defer ONLY a term you truly cannot finish (needs discovery, dispute still open)',
  );
  emit(`   │        └─ sentinel = ${input.progressPath}`);
  emit('   │');
  // the canon — the booted briefs + rules that DEFINE a domain-term lesson + its rules,
  // so the reader recalls exactly what a term is + why it is kept
  emit('   ├─ the canon — what a term is + why it is kept');
  emit(
    '   │  ├─ why  · im_an.obsessive_learner.for.domain.terms.md (the trait)',
  );
  emit(
    '   │  ├─ rule · rule.require.domain-term-itemization (itemize each declared term)',
  );
  emit(
    '   │  ├─ rule · rule.forbid.domain-term-synonyms (canonical term, or dispute)',
  );
  emit(
    '   │  ├─ how  · template.domain-term.md + howto.domain-term-disputes.[guide].md',
  );
  emit(`   │  └─ glos · ${input.glossaryReadmePath}`);
};

/**
 * .what = emit the onStop staleness nudge to stderr
 * .why = stderr (not stdout) per rule.forbid.stdout-on-exit-errors; cli hooks
 *        surface stderr on non-zero exit
 *
 * structure: ask → why → [shared how + canon] → the-time-is-now → close, so the ask is
 * never abstract — the reader learns WHAT to do, WHY it matters, HOW to do it, WHICH
 * booted briefs/rules define the concepts, and that the moment to act is now
 */
const emitStaleNudge = (input: {
  progressPath: string;
  glossaryReadmePath: string;
}): void => {
  const emit = (line: string): void => console.error(line);
  emitHeader(emit, {
    slogan: 'time again, to tend the terms',
    command: 'learn.domain.terms --when hook.onStop',
  });
  emit('   │');
  emit('   ├─ the ask — now, before you rest');
  emit(
    '   │  └─ review the terms this round touched, then redistill: conform-or-dispute',
  );
  emit(
    '   │     the extant ones, and pave the path for any new ones. the steps are below',
  );
  emit('   │');
  emit('   ├─ the why');
  emit(
    '   │  └─ the repo vocabulary compiles hour by hour; a term touched but not tended',
  );
  emit(
    '   │     is a lesson lost — the next traveler re-derives it, or drifts to a synonym.',
  );
  emit('   │     an hour has passed, so the moment to tend it is now');
  emit('   │');
  emitDistillMoves(emit, input);
  emit('   │');
  emit('   ├─ the time to capture is now');
  emit(
    '   │  └─ your distillation went stale (> 1 hour) — tend it before you rest',
  );
  emit('   │');
  emit(
    '   └─ 🪷 distill, then rest — the glossary grows, the floor rises for all who follow',
  );
};

/**
 * .what = emit the scaffold-status line(s) of the clone guide
 * .why = split out so the guide stays flat — a guard clause + early return keeps
 *        the two cases (no-op run vs written) linear, no else branch
 *        (rule.forbid.else-branches). a no-op pass is silent: the scaffold already
 *        converged, so there is no news to report — silence keeps the guide on the
 *        one thing that matters, the distillation (rule.require.status-feedback:
 *        report what CHANGED; an unchanged scaffold is not a change)
 */
const emitScaffoldStatus = (input: { created: string[] }): void => {
  // a no-op run wrote no path this pass (every piece already converged) — stay silent
  if (input.created.length === 0) return;

  // otherwise, name each artifact written this pass (findsert create or upsert reconcile)
  console.log('   ├─ scaffold written');
  input.created.forEach((path, index) => {
    const isLast = index === input.created.length - 1;
    console.log(`   │  ${isLast ? '└─' : '├─'} ${path}`);
  });
};

/**
 * .what = emit the clone-face reflect-and-distill guide to stdout
 * .why = the sweep does no work on its own — the learner decides what the round
 *        was worth. this guide names the glossary + scaffold status, then renders
 *        the SAME shared how + canon body the onStop nudge does (emitDistillMoves),
 *        so the clone face and the hook face can never teach a divergent guide
 */
const emitReflectionGuide = (input: {
  glossaryDir: string;
  glossaryReadmePath: string;
  created: string[];
  progressPath: string;
}): void => {
  const emit = (line: string): void => console.log(line);
  emitHeader(emit, { slogan: 'tend the terms', command: 'learn.domain.terms' });
  emit(`   ├─ glossary = ${input.glossaryDir}`);
  emitScaffoldStatus({ created: input.created });
  emit('   │');
  emitDistillMoves(emit, {
    progressPath: input.progressPath,
    glossaryReadmePath: input.glossaryReadmePath,
  });
  emit('   │');
  emit(
    '   └─ 🪷 distill, then rest — the glossary grows, the floor rises for all who follow',
  );
};

/**
 * .what = emit the --help usage to stdout (both faces, args, exit codes)
 * .why = every user-faced op must explain itself on demand; help is not an error,
 *        so it goes to stdout + exits 0 (rule.require.help-on-demand)
 */
const emitHelp = (): void => {
  const emit = (line: string): void => console.log(line);
  emitHeader(emit, { slogan: 'tend the terms', command: 'learn.domain.terms' });
  emit('');
  emit('  usage:');
  console.log(
    '    learn.domain.terms                  # clone face: write the scaffold,',
  );
  console.log(
    '                                        # then guide the reflect-and-distill',
  );
  console.log('    learn.domain.terms --when hook.onStop');
  console.log(
    '                                        # hook face: staleness check',
  );
  console.log('    learn.domain.terms --help | -h      # this help');
  console.log('');
  console.log('  faces:');
  console.log(
    '    ├─ clone (no --when) → writes the scaffold, prints the guide; exit 0',
  );
  console.log('    └─ hook  (--when hook.onStop) → read-only staleness check');
  console.log(
    '       ├─ fresh distillation (< 1 hour) → exit 0 (session rests)',
  );
  console.log(
    '       └─ stale (> 1 hour) → exit 2 (holds the stop, never a write)',
  );
  console.log('');
  console.log('  --when values: hook.onStop (only)');
};

/**
 * .what = cli entrypoint for the learn.domain.terms skill (both faces)
 * .why = the onStop hook nudges when the distillation is stale; the clone runs it
 *        to reflect + distill
 *
 * exits 0 when fresh (hook), after the guide (clone), or after --help
 * exits 2 when stale (hook) to hold the stop open (never a write)
 */
export const learnDomainTerms = async (): Promise<void> => {
  // --help: print usage, exit 0, never mutate. a help request must not run the
  // clone face (which writes the scaffold) — safe-by-default (rule.require.help-on-demand)
  if (isHelpRequested(process.argv)) {
    emitHelp();
    return;
  }

  // a bad --when is a caller-constraint, not a malfunction — exit 2, not 1
  // (rule.require.exit-code-semantics). allowlist BadRequestError only; any other
  // throw propagates to the wrapper's exit-1 backstop (no failhide)
  const when = ((): 'hook.onStop' | undefined => {
    try {
      assertKnownFlags(process.argv);
      return parseWhen(process.argv);
    } catch (error) {
      if (!(error instanceof BadRequestError)) throw error;
      console.error(error.message);
      return process.exit(2);
    }
  })();
  const paths = getDomainTermsPaths();

  // hook face: read-only staleness check
  if (when === 'hook.onStop') {
    // freshness turns on BOTH a recent mtime AND a real articulation in the content,
    // so a bare `touch` cannot silence the nudge (guards the one hard requirement)
    const progress = await getSweepProgress({ path: paths.progressPath });
    const articulated = isProgressArticulated({ content: progress.content });
    const stale = isSweepStale({
      mtime: progress.mtime,
      articulated,
      now: new Date(),
    });

    // fresh, articulated distillation → let the session rest
    if (!stale) return;

    // stale → hold the stop open with a gentle nudge (never blocks a write)
    emitStaleNudge({
      progressPath: paths.progressPath,
      glossaryReadmePath: paths.readmePath,
    });
    process.exit(2);
  }

  // clone face: findsert the scaffold, then guide the reflection
  const scaffold = await genDomainTermsScaffold();
  emitReflectionGuide({
    glossaryDir: scaffold.glossaryDir,
    glossaryReadmePath: paths.readmePath,
    created: scaffold.created,
    progressPath: paths.progressPath,
  });
};
