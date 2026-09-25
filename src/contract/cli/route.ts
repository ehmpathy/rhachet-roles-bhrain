import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';
import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { asUrgentHarmSet } from '@src/domain.operations/route/asUrgentHarmSet';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { getRouteBind } from '@src/domain.operations/route/bind/getRouteBind';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { getDecisionIsArtifactProtected } from '@src/domain.operations/route/bouncer/getDecisionIsArtifactProtected';
import { getRouteBouncerCache } from '@src/domain.operations/route/bouncer/getRouteBouncerCache';
import {
  FIXED_FALLBACK_BRAIN,
  genReviewBrainSupply,
} from '@src/domain.operations/route/genReviewBrainSupply';
import { genContextCliEmit } from '@src/domain.operations/route/guard/genContextCliEmit';
import { getRepoRootWithFallback } from '@src/domain.operations/route/guard/getRepoRootWithFallback';
import { isStoneMatchedByName } from '@src/domain.operations/route/guard/isStoneMatchedByName';
import { getStoneGuardExhaustedApprovalBypass } from '@src/domain.operations/route/guard/judge/getStoneGuardExhaustedApprovalBypass';
import { computeReviewThresholdVerdict } from '@src/domain.operations/route/guard/review/computeReviewThresholdVerdict';
import { computeReviewTotalsFromFiles } from '@src/domain.operations/route/guard/review/computeReviewTotalsFromFiles';
import { computeStoneReviewInputHash } from '@src/domain.operations/route/guard/review/computeStoneReviewInputHash';
import { asConcedeSeverity } from '@src/domain.operations/route/guard/review/peer/asConcedeSeverity';
import { asJudgeResidualLines } from '@src/domain.operations/route/guard/review/peer/asJudgeResidualLines';
import { computeResidualConcernCounts } from '@src/domain.operations/route/guard/review/peer/computeResidualConcernCounts';
import { enumRouteGuardReviewPeerFiles } from '@src/domain.operations/route/guard/review/peer/enumRouteGuardReviewPeerFiles';
import {
  formatReviewBudgetTopupCommand,
  ROUNDS_OFFERED_ON_TOPUP,
} from '@src/domain.operations/route/guard/review/peer/formatReviewBudgetTopupCommand';
import { getLatestReviewFilesPerSlug } from '@src/domain.operations/route/guard/review/peer/getLatestReviewFilesPerSlug';
import { getNonOverruledReviewFiles } from '@src/domain.operations/route/guard/review/peer/getNonOverruledReviewFiles';
import { getStoneConcededBetterConcernCounts } from '@src/domain.operations/route/guard/review/peer/getStoneConcededBetterConcernCounts';
import { getStoneDisputedConcernCounts } from '@src/domain.operations/route/guard/review/peer/getStoneDisputedConcernCounts';
import { getStoneLiveUrgentConcessionSlugs } from '@src/domain.operations/route/guard/review/peer/getStoneLiveUrgentConcessionSlugs';
import { asBudgetGrantWarrantLines } from '@src/domain.operations/route/guard/review/peer/meter/asBudgetGrantWarrantLines';
import { asGuardBudgetHeadLines } from '@src/domain.operations/route/guard/review/peer/meter/asGuardBudgetHeadLines';
import { asGuardBudgetUpdateLines } from '@src/domain.operations/route/guard/review/peer/meter/asGuardBudgetUpdateLines';
import { computeBudgetGrantRefusal } from '@src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal';
import { computeBudgetTargetSlugs } from '@src/domain.operations/route/guard/review/peer/meter/computeBudgetTargetSlugs';
import { computeLevelsInPlay } from '@src/domain.operations/route/guard/review/peer/meter/computeLevelsInPlay';
import { formatBudgetGrantRefusalLines } from '@src/domain.operations/route/guard/review/peer/meter/formatBudgetGrantRefusalLines';
import { getCurrentPeerMetersForStones } from '@src/domain.operations/route/guard/review/peer/meter/getCurrentPeerMetersForStones';
import { getDisputeSkippedReviewerSlugs } from '@src/domain.operations/route/guard/review/peer/meter/getDisputeSkippedReviewerSlugs';
import { getStoneGuardLevelClearance } from '@src/domain.operations/route/guard/review/peer/meter/getStoneGuardLevelClearance';
import { getUnrunUnlockedLevels } from '@src/domain.operations/route/guard/review/peer/meter/getUnrunUnlockedLevels';
import { JUDGE_LEVEL } from '@src/domain.operations/route/guard/review/peer/meter/JUDGE_LEVEL';
import type { GuardPeerMeterStatus } from '@src/domain.operations/route/guard/tree/formatGuardTree';
import { formatGuardUpgradeTree } from '@src/domain.operations/route/guard/tree/formatGuardUpgradeTree';
import { setRouteGuardsFromProvenance } from '@src/domain.operations/route/guard/upgrade/setRouteGuardsFromProvenance';
import { getOneStoneGuardApproval } from '@src/domain.operations/route/judges/getOneStoneGuardApproval';
import { getStoneGuardLevelsPoured } from '@src/domain.operations/route/judges/getStoneGuardLevelsPoured';
import { getStoneGuardOverruledLevels } from '@src/domain.operations/route/judges/getStoneGuardOverruledLevels';
import { setRoutePrivilegeAsGranted } from '@src/domain.operations/route/setRoutePrivilegeAsGranted';
import { stepRouteDrive } from '@src/domain.operations/route/stepRouteDrive';
import { stepRouteReview } from '@src/domain.operations/route/stepRouteReview';
import { stepRouteStatusLine } from '@src/domain.operations/route/stepRouteStatusLine';
import { stepRouteStoneAdd } from '@src/domain.operations/route/stepRouteStoneAdd';
import { stepRouteStoneDel } from '@src/domain.operations/route/stepRouteStoneDel';
import { stepRouteStoneGet } from '@src/domain.operations/route/stepRouteStoneGet';
import { stepRouteStoneSet } from '@src/domain.operations/route/stepRouteStoneSet';
import { asYieldModeForRewound } from '@src/domain.operations/route/stones/asYieldModeForRewound';
import { findStoneByName } from '@src/domain.operations/route/stones/findStoneByName';
import { getAllStones } from '@src/domain.operations/route/stones/getAllStones';
import { isPromisedActionSlugAbsent } from '@src/domain.operations/route/stones/isPromisedActionSlugAbsent';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = copies bytes read from a buffer into a new buffer
 * .why = encapsulates buffer slice for readability in stdin read loops
 */
const asBufferChunkCopy = (input: {
  buffer: Buffer;
  bytesRead: number;
}): Buffer => {
  return Buffer.from(input.buffer.subarray(0, input.bytesRead));
};

/**
 * .what = canonicalizes absolute path to relative, handles symlinks
 * .why = encapsulates path canonicalization for glob match in route.bounce
 */
const asRelativePathFromAbsolute = (input: {
  filePath: string;
  cwd: string;
  fsSync: { realpathSync: (p: string) => string };
}): string | null => {
  let cwdCanonical: string;
  let filePathCanonical: string;

  try {
    cwdCanonical = input.fsSync.realpathSync(input.cwd);
    const fileDir = path.dirname(input.filePath);
    const fileName = path.basename(input.filePath);
    try {
      const fileDirCanonical = input.fsSync.realpathSync(fileDir);
      filePathCanonical = path.join(fileDirCanonical, fileName);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        console.error(
          `[route.bounce] fail-open: parent dir does not exist: ${fileDir}`,
        );
        filePathCanonical = input.filePath;
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      console.error(
        `[route.bounce] fail-open: cwd does not exist: ${input.cwd}`,
      );
      cwdCanonical = input.cwd;
      filePathCanonical = input.filePath;
    } else {
      throw error;
    }
  }

  if (!filePathCanonical.startsWith(cwdCanonical)) {
    return null;
  }
  return path.relative(cwdCanonical, filePathCanonical);
};

/**
 * .what = extracts grant action from positional args or named option
 * .why = encapsulates grant action parse for readability in routeMutateGrant
 */
const getGrantActionFromArgs = (input: {
  argv: string[];
  grantOption: string | undefined;
}): string | undefined => {
  const positionalArgs = getCleanArgsFromArgv({ argv: input.argv }).filter(
    (arg) => !arg.startsWith('--'),
  );
  const grantIndex = positionalArgs.indexOf('grant');
  const positionalAction =
    grantIndex >= 0 ? positionalArgs[grantIndex + 1] : undefined;
  return positionalAction ?? input.grantOption;
};

/**
 * .what = valid stone passage actions for route.stone.set
 * .why = enables clear validation without inline enum check
 */
const VALID_STONE_PASSAGE_ACTIONS = new Set([
  'passed',
  'approved',
  'promised',
  'absorbed',
  'blocked',
  'rewound',
  'arrived',
  'overruled',
  'forced',
  'disputed',
  'conceded',
]);

/**
 * .what = checks if action is a valid stone passage action
 * .why = encapsulates action validation for readability
 */
const isValidStonePassageAction = (input: {
  action: string | undefined;
}): input is { action: string } => {
  return !!input.action && VALID_STONE_PASSAGE_ACTIONS.has(input.action);
};

/**
 * .what = extracts clean args from argv, skips node/entrypoint args and the `--` separator
 * .why = the canonical eval-mode slice now lives in one place (domain.operations/cli/
 *        getInvocationArgs), so route + learn share it instead of divergent copies
 */
const getCleanArgsFromArgv = (input: { argv: string[] }): string[] =>
  getInvocationArgs(input.argv);

/**
 * .what = the flags that are meaningless without a value, so a bare form is refused loud
 * .why = `parseArgs` coerces a value-less `--flag` to the string `'true'`, which is TRUTHY. for a
 *        boolean flag that is the whole point; for a flag that carries a path it fabricates a
 *        value, so the downstream required-guard never fires and the driver meets a confusing
 *        downstream verdict instead of the loud one that names what is owed
 *        (`rule.forbid.unexpected-defaults`).
 *
 * 🔴 .why a SET rather than an `if` per flag = the same reason `getStrayFlagRefusal` is a table.
 *    a flag absent from a set is visible beside its peers; a flag absent from an `if` chain is not,
 *    so the default for a new flag would be silence.
 *
 * 🔴 .why an ALLOWLIST rather than the inverse (declare the booleans, require a value for all
 *    else) = the inverse is the better shape and it is NOT CLEAN in this diff. it changes the
 *    default for every flag of every route command at once, and the boolean set must be exactly
 *    right or a command breaks silently. ⇒ caught as the shape of the fix rather than smuggled in
 *    (`rule.always.fix-forward-under-scouts-honor`).
 *
 * ⚠️ .note = THIS SET IS THE THIRD TABLE, and it is meant to be DELETED rather than grown.
 *    `parseArgs`'s lookahead guesses arity, `asFlagOwnership` (`getStrayFlagRefusal.ts`) holds
 *    ownership, and this holds arity for one flag — three tables, and each knows only part of
 *    what a flag is. ⇒ a future flag that takes a value, whose author threads `parseArgs` and
 *    `asFlagOwnership` (both of which they must touch) and omits this set (which they have no
 *    reason to know exists), re-creates the exact defect one flag over.
 *    the unified `FLAG_SCHEMA` that retires all three is worked out in
 *    `.dream/v2026_09_20.fix.two-flag-tables-and-neither-knows-arity.md`.
 *
 * .found = `arch-hazards-behavior` at i015 nitpick.1; the third-table hazard named independently
 *          by `enroll-impl-arch-defects` at i015 nitpick.4
 */
const FLAGS_THAT_REQUIRE_A_VALUE = new Set(['into']);

/**
 * .what = parses cli args into options object
 * .why = simple arg parser without external dependencies
 */
const parseArgs = (argv: string[]): Record<string, string | undefined> => {
  const args = getCleanArgsFromArgv({ argv });
  const options: Record<string, string | undefined> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        options[key] = value;
        i++;
      } else {
        // refuse a bare form where the flag carries a value — never fabricate one
        //
        // .note = the message stays GENERIC on purpose. `parseArgs` is shared by every route
        //    subcommand and does not know which one was invoked, so a hint that names one
        //    verb's syntax is decoy guidance for every other caller of the same flag.
        //
        // 🔴 it read `to promise a self review: --as promised --that <slug> --into <path>` until
        //    i016, and `--into` is reachable from `route.stone.get`, `route.guard.budget`,
        //    `route.bind.*`, and `route.bounce` alike ⇒ a driver on any of those met confident
        //    instructions for a command they had not run (`rule.forbid.surprises`;
        //    `enroll-impl-arch-defects` at i016, graded on the harm of a wrong mental model).
        //
        // ⇒ the per-verb hint belongs to the verb. `getStrayFlagRefusal`'s `asFlagOwnership`
        //    table is where a subcommand-specific message is owed, since it knows the verb.
        if (FLAGS_THAT_REQUIRE_A_VALUE.has(key))
          throw new BadRequestError(
            [
              `--${key} was passed with no value`,
              ``,
              `--${key} carries a value, so a bare --${key} says naught.`,
              ``,
              `pass the value it asks for, or drop the flag:`,
              `  --${key} <value>`,
            ].join('\n'),
            { flag: `--${key}` },
          );
        options[key] = 'true';
      }
    }
  }

  return options;
};

/**
 * .what = collects all values for a repeated key from argv
 * .why = enables multi-value support for --stone in route.stone.del
 */
const collectArgsMulti = (argv: string[], key: string): string[] => {
  const args = getCleanArgsFromArgv({ argv });
  const values: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === `--${key}`) {
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        values.push(value);
        i++;
      }
    }
  }

  return values;
};

/**
 * .what = collects stdin content synchronously
 * .why = enables @stdin source for route.stone.add
 */
const collectStdinContent = (): string | null => {
  // check if stdin has data (non-TTY means piped input)
  if (process.stdin.isTTY) return null;

  // read stdin synchronously via fd 0
  const chunks: Buffer[] = [];
  const BUFSIZE = 256;
  const buf = Buffer.allocUnsafe(BUFSIZE);

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const fsSync = require('fs');

  while (true) {
    try {
      const bytesRead = fsSync.readSync(0, buf, 0, BUFSIZE, null);
      if (bytesRead === 0) break;
      chunks.push(asBufferChunkCopy({ buffer: buf, bytesRead }));
    } catch (error) {
      // readSync throws on pipe closed (EAGAIN/EWOULDBLOCK) or EOF conditions
      // only break on expected EOF-like errors; rethrow unexpected I/O errors
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EAGAIN' ||
          error.code === 'EWOULDBLOCK' ||
          error.code === 'EOF')
      ) {
        break;
      }
      throw error;
    }
  }

  if (chunks.length === 0) return null;
  return Buffer.concat(chunks).toString('utf-8');
};

/**
 * .what = prints help for route.stone.get
 */
const printGetHelp = (): void => {
  console.log(
    `
route.stone.get - get next stone(s) from a route

usage:
  route.stone.get [options]

options:
  --stone <query>    stone query: @next-one, @next-all, or glob pattern (required)
  --route <path>     path to route directory (required)
  --say              echo stone content to stdout
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.set
 */
const printSetHelp = (): void => {
  console.log(
    `
route.stone.set - mark stone as passed, approved, promised, absorbed, disputed, conceded, blocked, rewound, arrived, overruled, or forced

usage:
  route.stone.set [options]

options:
  --stone <name>     stone name or glob pattern (required)
  --route <path>     path to route directory (required)
  --as <status>      status to set (required):
                       passed   - work complete, proceed
                       arrived  - work complete, get reviews
                       approved - human approval granted (human only)
                       promised - review.self promise made
                       absorbed - peer review response articulated
                       conceded - the reviewer is right on ONE concern; you will fix it
                       disputed - ONE concern is fine to continue; a council will rule
                       blocked  - stuck, need help
                       rewound  - clear validation state
                       overruled - bypass review thresholds (human only)
                       forced   - approve AND overrule (human only)
  --that <slug>      reviewer slug (required for --as promised / --as absorbed)
                       for --as absorbed, use the slug exactly as shown in the
                       reviewers-await-reply prompt (path-sanitized: slashes → dashes)
  --with <slug>      the reviewer an absorption is taken WITH
                       (required for --as disputed / --as conceded)
  --about <concern>  the ONE concern an absorption answers, by severity + 1-based ordinal
                       within that reviewer's latest report: blocker.1, nitpick.4
                       (required for --as disputed / --as conceded)
  --why <path>       path to a fulcrum/justification entry
                       (required for --as disputed — the argument a council reads;
                        optional for --as conceded — an extant path that records why you conceded)
  --severity <sev>   the harm grade of a concession: urgent | better
                       (REQUIRED for --as conceded — no ungraded concede; not for --as disputed)
                       urgent = a shipped harm — earns more budget, warns the human
                       (${asUrgentHarmSet({ separator: ' | ' })})
                       better = code idealism / maintenance — the floor, never earns budget
  --into <path>      the path you wrote your articulation to — copy it from the prompt
                       (REQUIRED for --as promised)
                       a diff needs both paths: with one, a mismatch reads "absent";
                       with both, the guard shows the diff and the command that moves it
  --help             show this help message

note:
  --as overruled bypasses reviewed? judge thresholds for overzealous reviewers
  --as forced is shorthand for --as approved + --as overruled
  --as conceded is the DEFAULT absorption of a concern: fix it, then re-arrive.
    --as disputed is an escalation — it asks a human council to rule at the close.

examples:
  route.stone.set --stone 1.vision --as arrived
  route.stone.set --stone 1.vision --as passed
  route.stone.set --stone 1.vision --as approved
  route.stone.set --stone 1.vision --as promised --that all-done \\
    --into .behavior/my-feature/review/self/for.1.vision._.all-done.md
  route.stone.set --stone 1.execute --as absorbed --that architect
  route.stone.set --stone 1.execute --as conceded --with architect --about nitpick.4 --severity better
  route.stone.set --stone 1.execute --as conceded --with architect --about blocker.2 --severity urgent
  route.stone.set --stone 1.execute --as disputed --with architect --about blocker.1 \\
    --why .fulcrums/inventory.of=fulcrums.case=F007-file-placement.md
  route.stone.set --stone 3.blueprint --as blocked
  route.stone.set --stone 3.blueprint --as rewound
  route.stone.set --stone 1.vision --as overruled
  route.stone.set --stone 1.vision --as forced
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.del
 */
const printDelHelp = (): void => {
  console.log(
    `
route.stone.del - delete unused stones from a route

usage:
  route.stone.del [options]

options:
  --stone <pattern>  pattern for stones to delete (required)
                     @all = match all stones
                     auto-wraps with *...* if no glob chars present
  --route <path>     path to route directory (required)
  --mode <plan|apply> plan = preview (default), apply = execute deletion
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.add
 */
const printAddHelp = (): void => {
  console.log(
    `
route.stone.add - add a stone to a route

usage:
  route.stone.add [options]

options:
  --stone <name>     stone name (required, e.g., 3.1.6.research.custom)
  --from <source>    content source (required):
                       @stdin = read from stdin
                       template($behavior/refs/...) = read from template file
                       '<text>' = literal content
  --route <path>     path to route directory (optional, uses bound route)
  --mode <plan|apply> plan = preview (default), apply = create stone
  --help             show this help message

examples:
  echo "content" | route.stone.add --stone 3.1.research.adhoc --from @stdin
  route.stone.add --stone 3.1.research.adhoc --from 'template($behavior/refs/template.research.adhoc.stone)'
  route.stone.add --stone 3.1.research.adhoc --from 'investigate the topic'
`.trim(),
  );
};

/**
 * .what = prints help for route.stone.judge
 */
const printJudgeHelp = (): void => {
  console.log(
    `
route.stone.judge - judge mechanism for guard validation

usage:
  route.stone.judge [options]

mechanisms:
  approved?          check if stone has human approval marker
  reviewed?          check if reviews pass thresholds (computes artifact hash automatically)

options:
  --mechanism <type> judge mechanism: approved? or reviewed? (required)
  --stone <name>     stone name (required)
  --route <path>     path to route directory (required)
  --allow-blockers   max blockers allowed (for reviewed?, default: 0)
  --allow-nitpicks   max nitpicks allowed (for reviewed?, default: 0)
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.set
 */
const printBindSetHelp = (): void => {
  console.log(
    `
route.bind.set - bind a route to the current branch

usage:
  route.bind.set [options]

options:
  --route <path>     path to route directory to bind (required)
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.get
 */
const printBindGetHelp = (): void => {
  console.log(
    `
route.bind.get - query the route bound to the current branch

usage:
  route.bind.get [options]

options:
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.bind.del
 */
const printBindDelHelp = (): void => {
  console.log(
    `
route.bind.del - remove the route bind for the current branch

usage:
  route.bind.del [options]

options:
  --help             show this help message
`.trim(),
  );
};

/**
 * .what = prints help for route.drive
 */
const printDriveHelp = (): void => {
  console.log(
    `
route.drive - echo current stone and pass command for bound route

usage:
  route.drive [options]

options:
  --route <path>     path to route directory (uses bound route if absent)
  --when <context>   hook context: hook.onBoot or hook.onStop
                     onBoot: show guidance, exit 0 (don't block session start)
                     onStop: show guidance, exit 2 (block premature stop)
  --help             show this help message

output:
  when the stone can self-drive, route.drive echoes the current stone + guidance.
  when it has halted, it switches to a halt message that names who owns each remedy:
    ✋ halted, stone marked blocked            a driver wall (--as blocked) — clear it
    👋 halted, peer reviewer budget exhausted  two levers, sorted by owner:
                                                converge with the reviewer — yours to run
                                                approve as-is — a human must grant
                                                the top-up takes the first slot ONLY where
                                                an urgent concession earned the round: the
                                                budget is a bound, so a grant needs a
                                                warrant on record
    💥 halted, guard malfunction               a reviewer or judge broke — a human must fix
  onStop honors the same halt: exit 2 keeps the route in motion, exit 0 allows a
  clean stop, exit 1 escalates a malfunction (per rule.require.exit-code-semantics).
  onBoot always exits 0 (it never blocks session start).

examples:
  route.drive                        # echo current stone
  route.drive --when hook.onBoot     # show stone, exit 0 (for onBoot hooks)
  route.drive --when hook.onStop     # show stone, exit 2 if unpassed (for onStop hooks)
`.trim(),
  );
};

/**
 * .what = prints help for route.status.line
 */
const printStatusLineHelp = (): void => {
  console.log(
    `
route.status.line - emit the current stone as a claude code status line

usage:
  route.status.line [options]

options:
  --help             show this help message

output:
  bound, stone + phase      🗿 <stone>, <phase> <emoji>
  bound, all stones passed  🗿 route complete 🌴🤙
  unbound / no stones       (empty line)

  the phase suffix names where inside the stone the driver is, tipped with an
  attention-color emoji at the end of the line (read the color, then the words):
    yield 🌾                 the stone yields its artifact — calm, no attention
    review.self, r7/r10 🔍   self-reviews, r{done}/r{total} — machine's turn
    review.peer, l3@i002 🔍  peer review, l{level}@i{rounds} — machine's turn
    judge, approved? 👋      a human must approve — attention needed
    ..., exhausted 👋        peer budget spent, a human must approve or extend
    ..., blocked ✋          blocked, act now — attention needed
    ..., malfunction 💥      a reviewer or judge broke, a human must fix

errors:
  a genuine fault is logged to stderr and exits non-zero; the harness then renders
  a blank line (the fault is surfaced on stderr, never silently hidden)

note:
  the claude code harness runs this with cwd = project root and renders stdout
  as the status line. it is invoked via the node -e command written into
  .claude/settings.json by init.claude.status-line.sh (not via rhx, whose banner
  would pollute the single-line output)

examples:
  node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeStatusLine())"
`.trim(),
  );
};

/**
 * .what = prints help for route.review
 */
const printReviewHelp = (): void => {
  console.log(
    `
route.review - review stone artifacts with change stats

usage:
  route.review [options]

options:
  --stone <name>     stone name to review (defaults to next blocked on approval)
  --route <path>     path to route directory (uses bound route if absent)
  --open <opener>    editor to open artifact in (vim, code, nvim, etc.)
  --help             show this help message

examples:
  route.review                    # review next stone blocked on approval
  route.review --open vim         # open artifact in vim (if single file)
  route.review --stone 3.blueprint --open code
`.trim(),
  );
};

/**
 * .what = runs one cli entrypoint inside the contract's usage-error boundary
 * .why = a `BadRequestError` is a USAGE fault, so the human owes the formatted message and
 *        exit 2 — never a node stack trace. each entrypoint carried its own copy of that
 *        allowlist, and every copy sat INSIDE the entrypoint, below `parseArgs` and below the
 *        required-flag checks. ⇒ the most common usage errors of all escaped it.
 *
 * 🔴 .note = the symptom, measured before this boundary existed:
 *
 *    $ rhx route.stone.get --route .behavior/…        # --stone omitted
 *    /home/<user>/<worktree>/dist/contract/cli/route.js:894
 *            throw new helpful_errors_1.BadRequestError('--stone is required', {
 *    …
 *    Node.js v22.21.0
 *
 *    a stack trace, the author's absolute path, the node version — and **exit 1**, not the
 *    exit 2 that `rule.require.exit-code-semantics` reserves for a caller-must-fix constraint.
 *    ⇒ a hook that reads the code read "server fault" where the truth was "you forgot a flag"
 *    (`repo-rules` blocker.2 at i018; the lane found it at `parseArgs`, and the hole is wider).
 *
 * ⚠️ .note = the inner allowlists are LEFT in place. most are now redundant with this
 *            boundary, and two are not — `routeStatusLine` reframes its guidance, and
 *            `routeStoneSet` tears down its progress spinner first. ⇒ the retirement is a read
 *            of thirteen call sites rather than a delete, and it is caught rather than bundled
 *            into a diff this wide.
 *
 * 🔴 .note = THREE entrypoints deliberately do NOT take this boundary, and each for its own
 *            reason. stated, because a later hand that "finishes the job" would break them:
 *   - `routeStoneDel` / `routeStoneAdd` already parse INSIDE their own try, so they never had
 *     the hole. wrapping them would add an outer layer that can never fire
 *   - 🔴 `routeBounce` is a PreToolUse hook, and its docblock records why it has no catch:
 *     *"Claude Code treats crashed hooks as 'error but allow' (fail-open semantics)"*. a
 *     boundary here would turn a crash that FAILS OPEN into an exit 2 that BLOCKS every write
 *     in the session. ⇒ its missing catch is the contract, not an omission
 */
const runCliEntrypoint = async (run: () => Promise<void>): Promise<void> => {
  try {
    await run();
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.drive skill
 * .why = echoes current stone and pass command as GPS-like guidance
 */
export const routeDrive = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printDriveHelp();
      return;
    }

    try {
      // parse --when parameter
      const when =
        options.when === 'hook.onBoot' || options.when === 'hook.onStop'
          ? options.when
          : undefined;

      const result = await stepRouteDrive({
        route: options.route,
        when,
      });

      if (result.emit?.stdout) {
        console.log(result.emit.stdout);
      }

      if (result.emit?.stderr) {
        if (result.emit.stderr.reason) {
          console.error(result.emit.stderr.reason);
        }
        process.exit(result.emit.stderr.code);
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = maps a renderer fault to operator-facing guidance for stderr
 * .why = the shared branch-bind lookup advises `--route` to disambiguate a
 *        multi-bind, which is correct for the `--route`-taking subcommands
 *        (route.drive, route.stone.*) but a dead end for this entrypoint — the
 *        status line takes no `--route` flag (it derives the branch-bound route
 *        from cwd). echoing that advice sends an operator down a path that is
 *        silently ignored here, so for the multi-bind case we emit status-line-
 *        scoped guidance (unbind the extras). every other fault passes through
 *        its own message. this only reframes the logged summary; the original
 *        error is still rethrown by the caller (fail-loud, never hidden).
 */
const asStatusLineFaultGuidance = (input: { error: unknown }): string => {
  const message =
    input.error instanceof Error ? input.error.message : String(input.error);

  // the multi-bind ambiguity: drop the `--route` advice (unsupported here)
  if (
    input.error instanceof BadRequestError &&
    message.includes('multiple routes bound to this branch')
  )
    return 'multiple routes bound to this branch — unbind the extra route(s) so the status line can pick one';

  // any other fault: surface its own message
  return message;
};

/**
 * .what = cli entrypoint for route.status.line skill
 * .why = emits the current stone as a claude code status line (🗿 <stone>)
 *
 * .note = the harness runs this with cwd = project root, so the bound-route
 *         lookup scans from cwd directly (no chdir, no stdin payload needed).
 *
 * .note = fail-open by contract, but via the harness — not a swallowed error.
 *         an unbound or complete route yields an empty line; a genuine fault is
 *         logged loudly to stderr and rethrown, so the process exits non-zero and
 *         the harness renders a blank line. a broken status line never breaks the
 *         session, yet the fault is surfaced (rule.forbid.failhide +
 *         rule.require.failloud) rather than silently hidden.
 */
export const routeStatusLine = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printStatusLineHelp();
      return;
    }

    try {
      // compute and emit the status line (empty when unbound or complete)
      const result = await stepRouteStatusLine({ route: null });
      console.log(result.line);
    } catch (error) {
      // fail loud, not hidden: log the fault to stderr (never stdout, which the
      // harness renders as the line) and rethrow so the process exits non-zero.
      // the harness blanks the line on non-zero exit, so the session is safe while
      // the fault stays observable (not a failhide — the error is rethrown).
      // reframe the guidance to this entrypoint (see asStatusLineFaultGuidance) so
      // an operator is not pointed at an unsupported `--route` flag.
      console.error(
        `[route.status.line] fault: ${asStatusLineFaultGuidance({ error })}`,
      );
      // a multi-bind is a caller-must-fix constraint (unbind the extra route), so
      // exit 2 per rule.require.exit-code-semantics, as the peer routeDrive does.
      // any other fault is a genuine server-fix path: rethrow for a non-zero exit.
      if (error instanceof BadRequestError) process.exit(2);
      throw error;
    }
  });

/**
 * .what = cli entrypoint for route.review skill
 * .why = enables foremen to scan artifacts and review in editor
 */
export const routeReview = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printReviewHelp();
      return;
    }

    // validate opener command exists in PATH
    if (options.open) {
      try {
        execSync(`command -v ${options.open}`, { stdio: 'pipe' });
      } catch (error) {
        // allowlist command-not-found (exit code 1 or 127): format nicely and exit 2
        if (error && typeof error === 'object' && 'status' in error) {
          const errorLines = [
            '🦉 look for the light',
            '',
            '🗿 route.review',
            `   └─ ✗ opener '${options.open}' not found in PATH`,
          ];
          console.error(errorLines.join('\n'));
          process.exit(2);
        }
        // rethrow unexpected errors (no failhide)
        throw error;
      }
    }

    try {
      const result = await stepRouteReview({
        route: options.route,
        stone: options.stone,
        open: options.open,
      });

      if (result.emit.stdout) {
        console.log(result.emit.stdout);
      }

      if (result.emit.stderr) {
        console.error(result.emit.stderr.reason);
        process.exit(result.emit.stderr.code);
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = cli entrypoint for route.bind.set skill
 * .why = binds a route to the current branch for auto-lookup
 */
export const routeBindSet = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printBindSetHelp();
      return;
    }

    if (!options.route) {
      throw new BadRequestError('--route is required', {
        hint: '--help for usage',
      });
    }

    try {
      const result = await setRouteBind({ route: options.route });
      console.log(`bound route: ${result.route}`);
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = cli entrypoint for route.bind.get skill
 * .why = queries the route bound to the current branch
 */
export const routeBindGet = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printBindGetHelp();
      return;
    }

    try {
      const result = await getRouteBind();
      if (result) {
        console.log(`bound to: ${result.route}`);
      } else {
        console.log('not bound');
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = cli entrypoint for route.bind.del skill
 * .why = removes the route bind for the current branch
 */
export const routeBindDel = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printBindDelHelp();
      return;
    }

    try {
      const result = await delRouteBind();
      if (result.deleted) {
        console.log('unbound route');
      } else {
        console.log('not bound (no bind to remove)');
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = looks up route from bind
 * .why = enables auto-detect fallback for all route.stone.* commands
 */
const getRouteFromBindOrNull = async (): Promise<string | null> => {
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) return bind.route;
  return null;
};

/**
 * .what = gets route from option or bind, throws if neither available
 * .why = encapsulates route lookup for readability in orchestrators
 */
const getRouteOrThrow = async (input: {
  route: string | undefined;
}): Promise<string> => {
  if (input.route) return input.route;
  const routeFromBind = await getRouteFromBindOrNull();
  if (routeFromBind) return routeFromBind;
  throw new BadRequestError(
    'no route bound to this branch. use --route or route.bind',
  );
};

/**
 * .what = cli entrypoint for route.stone.get skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneGet = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printGetHelp();
      return;
    }

    if (!options.stone) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }
    const route = await getRouteOrThrow({ route: options.route });

    try {
      const result = await stepRouteStoneGet({
        stone: options.stone as '@next-one' | '@next-all' | string,
        route,
        say: options.say === 'true',
      });

      if (result.emit) {
        console.log(result.emit.stdout);
      } else if (result.stones.length > 0) {
        console.log(result.stones.map((s) => s.name).join('\n'));
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = strips owl header and trims lead newlines from stdout
 * .why = owl header is printed early for progress display, must remove to avoid duplication
 */
const asStdoutWithoutOwlHeader = (input: {
  stdout: string;
  owlHeader: string;
}): string => {
  return input.stdout.replace(input.owlHeader, '').replace(/^\n+/, '');
};

/**
 * .what = determines if guard requires exit with code 2
 * .why = encapsulates exit decision logic for guard block or approval states
 *
 * 🔴 a CONCEDE exits 2, a DISPUTE exits 0 (r2 n2). the two diverge on the HOLD: a concede
 *    keeps it — the driver owes a fix and a re-arrive, so exit 0 would tell a hook the stone
 *    is clear when it is not (rule.forbid.failhide). exit 2 is the constraint code: the driver
 *    must act. a dispute sheds its concern from the tally and the road may advance, so the
 *    command itself succeeded and forces no exit — the driver's next act is `--as passed`.
 */
const isGuardExitRequired = (input: {
  passed: boolean | undefined;
  challenged: boolean | undefined;
  approved: boolean | undefined;
  overruled: boolean | undefined;
  forced: boolean | undefined;
  absorbed: boolean | undefined;
  conceded: boolean | undefined;
}): boolean => {
  return (
    input.passed === false ||
    input.challenged === true ||
    input.approved === false ||
    input.overruled === false ||
    input.forced === false ||
    input.absorbed === false ||
    input.conceded === true
  );
};

/**
 * .what = cli entrypoint for route.stone.set skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneSet = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printSetHelp();
      return;
    }

    // validate --stone required
    if (!options.stone)
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });

    // validate --route required (or get from bind)
    const route = await getRouteOrThrow({ route: options.route });

    // validate --as required and valid
    if (!isValidStonePassageAction({ action: options.as })) {
      throw new BadRequestError(
        '--as must be "passed", "approved", "promised", "absorbed", "conceded", "disputed", "blocked", "rewound", "arrived", "overruled", or "forced"',
        { hint: '--help for usage' },
      );
    }

    // validate --that required for promised
    if (isPromisedActionSlugAbsent({ action: options.as, slug: options.that }))
      throw new BadRequestError('--that is required when --as is "promised"', {
        hint: '--help for usage',
      });

    // validate and derive yield mode (only for rewound)
    const yieldMode = asYieldModeForRewound({
      asAction: options.as,
      hard: options.hard,
      soft: options.soft,
      yield: options.yield,
    });

    // detect TTY for human vs agent
    // allow approval in test/CI environments (Jest sets NODE_ENV=test, CI runners set CI=true)
    const isTestEnv =
      process.env.NODE_ENV === 'test' || process.env.CI === 'true';
    const isTTY = isTestEnv || (process.stdout.isTTY ?? false);

    // construct progress context (stdout so it appears with tree)
    const progress = genContextCliEmit({ stderr: process.stdout });

    // build a LAZY memoize-on-success supplier of the review-tally sub-brain
    // .why = the guard's fallback tactic (getReviewCountsViaBrain) needs a brain ONLY when a
    //        reviewer phrased its verdict in prose. the supplier defers the build to that first
    //        fallback, so a numeric-only stone-pass never constructs a brain (zero cost).
    // .note = env: 'prep' mirrors review.ts; keyrack auto-unlocks locked keys on first fetch
    const reviewBrainSupply = genReviewBrainSupply({
      choice: FIXED_FALLBACK_BRAIN,
      creds: { keyrack: { owner: 'ehmpath', env: 'prep' } },
    });

    // print owl header early so progress appears below it
    const owlHeader = `🦉 the way speaks for itself`;
    console.log(owlHeader);

    try {
      const result = await stepRouteStoneSet(
        {
          stone: options.stone,
          route,
          as: options.as as
            | 'passed'
            | 'approved'
            | 'promised'
            | 'absorbed'
            | 'blocked'
            | 'rewound'
            | 'arrived'
            | 'overruled'
            | 'forced'
            | 'disputed'
            | 'conceded',
          that: options.that,
          with: options.with,
          about: options.about,
          why: options.why,
          severity: asConcedeSeverity({ raw: options.severity }),
          into: options.into,
          yield: yieldMode,
        },
        { ...progress.context, ...reviewBrainSupply, isTTY },
      );

      progress.done();

      if (result.emit) {
        const stdoutWithoutOwl = asStdoutWithoutOwlHeader({
          stdout: result.emit.stdout,
          owlHeader,
        });
        console.log(''); // blank line after progress, before tree
        console.log(stdoutWithoutOwl);
        if (result.emit.stderr) {
          console.error('');
          console.error(result.emit.stderr);
        }
      }

      // exit with code 2 for intentional guard block or approval/overrule/force blocked
      if (
        isGuardExitRequired({
          passed: result.passed,
          challenged: result.challenged,
          approved: result.approved,
          overruled: result.overruled,
          forced: result.forced,
          absorbed: result.absorbed,
          conceded: result.conceded,
        })
      ) {
        process.exit(2);
      }
    } catch (error) {
      progress.done();
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = cli entrypoint for route.stone.del skill
 * .why = enables shell invocation via package-level import
 */
export const routeStoneDel = async (): Promise<void> => {
  try {
    const options = parseArgs(process.argv);

    if (options.help) {
      printDelHelp();
      return;
    }

    // collect all --stone values for multi-pattern support
    const stones = collectArgsMulti(process.argv, 'stone');
    if (stones.length === 0) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }

    const route = await getRouteOrThrow({ route: options.route });

    // parse mode with default to plan
    const mode = options.mode === 'apply' ? 'apply' : ('plan' as const);

    const result = await stepRouteStoneDel({
      stones,
      route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.add skill
 * .why = enables drivers to add stones to their route on the fly
 */
export const routeStoneAdd = async (): Promise<void> => {
  try {
    const options = parseArgs(process.argv);

    if (options.help) {
      printAddHelp();
      return;
    }

    // validate --stone is provided
    if (!options.stone) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }

    // validate --from is provided
    if (!options.from) {
      throw new BadRequestError('--from is required', {
        hint: '--help for usage',
      });
    }

    // get route from option or bind
    const route = await getRouteOrThrow({ route: options.route });

    // collect stdin if source is @stdin
    const stdin = options.from === '@stdin' ? collectStdinContent() : null;

    // parse mode with default to plan
    const mode = options.mode === 'apply' ? 'apply' : ('plan' as const);

    const result = await stepRouteStoneAdd({
      stone: options.stone,
      source: options.from,
      stdin,
      route,
      mode,
    });

    if (result.emit) {
      console.log(result.emit.stdout);
    }
  } catch (error) {
    // allowlist BadRequestError: format nicely and exit 2
    if (error instanceof BadRequestError) {
      console.error(`error: ${error.message}`);
      process.exit(2);
    }
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.stone.judge skill
 * .why = enables deterministic judge mechanisms for guard validation
 */
export const routeStoneJudge = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    if (options.help) {
      printJudgeHelp();
      return;
    }

    if (!options.mechanism) {
      throw new BadRequestError('--mechanism is required', {
        hint: '--help for usage',
      });
    }
    if (!options.stone) {
      throw new BadRequestError('--stone is required', {
        hint: '--help for usage',
      });
    }
    const route = await getRouteOrThrow({ route: options.route });

    try {
      if (options.mechanism === 'approved?') {
        await judgeApproved({ stone: options.stone, route });
      } else if (options.mechanism === 'reviewed?') {
        const allowBlockers = parseInt(options['allow-blockers'] ?? '0', 10);
        const allowNitpicks = parseInt(options['allow-nitpicks'] ?? '0', 10);
        await judgeReviewed({
          stone: options.stone,
          route,
          allowBlockers,
          allowNitpicks,
        });
      } else {
        throw new BadRequestError(`unknown mechanism "${options.mechanism}"`, {
          hint: '--help for usage',
        });
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      // rethrow unexpected errors (no failhide)
      throw error;
    }
  });

/**
 * .what = judge mechanism for human approval check
 * .why = enables gated milestones that require human sign-off
 */
const judgeApproved = async (input: {
  stone: string;
  route: string;
}): Promise<void> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findStoneByName({ stones, name: input.stone });
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(2);
  }

  // check for approval marker
  const approval = await getOneStoneGuardApproval({
    stone: stoneMatched,
    route: input.route,
  });

  if (approval) {
    console.log('passed: true');
    console.log('reason: human approval found');
  } else {
    const approveCmd = `rhx route.stone.set --stone ${input.stone} --as approved`;
    const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
    console.log('passed: false');
    console.log('reason: wait for human approval');
    console.log('');
    console.log('✋ halted, human approval required');
    console.log('   ├─ please ask your human to');
    console.log(`   │  └─ ${approveCmd}`);
    console.log('   │');
    console.log('   └─ after human approves, run');
    console.log(`      └─ ${passCmd}`);
    process.exit(2);
  }
};

/**
 * .what = judge mechanism for review threshold check
 * .why = enables milestones gated on code review quality
 */
const judgeReviewed = async (input: {
  stone: string;
  route: string;
  allowBlockers: number;
  allowNitpicks: number;
}): Promise<void> => {
  // find the stone to compute artifact hash
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findStoneByName({ stones, name: input.stone });
  if (!stoneMatched) {
    console.log('passed: false');
    console.log('reason: stone not found');
    process.exit(2);
  }

  // load human overrules, scoped per review level
  // .why = overrule is level-scoped: an overrule at level N forgives only the
  //        reviewers at level N, so higher levels still gate passage
  const overruledLevels = await getStoneGuardOverruledLevels({
    stone: stoneMatched,
    route: input.route,
  });

  // .note = a judge-rung overrule (JUDGE_LEVEL) forgives this reviewed? judge ONLY when there are
  //         no peer review files to tally (a judges-only stone, or a stone with no peer reviews) —
  //         that check lives inside the `reviewFiles.length === 0` branch below. it is NOT applied
  //         when peer review files DO exist: a real peer-blocker breach must still block, because a
  //         judge-rung overrule (placed to forgive a broken co-judge) is not a key past real peer
  //         blockers — the exact skeleton-key defect this behavior exists to close, one tier up
  //         (define.review.human-forgiveness.md). peer blockers are forgiven at the peer level, the
  //         judge rung forgives only the judge.

  // compute artifact hash to find reviews for current content
  const hash = await computeStoneReviewInputHash({
    stone: stoneMatched,
    route: input.route,
  });

  // find review files for this stone, across EVERY hash
  // 🔴 .why not scoped to `hash` = the meter (the tree a human reads) crosses hashes keyed by
  //    slug; this judge read the current hash alone. so once a reviewer exhausted, an edit moved
  //    the hash and that reviewer's verdict left the tally while the tree still printed it. the
  //    two readers disagreed, and it failed in BOTH directions: every reviewer exhausted tallies
  //    EMPTY (a false block, `no review files found for hash …`), one reviewer exhausted
  //    UNDERCOUNTS (a false pass, which discharges a verdict no one addressed — the same exit
  //    this behavior exists to shut). the latest-per-slug pick below restores the one reach
  //    (routeStoneJudgeTally.acceptance.test.ts)
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone,
  });

  if (reviewFiles.length === 0) {
    // if every level is terminal with an exhausted reviewer and a human approved, pass
    const { bypass } = await getStoneGuardExhaustedApprovalBypass({
      stone: stoneMatched,
      hash,
      route: input.route,
      overruledLevels,
    });
    if (bypass) {
      console.log('passed: true');
      console.log('reason: human approval overrides exhausted reviewers');
      return;
    }

    // the judge is the top rung: a human overrule of JUDGE_LEVEL forgives the judge itself.
    // .why = with no peer review files there are NO peer blockers to mask, so to forgive the judge
    //        rung here is safe — it clears exactly this reviewed? judge (a judges-only one-rung
    //        ladder, or a stone whose reviewed? blocks on absent reviews), never a peer level (there
    //        are none). the real-peer-blocker path lives past this branch and is untouched, so a
    //        judge-rung overrule can never key past real peer blockers (see .note above).
    if (overruledLevels.has(JUDGE_LEVEL)) {
      console.log('passed: true');
      console.log('reason: human overruled the judge rung');
      return;
    }

    console.log('passed: false');
    console.log(`reason: no review files found for hash ${hash.slice(0, 8)}`);
    process.exit(2);
  }

  // get the latest review per SLUG (later iterations supersede earlier, across every hash)
  // .why slug, not index = "latest" is a property of the REVIEWER. an index is a position in the
  //      guard's declaration order, so it cannot carry a verdict across the hash move above
  const latestReviewFiles = getLatestReviewFilesPerSlug({ reviewFiles });

  // check for exhausted reviewers with human approval override (single-sourced op)
  // .why = per wish: "once they approve for either, they approve for both"
  //        if reviewer is exhausted AND stone is approved, bypass blocker check
  const { peerStatuses, bypass } = await getStoneGuardExhaustedApprovalBypass({
    stone: stoneMatched,
    hash,
    route: input.route,
    overruledLevels,
  });
  if (bypass) {
    console.log('passed: true');
    console.log('reason: human approval overrides exhausted reviewers');
    return;
  }

  // close the ready-higher-level hole: block if a level is UNLOCKED (every lower level is
  // clear-for-unlock — e.g. a lower level was overruled) yet still has an unrun (queued)
  // reviewer. a queued reviewer produces no review file, so the file tally below cannot see it —
  // exactly what let an unlocked-but-unrun higher level slip past this judge when invoked on its
  // own (define.invariant.review.peer.passage: pass ⟺ every peer guard terminal).
  // .why unlocked-only = a level queued BEHIND a still-live lower level is normal ladder order,
  //      not the hole — that lower level's own review file already blocks the tally, and its
  //      rejection is the true reason (so C4's "l1 blocks" must not be masked as "l3 queued").
  // .why not the tally = the file tally keeps the pass/fail decision; its SUM-of-blockers
  //      semantics differ from a per-reviewer check for allow>0 guards, so this only detects the
  //      unrun gap. this judge IS the guard's `reviewed?` command (runStoneGuardJudges shells out to
  //      `rhx route.stone.judge`), so the check is real defense-in-depth on EVERY path — not dead
  //      code: the normal --as passed flow runs every unlocked level first (so it rarely fires
  //      there), and the standalone `route.stone.judge` path relies on it. do NOT delete it.
  const levelClearance = getStoneGuardLevelClearance({
    reviewers: peerStatuses.map((s) => ({
      level: s.level,
      verdict: s.verdict,
    })),
    overruledLevels,
  });
  // the level-unlock LATCH — a level that has already poured stays unlocked, so a
  // reviewer queued at it is a real gap the tally cannot see
  // .why = the runner reads the same predicate with the same input; to omit it here
  //        would let the two disagree exactly where the latch applies
  //        (define.invariant.review.peer.level-unlock-is-a-latch)
  const levelsPoured = await getStoneGuardLevelsPoured({
    stone: stoneMatched,
    route: input.route,
  });
  const unrunUnlockedLevels = getUnrunUnlockedLevels({
    levelClearance,
    levelsPoured,
  });
  if (unrunUnlockedLevels.length > 0) {
    console.log('passed: false');
    console.log(
      `reason: review level ${unrunUnlockedLevels.join(', ')} not yet run (still queued) — run \`rhx route.stone.set --stone ${stoneMatched.name} --as arrived\` to run it`,
    );
    process.exit(2);
  }

  // forgive reviews at overruled levels: their blockers do not gate passage
  // .why = the human waved a stuck level through; higher levels still count
  const peerReviews = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const reviewFilesToCount = getNonOverruledReviewFiles({
    reviewFiles: latestReviewFiles,
    peerReviews,
    overruledLevels,
  });

  // compute total blockers and nitpicks from non-overruled reviews
  const { totalBlockers, totalNitpicks } = await computeReviewTotalsFromFiles({
    reviewFiles: reviewFilesToCount,
  });

  // subtract the concerns the driver SHED from the tally against the current generation.
  // .why = two absorptions shed a concern from the judge's count, and both are at the grain of ONE
  //        concern (S07): the review still ran, its file still stands, only its count is dropped.
  //   - DISPUTED — the driver holds the concern is fine to continue; a council rules later.
  //   - CONCEDED `better` — hard-capped by the budget (S16). the judge only runs at terminality,
  //     so a `better` concession that survives to here is one the driver could not fix within
  //     budget: the maintenance floor was met, and it passes as tech debt with NO budget increase
  //     and NO human (`define.invariant.review.peer.budget.urgent-earns-budget`).
  // 🔴 an `urgent` concession is NOT shed — it ships nameable harm, so it KEEPS the hold and
  //    earns a human's glance and a round.
  // 🔴 .why per-concern = a lane-grain exclusion would shed every concern that lane raised, the
  //    driver's OWN concessions among them (rule.forbid.suppression-of-undeclared-concerns)
  const [disputed, concededBetter] = await Promise.all([
    getStoneDisputedConcernCounts({
      route: input.route,
      stone: stoneMatched.name,
    }),
    getStoneConcededBetterConcernCounts({
      route: input.route,
      stone: stoneMatched.name,
    }),
  ]);

  // clamped at zero: a stale absorption must never manufacture headroom the tally did not have
  const residual = computeResidualConcernCounts({
    totalBlockers,
    totalNitpicks,
    shedBlockers: disputed.blockers + concededBetter.blockers,
    shedNitpicks: disputed.nitpicks + concededBetter.nitpicks,
  });

  // check thresholds
  const verdict = computeReviewThresholdVerdict({
    totalBlockers: residual.blockers,
    totalNitpicks: residual.nitpicks,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  });

  // output verdict
  console.log(`passed: ${verdict.passed}`);
  console.log(`reason: ${verdict.reason}`);

  // 🔴 the arithmetic lines, rendered ONLY where a dispute moved the sum
  // .note = these are human diagnostics, never the guard-parsed verdict — the guard
  //         reads `passed:`/`reason:` on stdout above. on a fail this block reaches
  //         exit(2), so the diagnostics route to stderr with the urgent prose below, never
  //         to stdout before a non-zero exit (rule.forbid.stdout-on-exit-errors)
  for (const line of asJudgeResidualLines({
    disputed,
    residual,
    allowBlockers: input.allowBlockers,
    allowNitpicks: input.allowNitpicks,
  }))
    console.error(line);

  if (!verdict.passed) {
    // 🔴 when a LIVE URGENT concession holds the stone, the judge names the human whose budget
    //    grant is the remedy — the same shape the `approved?` judge uses for absent approval
    //    (define.invariant.review.peer.judge.urgent-guides-the-budget-ask). a `better`/none hold
    //    names no human: its remedy is the driver's own top-up.
    const urgentSlugs = await getStoneLiveUrgentConcessionSlugs({
      route: input.route,
      stone: stoneMatched.name,
    });
    if (urgentSlugs.length > 0) {
      // the ONE canonical top-up builder, at the shared round count — the judge and the concede
      // ack once drifted (`--add 1` here, `2` there), so both read the same const now
      // (r001.n3 / r004.n1 / r006.n2 / r009.n1)
      const budgetCmd = formatReviewBudgetTopupCommand({
        add: ROUNDS_OFFERED_ON_TOPUP,
        peer: null,
        stone: stoneMatched.name,
      });
      const passCmd = `rhx route.stone.set --stone ${stoneMatched.name} --as passed`;
      // the halt prose is an ERROR surfaced before exit(2), so it goes to stderr — the verdict
      // lines above stay on stdout, which the guard parses on a pass too
      // (rule.forbid.stdout-on-exit-errors)
      console.error('');
      console.error(
        `✋ halted, an urgent concession stands — ${urgentSlugs.join(', ')}`,
      );
      // 🔴 this clause matches WARN_TEXT_CONCESSION_URGENT's words exactly (r009 i012
      //    nitpick.3) — every other concession surface renders that shared constant, and
      //    a driver who meets this halt then route.drive's must read one fact once
      console.error(
        '   ├─ its harm ships if unfixed, so this stone earns more budget',
      );
      console.error('   ├─ please ask your human to');
      console.error(`   │  └─ ${budgetCmd}`);
      console.error('   │');
      console.error('   └─ after the grant, address the concession, then run');
      console.error(`      └─ ${passCmd}`);
    }
    process.exit(2);
  }
};

/**
 * .what = prints help for route.bounce
 */
const printBounceHelp = (): void => {
  console.log(
    `
route.bounce - artifact gate enforcement for protected files

usage:
  route.bounce [options]

options:
  --mode <type>      mode: hook = pretool check, list = show protected files (default)
  --help             show this help message

stdin (for --mode hook):
  claude code PreToolUse hooks pipe JSON with tool_input.file_path

examples:
  route.bounce                              # list protected artifacts
  route.bounce --mode hook                  # pretool check via stdin (exit 2 if blocked)
`.trim(),
  );
};

/**
 * .what = reads tool input from stdin synchronously
 * .why = claude code PreToolUse hooks receive tool input as JSON on stdin
 *
 * stdin format from Claude Code:
 * {
 *   "hook_event_name": "PreToolUse",
 *   "tool_name": "Write" | "Edit" | ...,
 *   "tool_input": { "file_path": "/absolute/path/...", ... }
 * }
 */
const readToolInputFromStdin = (): {
  tool_name?: string;
  tool_input?: { file_path?: string };
} | null => {
  // first check RHACHET_STDIN env var (set by shell wrapper to work around node -e stdin issues)
  const envStdin = process.env.RHACHET_STDIN;
  if (envStdin) {
    try {
      return JSON.parse(envStdin);
    } catch (error) {
      // JSON.parse throws SyntaxError for malformed JSON; fail open for invalid input
      // note: stderr output makes this observable per rule.prefer.helpful-error-wrap
      if (error instanceof SyntaxError) {
        console.error(
          `[route.bounce] fail-open: RHACHET_STDIN contains invalid JSON: ${error.message}`,
        );
        return null;
      }
      throw error;
    }
  }

  // fallback: check if stdin has data available (non-TTY means piped input)
  if (process.stdin.isTTY) return null;

  // read stdin synchronously via fd 0
  const chunks: Buffer[] = [];
  const BUFSIZE = 256;
  const buf = Buffer.allocUnsafe(BUFSIZE);
  let bytesRead: number;

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const fsSync = require('fs');

  while (true) {
    try {
      bytesRead = fsSync.readSync(0, buf, 0, BUFSIZE, null);
      if (bytesRead === 0) break;
      chunks.push(asBufferChunkCopy({ buffer: buf, bytesRead }));
    } catch (error) {
      // readSync throws on pipe closed (EAGAIN/EWOULDBLOCK) or EOF conditions
      // only break on expected EOF-like errors; rethrow unexpected I/O errors
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EAGAIN' ||
          error.code === 'EWOULDBLOCK' ||
          error.code === 'EOF')
      ) {
        break;
      }
      throw error;
    }
  }

  if (chunks.length === 0) return null;

  const input = Buffer.concat(chunks).toString('utf-8').trim();
  if (!input) return null;

  try {
    return JSON.parse(input);
  } catch (error) {
    // allowlist SyntaxError from JSON.parse: return null for invalid JSON
    if (error instanceof SyntaxError) return null;
    // rethrow unexpected errors (no failhide)
    throw error;
  }
};

/**
 * .what = cli entrypoint for route.bounce skill
 * .why = enforces artifact gate protection before file writes/edits
 */
export const routeBounce = async (): Promise<void> => {
  const options = parseArgs(process.argv);

  if (options.help) {
    printBounceHelp();
    return;
  }

  const mode = options.mode ?? 'list';

  // hook mode: routeBounceHook handles all expected errors internally (returns early)
  // any unexpected error will crash with stack trace (fail-fast)
  // note: Claude Code treats crashed hooks as "error but allow" (fail-open semantics)
  if (mode === 'hook') {
    await routeBounceHook();
    return;
  }

  // list mode: no catch block (fail-fast with stack trace for debug)
  await routeBounceList();
};

/**
 * .what = hook mode implementation for route.bounce
 * .why = checks if a file mutation is blocked by an unpassed stone guard
 */
const routeBounceHook = async (): Promise<void> => {
  // load bouncer cache
  const cache = await getRouteBouncerCache();

  // read tool input from stdin (claude code PreToolUse provides tool input via stdin)
  const toolInput = readToolInputFromStdin();

  // only check Write and Edit tools (file mutation operations)
  // todo: Bash tool could bypass protection via redirects like `echo "..." > src/file.ts`
  //       for now we fail open on Bash. we assume bonintent robots. revisit if malintent escapes via cat/redirects.
  const toolName = toolInput?.tool_name;
  if (toolName !== 'Write' && toolName !== 'Edit') {
    return; // not a file mutation tool, allow through
  }

  // extract file_path from nested tool_input (claude code sends { tool_input: { file_path } })
  let filePath = toolInput?.tool_input?.file_path;

  if (!filePath) {
    // no path to check, allow through (fail open)
    return;
  }

  // convert absolute path to relative for glob match
  if (path.isAbsolute(filePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const fsSync = require('fs');
    const relativePath = asRelativePathFromAbsolute({
      filePath,
      cwd: process.cwd(),
      fsSync,
    });
    if (relativePath === null) {
      // path outside repo, cannot match relative globs, allow through
      return;
    }
    filePath = relativePath;
  }

  const decision = getDecisionIsArtifactProtected({
    path: filePath,
    cache,
  });

  if (decision.blocked && decision.protection) {
    // output blocked feedback in zen format per blueprint
    const lines = [
      '🦉 patience, friend',
      '',
      '🗿 route.bounce',
      '   ├─ blocked',
      `   │  ├─ artifact = ${filePath}`,
      `   │  └─ guard = ${path.basename(decision.protection.guard)}`,
      '   │',
      '   ├─ a journey of a thousand miles begins with a single step 🪷',
      '   │  ├─',
      '   │  │',
      `   │  │  this artifact is locked until stone ${decision.protection.stone} is passed.`,
      '   │  │',
      '   │  │  the way cannot be rushed. each stone builds on the last.',
      '   │  │',
      '   │  └─',
      '   │',
      '   └─ to pass this stone and unlock this gate, run',
      '      └─ rhx route.drive',
    ];
    console.error(lines.join('\n'));
    process.exit(2);
  }

  // not blocked, exit 0 silently for hook
};

/**
 * .what = list mode implementation for route.bounce
 * .why = displays all protected artifacts and their guard status
 */
const routeBounceList = async (): Promise<void> => {
  // load bouncer cache
  const cache = await getRouteBouncerCache();

  if (cache.protections.length === 0) {
    console.log('no protected artifacts');
    return;
  }

  // group protections by stone
  const byStone = new Map<string, typeof cache.protections>();
  for (const p of cache.protections) {
    const list = byStone.get(p.stone) ?? [];
    list.push(p);
    byStone.set(p.stone, list);
  }

  console.log('🗿 route.bounce');
  console.log('   └─ protected artifacts');

  const stones = Array.from(byStone.keys());
  for (let i = 0; i < stones.length; i++) {
    const stone = stones[i]!;
    const protections = byStone.get(stone)!;
    const isLast = i === stones.length - 1;
    const prefix = isLast ? '      └─' : '      ├─';

    const stoneStatus = protections[0]?.passed ? '✓' : '○';
    console.log(`${prefix} ${stone} ${stoneStatus}`);

    const childPrefix = isLast ? '         ' : '      │  ';
    for (let j = 0; j < protections.length; j++) {
      const p = protections[j]!;
      const isLastGlob = j === protections.length - 1;
      const globPrefix = isLastGlob ? '└─' : '├─';
      console.log(`${childPrefix}${globPrefix} ${p.glob}`);
    }
  }
};

/**
 * .what = the help text for route.mutate grant, as one string
 * .why = read by a `--help` caller on stdout at exit 0 and by a caller with a bad action on stderr
 *        at exit 2. one source, so the two cannot drift
 *        (rule.require.single-source-of-truth-for-render, rule.require.help-on-demand).
 */
const getRouteMutateGrantHelpText = (): string =>
  `
route.mutate grant - manage route protection privilege

usage:
  rhx route.mutate grant allow   # grant privilege (human only — refused without a tty)
  rhx route.mutate grant block   # revoke privilege
  rhx route.mutate grant get     # check privilege state

options:
  --route <path>    route path (default: auto-detect from branch)
  --help            show this help message

.note = the flag \`allow\` writes lifts EVERY protected write on the route at once — a guard's
        \`budget:\` line among them. so it is human only, and that is enforced rather than asked.
`.trim();

/**
 * .what = cli entrypoint for route.mutate grant commands
 * .why = manages privilege flags for route protection bypass
 */
export const routeMutateGrant = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    // --help is an ASK, never a fault: stdout, exit 0, and judged BEFORE the action — below this
    // line it would fall into the invalid-action branch and exit 2 (rule.require.help-on-demand).
    if (options.help) {
      console.log(getRouteMutateGrantHelpText());
      return;
    }

    // extract action from positional args or named option
    const action = getGrantActionFromArgs({
      argv: process.argv,
      grantOption: options.grant,
    });

    if (!action || !['allow', 'block', 'get'].includes(action)) {
      // usage on an invalid/absent action is an error path → stderr, not stdout
      // (rule.forbid.stdout-on-exit-errors: stdout may be hidden on non-zero exit)
      // .note = the blank lines are explicit because the shared text is trimmed; see the twin note
      //         in `routeGuardBudget`. the extant bytes on this path are unchanged.
      console.error('');
      console.error(getRouteMutateGrantHelpText());
      console.error('');
      // exit 2 = constraint: the caller gave a bad action and must fix the invocation
      // (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
      process.exit(2);
    }

    try {
      // get route from option or auto-detect
      let routePath = options.route;
      if (!routePath) {
        const bind = await getRouteBindByBranch({ branch: null });
        if (!bind) {
          console.error('error: no bound route found. use --route to specify.');
          process.exit(2);
        }
        routePath = bind.route;
      }

      const privilegeFlagPath = path.join(
        routePath,
        '.route',
        '.privilege.mutate.flag',
      );

      if (action === 'allow') {
        // 🔴 the ACTOR check — the grant's help has said "human only" since it shipped, and this is
        //    what makes that a gate rather than a claim.
        //
        // .why = the flag it writes lifts EVERY protected write on the route at once — a `budget:`
        //        edit in a `.guard`, an appended `rounds: 0` line in the append-only meter. so a
        //        grant any caller may mint is a bound any caller may raise, and the gate on
        //        route.guard.budget would sit beside an open door rather than on the road.
        //
        // .note = `block` and `get` are UNgated on purpose. a revoke narrows what is permitted and a
        //         status read changes naught, so neither is a lever the bound needs held.
        //
        // 🔴 the ACTOR is INJECTED, as it is for the three human-only stone levers — `--as approved`,
        //    `--as overruled`, `--as forced`. the check itself was already shared; its INPUT was not,
        //    so the granted wire (`isTTY === true ⇒ the flag is written`) could be driven by no test
        //    at all — every spawn is a pipe, and a pipe is refused by construction. the leaf now
        //    takes `context: { isTTY }`, so a test drives both verdicts (raised i002/r002).
        //
        // 🔴 .and the LIVE wire below is clamped too, by the refusal cases rather than by a pty.
        //    a spawned skill has a pipe on stdin, so `process.stdin.isTTY` is `undefined` — and the
        //    acceptance corpus asserts that invocation exits 2 and leaves NO flag on disk
        //    (`driver.route.mutate.acceptance.test.ts` `[case4][t1]`, and `[case6]` phase 2a).
        //
        //    | the regression | what a pipe then reads | caught? |
        //    |---|---|---|
        //    | the read is dropped for a constant `true` | `true` ⇒ GRANTS | ✅ both cases go red |
        //    | the probe is inverted (`!== true`) | `undefined !== true` ⇒ GRANTS | ✅ both cases go red |
        //    | the read is dropped for a constant `false` | `false` ⇒ refuses | 🔴 **ships green** |
        //
        //    ⇒ the two a reviewer named are held; the third is not, and it is recorded rather than
        //      claimed away (raised i003/r004 n1). it fails CLOSED — a human's grant stops to work,
        //      which is loud the first time one is attempted — where the other two fail OPEN and
        //      silently re-open the door this gate exists to shut. only a pty-backed case closes it.
        const { granted, emit } = await setRoutePrivilegeAsGranted(
          { route: routePath },
          { isTTY: process.stdin.isTTY === true },
        );

        if (!granted) {
          // 🔴 stderr, never stdout: a refusal is a constraint the caller must fix, and stdout may be
          //    hidden on a non-zero exit (`rule.forbid.stdout-on-exit-errors`).
          emit.lines.forEach((line) => console.error(line));
          // exit 2 = constraint: the caller must change who invokes it, never how
          // (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
          process.exit(2);
        }

        // a grant is a success and exits 0, so its lines go to stdout
        emit.lines.forEach((line) => console.log(line));
      } else if (action === 'block') {
        // remove flag file (idempotent)
        await fs.rm(privilegeFlagPath, { force: true });

        console.log('');
        console.log('🦉 privilege revoked');
        console.log('');
        console.log('🗿 route.mutate grant block');
        console.log(`   ├─ route = ${routePath}`);
        console.log('   └─ flag = .route/.privilege.mutate.flag removed');
        console.log('');
        console.log('🔒 route mutation now blocked');
        console.log('');
      } else if (action === 'get') {
        // check flag existence
        const hasPrivilege = await fs
          .access(privilegeFlagPath)
          .then(() => true)
          .catch(() => false);

        console.log('');
        console.log('🗿 route.mutate grant get');
        console.log(`   ├─ route = ${routePath}`);
        console.log(
          `   └─ status = ${hasPrivilege ? 'allowed' : 'blocked (no privilege flag)'}`,
        );
        console.log('');
      }
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      throw error;
    }
  });

/**
 * .what = decides whether the budget line for ONE peer slug is in scope for this add
 * .why = named transformer, extracted from the YAML-string loop's two inline `continue`
 *        checks (raised 3× — arch-opport-decomposition, mech-decode-friction) so the loop
 *        reads as narrative rather than decode-friction (`rule.forbid.inline-decode-friction`)
 *
 * 🔴 .the two filters are ANDed, and they come from two sources (F022 / S09).
 *    `peerSlug` names ONE lane by hand; `targetSlugs` is the level SCOPE the orchestrator
 *    computed from the live meters. a null `targetSlugs` means "no level scope" — the caller
 *    already narrowed by `--peer`, so no second filter is owed. an empty set means "a level
 *    scope was computed and it holds no lane", so NAUGHT is touched — the whole point of the
 *    S09 verdict: "unless a level is explicitly rewound or budgetted, it should stay|become
 *    exhausted." a bulk add no longer sprays every level; it lands on the latest one alone.
 */
/**
 * .what = the guard file paths whose stone is named by `--stone` — exactly, or as a `.` descendant
 * .why = named transformer, extracted from `routeGuardBudget`'s inline `startsWith` filter
 *        (raised — mech-decode-friction) so the orchestrator reads as narrative. it mirrors
 *        `getCurrentPeerMetersForStones.ts:25`, and its `.why` states why they must:
 *        *"the meter set and the guard set agree by construction."* ⇒ a change here is a change
 *        there, and a filter applied at one site alone would break that agreement.
 *
 * 🔴 .the match is DELIMITER-AWARE, via the shared `isStoneMatchedByName`, never a bare prefix.
 *    a bare form matches a peer whose name merely opens the same way — `--stone 1.execute` reaches
 *    `1.execute-b` — which makes the budget gate's own scope remedy un-runnable: it prints *"name
 *    the one stone you meant, in full"* and the full name re-matches both. the predicate carries
 *    the full argument and the safe-direction proof.
 *
 * .note = the basename is stripped of its `.guard` extension before the test, so a stone's guard
 *         VARIANTS still match it — `<name>.src.guard` reduces to `<name>.src`, a `.` descendant
 *         of `<name>`. that is the property the extant comment below relies on.
 */
const getTargetGuardPathsForStone = (input: {
  guardFiles: string[];
  stoneName: string | null;
}): string[] =>
  input.stoneName
    ? input.guardFiles.filter((f) =>
        isStoneMatchedByName({
          stone: path.basename(f).replace(/\.guard$/, ''),
          named: input.stoneName as string,
        }),
      )
    : input.guardFiles;

const isPeerBudgetLineInScope = (input: {
  currentPeerSlug: string | null;
  peerSlug: string | null;
  targetSlugs: Set<string> | null;
}): boolean => {
  if (input.peerSlug && input.currentPeerSlug !== input.peerSlug) return false;
  if (
    input.targetSlugs &&
    (input.currentPeerSlug === null ||
      !input.targetSlugs.has(input.currentPeerSlug))
  )
    return false;
  return true;
};

/**
 * .what = the peer meters a `--peer` / `--level` scope selects — the set the gate judges
 * .why = the orchestrator needs the in-scope meters, and it had said so with a `meters.filter(...)`
 *        whose predicate is a leaf but whose *"select the meters in this scope"* intent sat inline.
 *        a reader had to simulate the shape before the set landed
 *        (`rule.forbid.inline-decode-friction`, raised i002/r004 n1). one named read, so the
 *        orchestrator states WHAT it needs and this holds HOW the scope is applied.
 *
 * 🔴 .it wraps the SAME `isPeerBudgetLineInScope` the write uses, deliberately.
 *    the set the gate judges and the set the write touches agree by construction. derived a second
 *    way, a reviewer could be judged dry here and written as another there.
 */
const getMetersInScope = (input: {
  meters: GuardPeerMeterStatus[];
  peerSlug: string | null;
  targetSlugs: Set<string> | null;
}): GuardPeerMeterStatus[] =>
  input.meters.filter((meter) =>
    isPeerBudgetLineInScope({
      currentPeerSlug: meter.slug,
      peerSlug: input.peerSlug,
      targetSlugs: input.targetSlugs,
    }),
  );

/**
 * .what = the live urgent concession slugs that warrant a grant — empty where no ONE stone is named
 * .why = the ledger is keyed to a stone, so a `--stone` prefix that matched SEVERAL stones names no
 *        one ledger to read. the orchestrator had carried that condition inline as a ternary around
 *        an `await`, so a reader held *when the ledger is readable* together with the read itself
 *        (`rule.forbid.inline-decode-friction`, raised i002/r004 n1).
 *
 * ⚠️ .an empty result here is NEVER the reason a grant is refused on a multi-match.
 *    `computeBudgetGrantRefusal` judges scope FIRST, so an ambiguous invocation is refused on its
 *    own terms and this value is never reached as a warrant verdict. were the order reversed, a
 *    driver would be told to concede on a stone the invocation never singled out.
 */
const getLiveUrgentWarrantSlugs = async (input: {
  route: string;
  stone: string;
  matchedGuardCount: number;
}): Promise<string[]> => {
  if (input.matchedGuardCount !== 1) return [];
  return getStoneLiveUrgentConcessionSlugs({
    route: input.route,
    stone: input.stone,
  });
};

/**
 * .what = extract and update budget values from guard file content
 * .why = named transformer to isolate YAML structure navigation from orchestrator
 */
const updateGuardPeerBudgets = (input: {
  content: string;
  addAmount: number;
  peerSlug: string | null;
  targetSlugs: Set<string> | null;
  guardName: string;
}): {
  content: string;
  modified: boolean;
  updates: Array<{
    guard: string;
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }>;
} => {
  const lines = input.content.split('\n');
  let modified = false;
  let currentPeerSlug: string | null = null;
  let inPeerSection = false;
  const updates: Array<{
    guard: string;
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // detect peer section start
    if (trimmed === 'peer:') {
      inPeerSection = true;
      continue;
    }

    // exit peer section on other top-level keys
    if (
      inPeerSection &&
      !line.startsWith(' ') &&
      !line.startsWith('\t') &&
      trimmed !== ''
    ) {
      if (
        trimmed.endsWith(':') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('slug:') &&
        !trimmed.startsWith('run:') &&
        !trimmed.startsWith('budget:') &&
        !trimmed.startsWith('level:')
      ) {
        inPeerSection = false;
        currentPeerSlug = null;
      }
    }

    // track current peer slug
    if (inPeerSection && trimmed.startsWith('- slug:')) {
      currentPeerSlug = trimmed.slice(7).trim();
      continue;
    }
    if (inPeerSection && trimmed.startsWith('slug:')) {
      currentPeerSlug = trimmed.slice(5).trim();
      continue;
    }

    // find and update budget line
    if (inPeerSection && trimmed.startsWith('budget:')) {
      // skip a peer slug outside the --peer target and level scope (F022 / S09)
      if (
        !isPeerBudgetLineInScope({
          currentPeerSlug,
          peerSlug: input.peerSlug,
          targetSlugs: input.targetSlugs,
        })
      ) {
        continue;
      }

      const budgetMatch = trimmed.match(/^budget:\s*(\d+)/);
      if (budgetMatch) {
        const budgetBefore = parseInt(budgetMatch[1]!, 10);
        const budgetAfter = budgetBefore + input.addAmount;
        const indent = line.match(/^(\s*)/)?.[1] ?? '';
        lines[i] = `${indent}budget: ${budgetAfter}`;
        modified = true;

        updates.push({
          guard: input.guardName,
          peer: currentPeerSlug ?? 'unknown',
          budgetBefore,
          budgetAfter,
        });
      }
    }
  }

  return {
    content: lines.join('\n'),
    modified,
    updates,
  };
};

/**
 * .what = parses string to positive integer or returns null
 * .why = encapsulates add amount validation for guard budget
 */
const asPositiveIntegerOrNull = (input: { value: string }): number | null => {
  const parsed = parseInt(input.value, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

/**
 * .what = the peer budget lines the target guards configure, read without a write
 * .why = a `--peer` that names no configured reviewer is a CALLER fault, and it is diagnosed
 *        BEFORE the gate — so the command needs the set of peers in scope while it still holds
 *        the right to refuse. this returns that set and touches no disk.
 *
 * 🔴 .it calls the SAME `updateGuardPeerBudgets` the write does, so the two cannot disagree about
 *    which peers a guard configures. that operation is pure — it returns new content rather than
 *    a write of it — so a caller that discards `.content` mutates naught, and `addAmount: 0` is
 *    discarded with it. a second parser here would be a set that drifts from the writer's.
 *
 * ⚠️ .the reads run CONCURRENTLY, where `processGuardFileBudgets` reads serially. that is the one
 *    real difference between the two, and it is safe here for the reason above: no write happens
 *    on this path, so no two reads can race one. the writer stays serial deliberately.
 */
const getAllScopedPeerBudgetUpdates = async (input: {
  guardPaths: string[];
  peerSlug: string | null;
  targetSlugs: Set<string> | null;
}): Promise<
  Array<{
    guard: string;
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }>
> => {
  const probes = await Promise.all(
    input.guardPaths.map(async (guardPath) =>
      updateGuardPeerBudgets({
        content: await fs.readFile(guardPath, 'utf-8'),
        addAmount: 0,
        peerSlug: input.peerSlug,
        targetSlugs: input.targetSlugs,
        guardName: path.basename(guardPath),
      }),
    ),
  );
  return probes.flatMap((probe) => probe.updates);
};

/**
 * .what = processes guard files and updates peer budgets
 * .why = encapsulates file I/O loop for guard budget updates
 */
const processGuardFileBudgets = async (input: {
  guardPaths: string[];
  addAmount: number;
  peerSlug: string | null;
  targetSlugs: Set<string> | null;
}): Promise<
  Array<{
    guard: string;
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }>
> => {
  const updates: Array<{
    guard: string;
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }> = [];

  for (const guardPath of input.guardPaths) {
    const content = await fs.readFile(guardPath, 'utf-8');
    const result = updateGuardPeerBudgets({
      content,
      addAmount: input.addAmount,
      peerSlug: input.peerSlug,
      targetSlugs: input.targetSlugs,
      guardName: path.basename(guardPath),
    });

    if (result.modified) {
      await fs.writeFile(guardPath, result.content);
    }

    updates.push(...result.updates);
  }

  return updates;
};

/**
 * .what = the help text for route.guard.budget, as one string
 * .why = the text has TWO readers on two streams — a `--help` caller reads it on stdout at exit 0,
 *        and a caller who omitted `--add` reads it on stderr at exit 2. one source, so the
 *        guidance a driver discovers cannot drift from the guidance a driver is corrected with
 *        (rule.require.single-source-of-truth-for-render).
 *
 * 🔴 .before this was hoisted, the text was reachable ONLY from the error path — so
 *    `rhx route.guard.budget --help` fell through to `--for is required`, printed a two-line usage,
 *    and exited 2. a driver who typed `--help` to discover the new warrant requirements was told
 *    there was an error instead (`rule.require.help-on-demand`, raised i001/r009 n1).
 */
const getRouteGuardBudgetHelpText = (): string =>
  `
route.guard.budget - extend peer reviewer budget

usage:
  rhx route.guard.budget --for review --add 2 --stone 1.vision              # extend the LATEST level
  rhx route.guard.budget --for review --add 2 --peer primo --stone 1.vision # extend one reviewer
  rhx route.guard.budget --for review --add 2 --level 1 --stone 1.vision    # extend one named level
  rhx route.guard.budget --for review --add 2 --stone 1.vision --route .behavior/my-feature

options:
  --for     resource type: "review" (required)
  --add     number of budget rounds to add (required)
  --stone   stone name with guard to update (required) — must name exactly ONE stone
  --peer    peer reviewer slug to extend (default: the latest level in play)
  --level   review level to extend — reach a LOWER level only when you name it
  --route   path to route directory (default: auto-detect from branch)
  --help    show this help message

.note = the grant is REFUSED by default. the budget is the allowance the route author set with the
        whole rubric in view, so a top-up past it needs a warrant — all three of:
          a live URGENT concession on the stone   a driver names the harm that ships if unfixed
          a target reviewer that has run dry      a pad before the bound bites removes the bound
          a --stone that named one stone          a prefix names many, and one warrant buys one
        where it refuses, it names what to run instead.

.note = this command checks no actor, so a human is refused here exactly as a driver is. the human
        path is a DIFFERENT command: rhx route.mutate grant allow, which mints the privilege flag a
        guard edit needs. ⇒ a human who wants to raise a bound past its warrant grants the
        privilege, then edits the guard's budget field itself.

.note = a bare add lands on the LATEST level alone. a lower level stays exhausted unless it is
        explicitly named with --level or --peer — a top-up is a deliberate, targeted act, never a
        blanket sweep that silently heals a level the route author bounded on purpose.
`.trim();

/**
 * .what = what a driver reads when it omits a required flag of `route.guard.budget` — the flag it
 *         left out, then the command's full guidance
 * .why = the command has THREE required-flag paths, and they rendered three different amounts of
 *        guidance: `--add` got the hoisted text, while `--for` and `--stone` each got a truncated
 *        two-line usage that taught none of the warrant rules this behavior authored. so a driver
 *        who forgot `--for` learned scarcely a word about the new gate, and a driver who forgot
 *        `--add` learned all of it — a discoverability inconsistency, and two more sites that could
 *        drift from the hoisted source (`rule.forbid.friction-hazards`, raised i003/r009 n1).
 *
 * 🔴 .the flag is NAMED, on all three, and that half is new to the `--add` path.
 *    the hoisted text alone says what the command wants and not what THIS invocation lacked, so a
 *    driver had to diff its own command against the usage block to find the omission.
 *    `rule.require.errors-name-the-fix` asks for what, why, and the fix: the flag name is the what,
 *    and the guidance beneath it is the fix. ⇒ the two sibling paths already had the diagnosis and
 *    lacked the guidance; `--add` had the guidance and lacked the diagnosis. one shape, all three.
 *
 * .note = the blank lines are EXPLICIT because the shared text is trimmed — the `--help` path wants
 *         it flush on stdout (every `print*Help` in this file trims), and an error path wants it set
 *         apart from whatever preceded it. one text, two framings.
 */
const asGuardBudgetErrorLines = (input: { diagnosis: string }): string[] => [
  input.diagnosis,
  ``,
  getRouteGuardBudgetHelpText(),
  ``,
];

const asGuardBudgetRequiredFlagLines = (input: { flag: string }): string[] =>
  asGuardBudgetErrorLines({ diagnosis: `error: ${input.flag} is required` });

/**
 * .what = what a driver reads when it gives a required flag of `route.guard.budget` a value the
 *         flag does not accept — the value it gave, the value the flag wants, then the full guidance
 * .why = the hoist above upgraded the three ABSENT-flag paths and left the one WRONG-VALUE path
 *        beside them untouched, so `route.guard.budget` shipped a four-way split on one command: a
 *        driver who omits `--for` read the whole warrant education, and a driver who typo'd it
 *        (`--for reveiw`) read a bare one-liner that named no valid value and no `--help`. that is
 *        the same discoverability friction the hoist existed to close, re-created one branch over
 *        rather than inherited — raised at i005 by r009 `ergo-friction-hazards` and corroborated
 *        independently by r010 (`rule.forbid.friction-hazards`).
 *
 * 🔴 .the ALLOWED value is named, which the bare form never did.
 *    `rule.require.errors-name-the-fix` asks for what, why, and the fix. the old line carried the
 *    what (`got "reveiw"`) and left the fix to a guess — a driver had to already know the one legal
 *    value to repair the call. ⇒ the diagnosis names it, and the guidance beneath teaches the gate.
 */
const asGuardBudgetWrongValueLines = (input: {
  flag: string;
  allowed: string;
  got: string;
}): string[] =>
  asGuardBudgetErrorLines({
    diagnosis: `error: ${input.flag} must be "${input.allowed}", got "${input.got}"`,
  });

/**
 * .what = cli entrypoint for route.guard.budget skill
 * .why = extends peer reviewer budgets when exhausted
 */
export const routeGuardBudget = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    // --help is an ASK, never a fault: stdout, exit 0. it is answered before every flag check, so a
    // driver who wants the guidance never has to satisfy a required flag to read it
    // (rule.require.help-on-demand).
    if (options.help) {
      console.log(getRouteGuardBudgetHelpText());
      return;
    }

    // validate --for option (required, must be "review")
    if (!options.for) {
      // the hoisted guidance, same as the two sibling required-flag paths (raised i003/r009 n1).
      // stderr, never stdout — stdout may be hidden on a non-zero exit
      // (rule.forbid.stdout-on-exit-errors).
      asGuardBudgetRequiredFlagLines({ flag: '--for' }).forEach((line) =>
        console.error(line),
      );
      // exit 2 = constraint: the caller omitted a required flag and must fix the invocation
      // (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
      process.exit(2);
    }
    if (options.for !== 'review') {
      // the same guidance its three peer flag paths render — a wrong value is as much a fault of
      // discoverability as an absent one, and it was the last bare one-liner left on this command
      // (raised i005/r009 n1). stderr, never stdout (rule.forbid.stdout-on-exit-errors).
      asGuardBudgetWrongValueLines({
        flag: '--for',
        allowed: 'review',
        got: options.for,
      }).forEach((line) => console.error(line));
      process.exit(2);
    }

    // validate --add option
    const addStr = options.add;
    if (!addStr) {
      // usage on an absent required flag is an error path → stderr, not stdout
      // (rule.forbid.stdout-on-exit-errors: stdout may be hidden on non-zero exit)
      //
      // 🟡 this path GAINED the `error: --add is required` diagnosis when the three were unified.
      //    it rendered the guidance alone, so a driver was told what the command wants and not what
      //    its own invocation lacked (raised i003/r009 n1, on the two sibling paths).
      asGuardBudgetRequiredFlagLines({ flag: '--add' }).forEach((line) =>
        console.error(line),
      );
      // exit 2 = constraint: the caller omitted a required flag and must fix the invocation
      // (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
      process.exit(2);
    }

    const addAmount = asPositiveIntegerOrNull({ value: addStr });
    if (addAmount === null) {
      console.error('error: --add must be a positive integer');
      // exit 2 = constraint: the caller passed a malformed value and must fix the
      // invocation (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
      process.exit(2);
    }

    const peerSlug = options.peer;
    const stoneName = options.stone;

    // parse --level (optional): the level a bulk add targets, per F022 fork E. a bare add lands on
    // the LATEST level alone; a lower level is reached ONLY when named here. a malformed value is a
    // caller fault → exit 2 (rule.require.exit-code-semantics).
    const levelStr = options.level;
    const levelFlag =
      levelStr === undefined
        ? null
        : asPositiveIntegerOrNull({ value: levelStr });
    if (levelStr !== undefined && levelFlag === null) {
      console.error('error: --level must be a positive integer');
      process.exit(2);
    }

    // --peer and --level both scope a top-up, and they scope it two DIFFERENT ways — a peer names
    // ONE lane, a level names EVERY lane at a rung. to pass both asks for two scopes at once, and
    // the peer silently wins (computeBudgetTargetSlugs returns null on a peer). reject the pair loud
    // rather than drop one (r001.n2, rule.require.errors-name-the-fix).
    if (peerSlug !== undefined && levelFlag !== null) {
      console.error('error: --peer and --level cannot be combined');
      console.error('');
      console.error(
        '   --peer scopes to ONE lane; --level scopes to EVERY lane at a rung.',
      );
      console.error('   name one, never both.');
      process.exit(2);
    }

    // require --stone to prevent accidental blast radius across all guards
    if (!stoneName) {
      // the hoisted guidance, same as the two sibling required-flag paths (raised i003/r009 n1).
      //
      // 🟡 the `.why = prevents accidental budget changes across unrelated stones` line that sat here
      //    is not lost — the hoisted text states the scope rule in full, including the refusal a
      //    multi-match `--stone` earns. a one-line gloss beside the whole rule is the drift this
      //    unification closes.
      asGuardBudgetRequiredFlagLines({ flag: '--stone' }).forEach((line) =>
        console.error(line),
      );
      // exit 2 = constraint: the caller omitted a required flag and must fix the invocation
      // (rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint)
      process.exit(2);
    }

    try {
      // get route from option or auto-detect
      let routePath = options.route;
      if (!routePath) {
        const bind = await getRouteBindByBranch({ branch: null });
        if (!bind) {
          console.error('error: no bound route found. use --route to specify.');
          process.exit(2);
        }
        routePath = bind.route;
      }

      // find guard files in the route
      const guardFiles = await enumFilesFromGlob({
        glob: '*.guard',
        cwd: routePath,
      });

      if (guardFiles.length === 0) {
        console.error(`error: no guard files found in ${routePath}`);
        process.exit(2);
      }

      // filter to specific stone if provided
      const targetGuards = getTargetGuardPathsForStone({
        guardFiles,
        stoneName,
      });

      if (targetGuards.length === 0) {
        console.error(`error: no guard file found for stone ${stoneName}`);
        process.exit(2);
      }

      // 🔴 the lanes a DISPUTE has quieted, read BEFORE the write.
      //
      // .why = the annotation is advisory and the write is not, so the order decides what a failure
      //        costs. read first and a malformed route fails fast with the budget untouched; read
      //        after and the same failure leaves a changed guard file with no emit to explain it
      //        (rule.require.failfast). the read is a status read, so it is safe to repeat.
      //
      // .note = stones are filtered by the SAME `isStoneMatchedByName` the guard filter above uses,
      //         so the two sets agree by construction — a guard basename reduces to the stone name
      //         for every variant (`<name>.guard`, `<name>.src.guard`, `<name>.stone.guard`), and the
      //         predicate then holds over both. ⇒ the shared predicate is what keeps that agreement
      //         true through the delimiter cut; a change at one site alone would break it.
      const stones = await getAllStones({ route: routePath });
      const meters = await getCurrentPeerMetersForStones({
        stones,
        stoneName,
        route: routePath,
      });
      const disputeSkippedSlugs = getDisputeSkippedReviewerSlugs({ meters });

      // the peers a bulk add may touch, per F022 fork E. null = no level scope (a --peer already
      // scopes, or no lane has run); a Set names the latest level (default) or the --level named.
      const targetSlugs = computeBudgetTargetSlugs({
        meters,
        levelFlag,
        peerSlug: peerSlug ?? null,
      });

      // a --level that names a level no lane sits at is a caller fault: the scope would touch naught,
      // so fail fast with the levels that ARE in play (rule.require.errors-name-the-fix).
      if (
        levelFlag !== null &&
        targetSlugs !== null &&
        targetSlugs.size === 0
      ) {
        const levelsInPlay = computeLevelsInPlay({ meters });
        console.error(
          `error: no reviewer at level ${levelFlag}. levels in play: ${
            levelsInPlay.length > 0
              ? levelsInPlay.join(', ')
              : '(none — no lane has run)'
          }`,
        );
        process.exit(2);
      }

      // 🔴 a --peer that names no configured reviewer is a CALLER fault, and it is diagnosed BEFORE
      //    the gate.
      //
      // .why = the gate judges the ROUTE'S STATE — was a round earned? — and that question presumes
      //        the invocation named a real lane. ask it first and a typo'd slug is answered with
      //        *"no live urgent concession stands"*, whose fix is to concede on a reviewer that does
      //        not exist. ⇒ the gate would name a fix the caller cannot run
      //        (rule.require.errors-name-the-fix). the invocation is checked first, so the diagnosis
      //        the caller can act on is the one they get.
      //
      // 🟡 .the read is a named leaf, never an inline map+flatMap over raw `fs` — the orchestrator
      //    states WHAT it needs (the peers in scope) and the leaf holds HOW it is read
      //    (`rule.forbid.inline-decode-friction`, raised i001/r003 b1 + r004 n1). its docblock
      //    carries why the probe reuses the writer's own parser.
      const probedUpdates = await getAllScopedPeerBudgetUpdates({
        guardPaths: targetGuards,
        peerSlug: peerSlug ?? null,
        targetSlugs,
      });
      if (peerSlug && probedUpdates.length === 0) {
        console.error(`error: peer reviewer not found: ${peerSlug}`);
        process.exit(2);
      }

      // 🔴 the GATE — the budget stops to be a free lever, and it is read BEFORE the write.
      //
      // .why = the budget IS the allowance for `better` churn. inside the meter taste counts; past
      //        the meter only a nameable harm buys a round. so a grant past a spent meter is refused
      //        unless three conjuncts hold — a live urgent concession (the warrant), a reviewer that
      //        has run dry (the moment), and exactly one stone (the scope).
      //
      // .note = it sits here for the same reason the dispute read above it does: read first and a
      //         refusal leaves the budget untouched; read after and the same refusal leaves a changed
      //         guard file with no emit to explain it (rule.require.failfast).
      //
      // 🟡 .both inputs are NAMED LEAVES — the orchestrator states what the gate judges, and each
      //    leaf holds how it is read. their docblocks carry the two properties that used to sit here
      //    as inline comments: the scope shares the write's own predicate, and the ledger read is
      //    skipped where no ONE stone was named (`rule.prefer.decomposable-architecture`, raised
      //    i002/r004 n1).
      const targetMeters = getMetersInScope({
        meters,
        peerSlug: peerSlug ?? null,
        targetSlugs,
      });

      const liveUrgentSlugs = await getLiveUrgentWarrantSlugs({
        route: routePath,
        stone: stoneName,
        matchedGuardCount: targetGuards.length,
      });

      const refusal = computeBudgetGrantRefusal({
        targetGuards,
        liveUrgentSlugs,
        targetMeters,
      });
      if (refusal) {
        formatBudgetGrantRefusalLines({
          refusal,
          route: routePath,
          stone: stoneName,
          add: addAmount,
          peer: peerSlug ?? null,
          level: levelFlag,
          meters: targetMeters,
        }).forEach((line) => console.error(line));
        // exit 2 = constraint: the caller must converge, grade, or re-scope — a retry as-is refuses
        // again (rule.require.exit-code-semantics). stderr, never stdout, since stdout may be hidden
        // on a non-zero exit (rule.forbid.stdout-on-exit-errors).
        //
        // 🔴 .this line is CLAMPED LIVE, and the clamp was proven to bite.
        //    `blackbox/driver.route.peer-budget-refusal.acceptance.test.ts` drives all three
        //    refusals through the real cli. dropped, the suite goes red in FIVE places at once:
        //    three exit-code clamps read 0, and two guard-byte-identical clamps find a mutated
        //    guard — because the fall-through reaches the write below. ⇒ the ORDER of this gate
        //    against that write is a pinned property, never a comment
        //    (`rule.require.clamp-edge-cases`).
        process.exit(2);
      }

      const updates = await processGuardFileBudgets({
        guardPaths: targetGuards,
        addAmount,
        peerSlug: peerSlug ?? null,
        targetSlugs,
      });

      // .note = the `peer reviewer not found` check that once sat here has moved ABOVE the gate, and
      //         it is not duplicated below it. the probe and this write share one parser and one set
      //         of inputs, so an empty `updates` here implies an empty `probedUpdates` there — a
      //         second check would be unreachable, and unreachable code reads as a live guarantee.

      // emit output
      //
      // 🔴 the head rows come from `asGuardBudgetHeadLines`, which the REFUSAL renderer also calls.
      //    the same four fields were rendered here inline and there inline, on a docblock promise
      //    that the two matched "byte for byte" — two render sites for one fact, so a new field or a
      //    reordered row had to land in both or the surfaces drift
      //    (`rule.require.single-source-of-truth-for-render`, raised i003/r001 n1).
      asGuardBudgetHeadLines({
        status: 'extended',
        route: routePath,
        add: addAmount,
        peer: peerSlug ?? null,
        level: levelFlag,
      }).forEach((line) => console.log(line));
      // 🔴 the grant NAMES its warrant, so req 3 is satisfied twice: the gate read a fact on disk,
      //    and this records which fact it read. a bare counter bump left the trade in the ledger
      //    alone (raised i002/r008 n1). the block is unconditional — the gate refuses on an empty
      //    warrant, so this line is unreachable without one.
      asBudgetGrantWarrantLines({ warrantSlugs: liveUrgentSlugs }).forEach(
        (line) => console.log(line),
      );
      console.log('   └─ updates');
      const updateLines = asGuardBudgetUpdateLines({
        updates,
        disputeSkippedSlugs,
      });
      updateLines.forEach((line) => console.log(line));
      console.log('');
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      throw error;
    }
  });

/**
 * .what = re-syncs a route's guards from their provenance source templates (D6)
 * .why = after a supplier bump, a driver pulls the newest review frame in one command.
 *   plan mode (default) previews a diff; apply mode overwrites the guard.
 *
 * .note = mirrors routeGuardBudget's shape byte-for-byte — plain console + process.exit,
 *   NO emit-context (this verb emits no progress events). BadRequestError → exit 2
 *   (constraint); a write-time throw propagates uncaught → exit 1 (malfunction).
 */
export const routeGuardUpgrade = async (): Promise<void> =>
  runCliEntrypoint(async () => {
    const options = parseArgs(process.argv);

    // --help prints usage, with the --stone BOUNDARY-match semantics called out.
    // .trim() so there are no stray blank lines at the start or end — matches the
    // peer `route.stone.set --help` convention (console.log adds its own newline)
    if (options.help) {
      console.log(
        `
route.guard.upgrade - re-sync a route's guards from their source templates

usage:
  rhx route.guard.upgrade                                     # plan all guards (default)
  rhx route.guard.upgrade --mode apply                        # apply all guards
  rhx route.guard.upgrade --stone 5.1.execution               # plan one stone's guard
  rhx route.guard.upgrade --stone 5.1 --mode apply            # apply every 5.1.* guard
  rhx route.guard.upgrade --route .behavior/my-feature        # target an explicit route

options:
  --stone <name>   stone name (BOUNDARY match: "5.1" hits every "5.1.*" guard but NOT "5.10.x").
                   default: all guards in the route
  --route <path>   path to route directory (default: auto-detect from branch)
  --mode <mode>    plan | apply (default: plan)
`.trim(),
      );
      process.exit(0);
    }

    // validate --mode (default plan; only plan|apply allowed)
    const mode = options.mode ?? 'plan';
    if (mode !== 'plan' && mode !== 'apply') {
      console.error(`error: --mode must be "plan" or "apply", got "${mode}"`);
      process.exit(2);
    }

    try {
      // get route from option or auto-detect from the bound branch
      let routePath = options.route;
      if (!routePath) {
        const bind = await getRouteBindByBranch({ branch: null });
        if (!bind) {
          console.error('error: no bound route found. use --route to specify.');
          process.exit(2);
        }
        routePath = bind.route;
      }

      // the provenance.uri is read relative to the repo root (gitroot)
      const repoRoot = await getRepoRootWithFallback({ from: process.cwd() });

      // decide (+ write, on apply) — the orchestrator is the sole writer
      const results = await setRouteGuardsFromProvenance({
        route: routePath,
        stone: options.stone ?? null,
        mode,
        repoRoot,
      });

      // render the owl tree to stdout; the formatter owns its final newline, so
      // write verbatim (process.stdout.write) rather than console.log (which would
      // append a second newline)
      process.stdout.write(
        formatGuardUpgradeTree({ results, route: routePath, mode }),
      );
    } catch (error) {
      // allowlist BadRequestError: format nicely and exit 2 (constraint)
      if (error instanceof BadRequestError) {
        console.error(`error: ${error.message}`);
        process.exit(2);
      }
      throw error;
    }
  });
