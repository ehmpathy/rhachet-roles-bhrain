/**
 * .what = cli entrypoint for the learner learn.terms.hook skill
 * .why = a repo that wants the onStop term-distill nudge turns it on; every other repo pays
 *        no cost for it. isolated on its own cli subpath so the toggle loads minimal modules
 *        (rule.require.isolated-cli-subpath-exports)
 *
 * verbs:
 *   get     → report whether this repo's stops run the term hook (never writes)
 *   enable  → add the onStop term hook to this repo's claude settings
 *   disable → remove it, whoever wrote it
 */
import { existsSync } from 'fs';
import { ConstraintError } from 'helpful-errors';

import { asConstraintErrorHeadline } from '@src/contract/cli/asConstraintErrorHeadline';
import { asHelpfulMessageParts } from '@src/contract/cli/asHelpfulMessageParts';
import { asTermsHookAlsoRemovedLeaf } from '@src/contract/cli/asTermsHookAlsoRemovedLeaf';
import { asTermsHookDriftLeaf } from '@src/contract/cli/asTermsHookDriftLeaf';
import { asTermsHookReachLeaves } from '@src/contract/cli/asTermsHookReachLeaves';
import { getOwnInvocationArgs } from '@src/domain.operations/cli/getOwnInvocationArgs';
import { SWEEP_STALENESS_THRESHOLD_MS } from '@src/domain.operations/learn/isSweepStale';
import { asTermsHookAuthors } from '@src/domain.operations/learn/termsHook/asTermsHookAuthors';
import { getOneTermsHookSettings } from '@src/domain.operations/learn/termsHook/getOneTermsHookSettings';
import { getOneTermsHookState } from '@src/domain.operations/learn/termsHook/getOneTermsHookState';
import { getOneTermsHookTarget } from '@src/domain.operations/learn/termsHook/getOneTermsHookTarget';
import {
  setTermsHookToggle,
  type TermsHookToggleOutcome,
} from '@src/domain.operations/learn/termsHook/setTermsHookToggle';
import { TERMS_HOOK_DECLARED } from '@src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED';

/**
 * .what = the three verbs, each with its one-line sense
 * .why = one list feeds the refusal, the help, and the parse, so they never disagree
 */
const VERBS = [
  { verb: 'get', sense: 'report whether the term hook is on in this repo' },
  { verb: 'enable', sense: 'add the onStop term hook' },
  { verb: 'disable', sense: 'remove it' },
] as const;
type Verb = (typeof VERBS)[number]['verb'];

/**
 * .what = the shared tree of the three verbs
 * .why = the bad-verb refusal and the help render the same list
 */
const asVerbTreeLines = (input: { indent: string }): string[] =>
  VERBS.map((item, index) => {
    const glyph = index === VERBS.length - 1 ? '└─' : '├─';
    return `${input.indent}${glyph} ${item.verb.padEnd(8)} ${item.sense}`;
  });

/**
 * .what = the one-line reason a set of args names no verb
 */
const asVerbRefusalReason = (input: { args: string[] }): string => {
  if (input.args.length === 0) return 'no verb given';
  if (input.args.length > 1)
    return `unexpected arg(s): ${input.args.join(' ')}`;
  return `unknown verb \`${input.args[0]}\``;
};

/**
 * .what = parse argv into a verb, a help request, or a refusal
 * .why = a bare call or an unknown token never defaults to a write; it refuses and names the
 *        three verbs (case=7)
 */
const asVerbOrHelp = (input: { argv: string[] }): Verb | 'help' => {
  const args = getOwnInvocationArgs(input.argv);
  if (args.some((arg) => arg === '--help' || arg === '-h')) return 'help';
  const verbFound = VERBS.find((item) => item.verb === args[0]);
  if (args.length === 1 && verbFound) return verbFound.verb;
  throw new ConstraintError(asVerbRefusalReason({ args }), { args });
};

/**
 * .what = the reason line of a refusal headline: its first line
 * .why = a helpful-errors headline may carry the metadata bag on the lines after the reason;
 *        the qualified header shows only the reason
 */
const asRefusalReasonLine = (input: { headline: string }): string =>
  input.headline.split('\n')[0] ?? input.headline;

/**
 * .what = emit the two-line header: the vibe, then the scroll and the command
 * .why = every face of the learner opens the same way (`learn.ts` emitHeader)
 */
const emitHeader = (input: { vibe: string; command: string }): void => {
  console.log(`🦉 ${input.vibe}`);
  console.log('');
  console.log(`📜 ${input.command}`);
};

/**
 * .what = what the hook costs a session, in plain words
 * .why = the hold at the stop is why the nudge was withdrawn, so a caller learns it before
 *        and after they turn it on. the window is read from the face's own threshold
 * .note = the face holds a stop whenever no fresh distill is on file, so a session that never
 *         distills is held at every stop; the window only bounds how long a fresh one lasts
 */
const EFFECT_TEXT = `a session's stop is held until it distills its terms; a fresh distill quiets it for ${SWEEP_STALENESS_THRESHOLD_MS / 60000} min`;

/**
 * .what = when a write reaches a session
 * .why = claude reads its settings once, at start, so a live session is not held until it
 *        restarts; `get` and each write say so, lest `enabled` read as already in force
 */
const TAKES_EFFECT_LEAF =
  "   ├─ takes effect = at each session's next start; a live session keeps its old settings";

/**
 * .what = the leaves that name the hook, its cost, and whose stops it reaches
 * .why = `get` and `enable` both show them, so the caller learns which sessions are held,
 *        and that a plain session on the split layout is not
 */
const asHookLeaves = (input: { layout: 'split' | 'old' }): string[] => [
  `   ├─ hook = ${TERMS_HOOK_DECLARED.event} → ${TERMS_HOOK_DECLARED.fragment}, guarded on the learner link`,
  `   ├─ effect = ${EFFECT_TEXT}`,
  ...asTermsHookReachLeaves({ layout: input.layout }),
];

/**
 * .what = the status leaf text of one toggle outcome
 * .why = each outcome reads one way: a write names what changed, a no-op says so
 */
const STATUS_OF_OUTCOME: Record<TermsHookToggleOutcome, string> = {
  added: 'enabled (added)',
  updated: 'enabled (updated to the declared entry)',
  removed: 'disabled (removed)',
  'already-enabled': 'already enabled',
  'already-disabled': 'already disabled',
};

/**
 * .what = whether a toggle outcome wrote the file
 */
const isOutcomeWrite = (input: { outcome: TermsHookToggleOutcome }): boolean =>
  ['added', 'updated', 'removed'].includes(input.outcome);

/**
 * .what = run `get`: report the state, write naught
 */
const runGet = async (input: { repoRoot: string }): Promise<void> => {
  const target = getOneTermsHookTarget({ repoRoot: input.repoRoot });
  const settings = await getOneTermsHookSettings(target);
  const state = getOneTermsHookState({ settings });
  emitHeader({ vibe: 'stillness', command: 'learn.terms.hook get' });

  // off, with the cost named before the caller turns it on
  if (state.status === 'off') {
    console.log('   ├─ status = disabled');
    console.log(
      `   ├─ settings = ${asSettingsShownText({ pathShown: target.pathShown, isFound: settings !== null })}`,
    );
    console.log(`   ├─ effect when on = ${EFFECT_TEXT}`);
    console.log('   └─ to turn it on: rhx learn.terms.hook enable');
    return;
  }

  // on, with any drift named
  console.log('   ├─ status = enabled');
  console.log(`   ├─ settings = ${target.pathShown}`);
  asHookLeaves({ layout: target.layout }).forEach((line) => console.log(line));
  if (state.status === 'drifted')
    console.log(
      asTermsHookDriftLeaf({
        authors: asTermsHookAuthors({ hooks: state.drifted }),
      }),
    );
  console.log(TAKES_EFFECT_LEAF);
  console.log('   └─ to turn it off: rhx learn.terms.hook disable');
};

/**
 * .what = the `settings =` text: the path, marked when no file sits there yet
 * .why = a path with no file reads as a file to open; the mark says the verb found none
 */
const asSettingsShownText = (input: {
  pathShown: string;
  isFound: boolean;
}): string => (input.isFound ? input.pathShown : `${input.pathShown} (absent)`);

/**
 * .what = the last branch of a write: the file to commit, and where it sits when it differs
 * .why = on the split layout `.claude` is a link, so the file a human commits lives at another
 *        path than the one `settings =` names; a child row ties the two together, so no line
 *        runs past a terminal's width
 */
const asShareItLeaf = (input: {
  target: { pathShown: string; pathTracked: string };
}): string =>
  input.target.pathTracked === input.target.pathShown
    ? `   └─ share it: commit ${input.target.pathTracked}`
    : [
        `   └─ share it: commit ${input.target.pathTracked}`,
        `      └─ linked from = ${input.target.pathShown}`,
      ].join('\n');

/**
 * .what = run `enable` or `disable`, then report what changed
 */
const runToggle = async (input: {
  repoRoot: string;
  mode: 'enable' | 'disable';
}): Promise<void> => {
  const result = await setTermsHookToggle(input);
  const isWrite = isOutcomeWrite({ outcome: result.outcome });
  const vibe = input.mode === 'enable' ? 'so it is' : 'as leaves fall';
  emitHeader({ vibe, command: `learn.terms.hook ${input.mode}` });
  console.log(`   ├─ status = ${STATUS_OF_OUTCOME[result.outcome]}`);

  // a no-op names the file and stops
  if (!isWrite) {
    console.log(
      `   └─ settings = ${asSettingsShownText({ pathShown: result.target.pathShown, isFound: existsSync(result.target.path) })}`,
    );
    return;
  }

  // a write names the file, the hook, any foreign authors it removed, and how it spreads
  console.log(`   ├─ settings = ${result.target.pathShown}`);
  if (input.mode === 'enable')
    asHookLeaves({ layout: result.target.layout }).forEach((line) =>
      console.log(line),
    );
  const alsoRemoved = asTermsHookAlsoRemovedLeaf({
    authorsRemoved: result.authorsRemoved,
  });
  if (alsoRemoved) console.log(alsoRemoved);
  console.log(TAKES_EFFECT_LEAF);
  console.log(asShareItLeaf({ target: result.target }));
};

/**
 * .what = emit the --help usage to stdout
 * .why = every user-faced op explains itself on demand (rule.require.help-on-demand)
 */
const emitHelp = (): void => {
  emitHeader({ vibe: 'tend the terms', command: 'learn.terms.hook' });
  console.log(
    "   ├─ what = turn the learner's onStop term hook on or off for this repo",
  );
  console.log('   ├─ usage = rhx learn.terms.hook <verb>');
  console.log('   ├─ verbs');
  asVerbTreeLines({ indent: '   │  ' }).forEach((line) => console.log(line));
  console.log(
    '   ├─ default = disabled; no repo pays for the hook until it asks',
  );
  console.log(`   ├─ effect when on = ${EFFECT_TEXT}`);
  console.log('   ├─ examples');
  console.log('   │  ├─ rhx learn.terms.hook get       # is it on here?');
  console.log(
    '   │  └─ rhx learn.terms.hook enable    # turn it on, then commit the file it names',
  );
  console.log('   ├─ exit = 0 done · 1 malfunction · 2 refused, with its fix');
  console.log('   └─ cleanup after the learner is unlinked');
  console.log('      ├─ relink the learner, then rhx learn.terms.hook disable');
  console.log(
    `      └─ or delete the one Stop entry by ${TERMS_HOOK_DECLARED.author}`,
  );
};

/**
 * .what = emit a refusal to stderr, in the qualified header form
 * .why = a caller must fix it, so it is a ConstraintError, exit 2, with the fix named
 *        (rule.require.qualified-error-headers, rule.forbid.stdout-on-exit-errors)
 */
const emitRefusal = (input: { error: ConstraintError }): void => {
  // the shared parse: strip the class lead, then part the metadata bag off the headline
  const parts = asHelpfulMessageParts({
    message: asConstraintErrorHeadline({ error: input.error }),
  });
  const settings =
    typeof parts.metadata?.settings === 'string'
      ? parts.metadata.settings
      : null;
  const reason = asRefusalReasonLine({ headline: parts.headline });
  console.error(`✋ ConstraintError: ${reason}`);

  // a settings refusal names the file, where it broke (the parser's account, or the first
  //   place the shape breaks), and its fix
  if (settings) {
    const parse =
      typeof parts.metadata?.parse === 'string' ? parts.metadata.parse : null;
    const found =
      typeof parts.metadata?.found === 'string' ? parts.metadata.found : null;
    console.error(`   ├─ settings = ${settings}`);
    if (parse) console.error(`   ├─ parse = ${parse}`);
    if (found) console.error(`   ├─ found = ${found}`);
    console.error(`   └─ fix: ${parts.hint ?? 'repair the file, then rerun'}`);
    return;
  }

  // a verb refusal lists the three verbs
  if (Array.isArray(parts.metadata?.args)) {
    console.error('   ├─ verbs');
    asVerbTreeLines({ indent: '   │  ' }).forEach((line) =>
      console.error(line),
    );
    console.error('   └─ help: rhx learn.terms.hook --help');
    return;
  }

  // any other refusal names its own fix, never the verb screen
  console.error(
    `   └─ fix: ${parts.hint ?? 'clear the cause above, then rerun the command'}`,
  );
};

/**
 * .what = cli entrypoint for the learn.terms.hook skill
 *
 * exits 0 on success, a no-op, or --help · 2 on a refusal the caller must fix
 */
export const learnTermsHook = async (): Promise<void> => {
  const repoRoot = process.cwd();
  try {
    const verb = asVerbOrHelp({ argv: process.argv });
    if (verb === 'help') return emitHelp();
    if (verb === 'get') return await runGet({ repoRoot });
    return await runToggle({ repoRoot, mode: verb });
  } catch (error) {
    if (!(error instanceof ConstraintError)) throw error;
    emitRefusal({ error });
    process.exitCode = 2; // not process.exit, so a piped stderr drains whole
  }
};
