import {
  BadRequestError,
  MalfunctionError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import type { IsoDuration } from 'iso-time';
import * as path from 'path';

import type { ContextStoneGuardRound } from '@src/domain.objects/Driver/ContextStoneGuardRound';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { asPeerReviewOutputName } from '@src/domain.operations/asPeerReviewOutputName';
import type { ContextReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)
import { genPeerReviewsDir } from '@src/domain.operations/route/guard/review/peer/genPeerReviewsDir';
import { setPeerReviewStdoutArtifact } from '@src/domain.operations/route/guard/review/peer/setPeerReviewStdoutArtifact';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

// .note = a declared cross-context contract (rule.forbid.scope-leaks): the review runner is the one runner the guard and review.by share.
//         its lift to a neutral home is held at fulcrum F97 of route v2026_09_20.review-cost-meter
//         the runner's side also owns the shape of a run that never started (a precondition fault)
import { asReviewRunOfPreconditionFault } from '../../../review/asReviewRunOfPreconditionFault';
import { runOneReview } from '../../../review/runOneReview';
import { asCmdWithRuntimeVars } from '../asCmdWithRuntimeVars';
import { asExitCodeClass } from '../asExitCodeClass';
import { asGuardCmdFreeOfNpx } from '../asGuardCmdFreeOfNpx';
import { asRuntimeGuardBinPaths } from '../asRuntimeGuardBinPaths';
import { asStoneGuardCounter } from '../asStoneGuardCounter';
import { isCmdOfRuntimeVar } from '../isCmdOfRuntimeVar';
import type { RuntimeGuardVarName } from '../RUNTIME_GUARD_VAR_NAMES';
import { setStoneGuardRoundOutput } from '../round/setStoneGuardRoundOutput';
import { asArtifactPassageFooter } from '../tree/asArtifactPassageFooter';
import { formatArtifactFooters } from '../tree/formatArtifactFooters';
import { formatArtifactStreamBuckets } from '../tree/formatArtifactStreamBuckets';
import { asConversationVar } from './asConversationVar';
import { asSanitizedPeerReviewSlug } from './peer/asSanitizedPeerReviewSlug';
import { getAllRouteGuardReviewPeerConversationFiles } from './peer/getAllRouteGuardReviewPeerConversationFiles';
import { setStoneGuardReviewTargets } from './setStoneGuardReviewTargets';

/**
 * .what = the lane's prior peer dialogue, read only when its command names `$conversation`
 * .why = the opt-in rule `$targets` keeps too: a lane that never asked pays no directory walk
 *
 * .note = a read fault comes back as `fault`, never as a throw — the same seam `$targets`
 *         keeps. the read runs before `runOneReview`, so a throw here would skip the seam
 *         that turns a lane fault into that lane's `💥 malfunction`, and end every lane of
 *         the level on a stack trace. the allowlist is the faults the read declares: a peer
 *         review file with no generation infix (`MalfunctionError`), and a directory the fs
 *         holds absent or denies. aught else rethrows (rule.forbid.failhide)
 */
const getAllPeerConversationFilesIfAsked = async (input: {
  cmd: string;
  route: string;
  stone: string;
  exclude: { iteration: number; hash: string };
  slug: string;
}): Promise<{ files: string[]; fault: string | null }> => {
  // a lane that never named the var reads no dialogue
  if (!isCmdOfRuntimeVar({ cmd: input.cmd, name: '$conversation' }))
    return { files: [], fault: null };

  // read the dialogue; a declared read fault becomes this lane's malfunction reason
  return getAllRouteGuardReviewPeerConversationFiles({
    route: input.route,
    stone: input.stone,
    exclude: input.exclude,
    slug: input.slug,
  }).then(
    (files) => ({ files, fault: null }),
    (error: unknown) => {
      const isDeclared =
        error instanceof MalfunctionError ||
        isErrorOfAbsence({ error }) ||
        isErrorOfDenial({ error });
      if (!isDeclared) throw error;
      return {
        files: [],
        fault: `💥 MalfunctionError: the $conversation files could not be read (${error instanceof Error ? error.message : String(error)})`,
      };
    },
  );
};

/**
 * .what = executes a single guard review command and produces review artifact
 * .why = enables guard to validate stone artifacts via review tools
 * .note = one lane, run to its artifact. the pass that schedules every lane of every level
 *         is `runStoneGuardReviews`, its one caller
 */
export const runOneStoneGuardReview = async (
  input: {
    stone: RouteStone;
    reviewCmd: string;
    index: number;
    hash: string;
    iteration: number;
    route: string;
    slug: string;
    timeout: IsoDuration;
    /** the pass's repo root, read once by the caller for every lane */
    repoRoot: string;
    /** the pass's `$targets` list, computed at most once and shared by every lane */
    getTargetsOfPass: () => Promise<string[]>;
    /**
     * whether this lane pours beside peers — `join` only where its level pour holds
     * two or more lanes, so a lone lane never waits on a gather that never comes
     */
    meet: 'join' | 'skip';
  },
  context: ContextReviewBrainSupply & ContextStoneGuardRound,
): Promise<RouteStoneGuardReviewArtifact> => {
  // peer reviews go to .reviews/peer/ so drivers can read them (.route/ is sealed)
  const { path: reviewsDir } = await genPeerReviewsDir({ route: input.route });

  // repo root for $rhx/$rhachet paths, read once by the pass for every lane
  const { repoRoot } = input;

  // validate no npx patterns before variable substitution
  asGuardCmdFreeOfNpx({ cmd: input.reviewCmd });

  // sanitize slug for filename
  // .why = legacy peer reviews use command as slug (e.g., ".test/mock-review.sh");
  //        path separators would create nested directories
  // .note = write side of a grammar `setStoneAsFeedbackAbsorbed` reads (`--that <slug>`
  //         must validate against these names), so the rule lives in one transformer
  const sanitizedSlug = asSanitizedPeerReviewSlug({ slug: input.slug });

  // stdout path (what guard writes) and report path (what review skill writes)
  // .note = symmetric names: stdout is .md, report is .report.md
  const iSeg = asStoneGuardCounter({ value: input.iteration });
  const rSeg = asStoneGuardCounter({ value: input.index });

  // the filename grammar is composed by one operation, matched by the review context's
  // own `asReviewRunIdentity` parse — so the two stay in sync (rule.forbid.scope-leaks)
  const parts = {
    stone: input.stone.name,
    iteration: iSeg,
    hash: input.hash,
    index: rSeg,
    slug: sanitizedSlug,
  };
  const stdoutPath = path.join(
    reviewsDir,
    asPeerReviewOutputName({ parts, kind: 'stdout' }),
  );
  const reportPath = path.join(
    reviewsDir,
    asPeerReviewOutputName({ parts, kind: 'report' }),
  );

  // expand the peer-review conversation for the opt-in $conversation var
  // .why = a reviewer declared with --conversation $conversation sees its own prior
  //        dialogue (given + report + driver's taken). excludes the current
  //        {iteration, hash} generation so a later reviewer never sees an earlier
  //        reviewer's brand-new, unanswered given (B4)
  // .note = scoped to this lane's slug, so cross-lane dialogue never inflates the prompt
  // .note = read only when the command names `$conversation`, the same opt-in rule
  //         `$targets` keeps below — a lane that never asked pays no directory walk
  const conversationRead = await getAllPeerConversationFilesIfAsked({
    cmd: input.reviewCmd,
    route: input.route,
    stone: input.stone.name,
    exclude: { iteration: input.iteration, hash: input.hash },
    slug: sanitizedSlug,
  });
  // one shell token of repo-root-relative paths, to match the reviewer's cwd
  const conversation = asConversationVar({
    files: conversationRead.files,
    repoRoot,
  });

  // write the computed review target list for the opt-in $targets var
  // .why = an enroll lane with no --diffs of its own reads the same since-main target
  //        set `rhx review` computes, rather than re-derive one
  // .note = computed only when the command asks for it; the pass writes each lane's own copy
  const targetsPath = path.join(
    reviewsDir,
    asPeerReviewOutputName({ parts, kind: 'targets' }),
  );
  const targets = await setStoneGuardReviewTargetsIfAsked({
    cmd: input.reviewCmd,
    path: targetsPath,
    repoRoot,
    getTargets: input.getTargetsOfPass,
  });

  // substitute variables in command ($output points to report path)
  const cmd = asCmdWithSubstitutedVars({
    cmd: input.reviewCmd,
    vars: {
      stone: input.stone.name,
      route: input.route,
      hash: input.hash,
      output: reportPath,
      targets: targets.targets,
      conversation,
      repoRoot,
    },
  });

  // dispatch the shared review runner: exec + capture + tally + malfunction-promotion
  // .why = one execution path shared with review.by, so the guard only wraps the
  //        result into its artifact below
  // .note = a lane whose `$conversation` or `$targets` read faulted never runs; it is this
  //         lane's malfunction, and its co-members of the level run on
  const faultOfPrecondition = conversationRead.fault ?? targets.fault;
  const run =
    faultOfPrecondition !== null
      ? asReviewRunOfPreconditionFault({ reason: faultOfPrecondition })
      : await runOneReview(
          { cmd, timeout: input.timeout, cwd: repoRoot, meet: input.meet },
          context,
        );
  // `talliedBy` is the durable record of which model tallied, named by pin — the footer
  // and the artifact share the one read the runner made
  const {
    stdout,
    stderr,
    exitCode,
    blockers,
    nitpicks,
    tallier,
    talliedBy,
    durationMs,
  } = run;

  // classify exit code (after possible malfunction promotion)
  const exitClass = asExitCodeClass({ code: exitCode });

  // format artifact content as one literal: the stream buckets, then both footers.
  // an empty stream earns no box; two footers can follow, so the last stream bucket
  // may not be the artifact's final child. the footers are composed together so exactly
  // one carries the terminal marker (rule.forbid.behavior-hazards — two independent `└─`
  // writers would render two terminal branches when both fire)
  // .note = the tally is persisted so a cache re-read recovers the same counts and
  //         tactic with no brain call. this is one segment of a single authored write
  //         (an upsert that replaces the file wholesale), so a rerun cannot stack footers
  const artifactLines: string[] = [
    ...formatArtifactStreamBuckets({
      stdout,
      stderr,
      hasFooter: exitCode !== 0 || run.detected,
    }),
    ...formatArtifactFooters({
      passage: asArtifactPassageFooter({ exitCode }),
      tally: run.detected
        ? {
            blockers,
            nitpicks,
            talliedBy,
          }
        : null,
    }),
  ];

  // write stdout artifact file, only if no rewind superseded the round meanwhile
  await setStoneGuardRoundOutput({
    route: input.route,
    stone: input.stone.name,
    generation: context.guardRound.generation,
    write: () =>
      setPeerReviewStdoutArtifact({
        path: stdoutPath,
        content: artifactLines.join('\n'),
      }),
  });

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: input.iteration,
    index: input.index,
    path: stdoutPath,
    blockers,
    nitpicks,
    tallier,
    talliedBy,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
  });
};

/**
 * .what = writes the review target list where a command asks for `$targets`, and
 *         returns its path; returns '' where the command never names the var
 * .why = the list costs a git read of the whole branch, so it is written only on
 *        request. a `set*` verb, since it writes a file (rule.require.get-set-gen-verbs)
 *
 * .note = a git read fault comes back as `fault`, never as a throw. the read runs
 *         before `runOneReview`, so a throw here would skip the seam that turns a lane
 *         fault into that lane's `💥 malfunction` artifact, and end the whole pass on a
 *         stack trace. the allowlist is the two faults the git read declares: a repo
 *         with no main branch (`BadRequestError`) and a git call that failed for any
 *         other reason (`UnexpectedCodePathError`). aught else rethrows
 *         (rule.forbid.failhide)
 */
const setStoneGuardReviewTargetsIfAsked = async (input: {
  cmd: string;
  path: string;
  repoRoot: string;
  getTargets: () => Promise<string[]>;
}): Promise<{ targets: string; fault: string | null }> => {
  // a command that never names the var gets no list, and no git read is paid. the
  // same token match the substitution uses decides it, so the two never disagree
  if (!isCmdOfRuntimeVar({ cmd: input.cmd, name: '$targets' }))
    return { targets: '', fault: null };

  // read the list; a declared git fault becomes this lane's malfunction reason
  const paths = await input.getTargets().catch((error: unknown) => {
    if (
      !(error instanceof BadRequestError) &&
      !(error instanceof UnexpectedCodePathError)
    )
      throw error;
    return asTargetsFaultReason({ error });
  });
  if (typeof paths === 'string') return { targets: '', fault: paths };

  // write the list, and hand back where it landed
  const written = await setStoneGuardReviewTargets({
    path: input.path,
    repoRoot: input.repoRoot,
    targets: paths,
  });
  return { targets: written.path, fault: null };
};

/**
 * .what = the malfunction line a lane carries when its `$targets` list could not be read
 * .why = one header, the same `💥 MalfunctionError:` shape `runOneReview` writes, so the
 *        guard tree and the artifact read a target-read fault like every other lane fault
 */
const asTargetsFaultReason = (input: { error: Error }): string =>
  `💥 MalfunctionError: the $targets list could not be read (${input.error.message})`;

/**
 * .what = substitutes variables in a command string
 * .why = enables dynamic command templates in guard files
 */
const asCmdWithSubstitutedVars = (input: {
  cmd: string;
  vars: {
    stone: string;
    route: string;
    hash: string;
    output: string;
    targets: string;
    conversation: string;
    repoRoot: string;
  };
}): string => {
  const { cmd, vars } = input;
  const bins = asRuntimeGuardBinPaths({ repoRoot: vars.repoRoot });

  // the name→value map for every runtime var, typed by RuntimeGuardVarName so the
  // compiler forbids drift: `getUnknownGuardVars` (route.guard.upgrade) treats the
  // same const as its allowlist, so a new var can't be substituted unless it is also
  // made upgrade-safe
  const valueByName: Record<RuntimeGuardVarName, string> = {
    $route: vars.route,
    $stone: vars.stone,
    $hash: vars.hash,
    $output: vars.output,
    $rhx: bins.rhx,
    $rhachet: bins.rhachet,
    $targets: vars.targets,
    $conversation: vars.conversation,
  };

  // replace each runtime var, via the one substitution both runs share
  return asCmdWithRuntimeVars({ cmd, valueByName });
};
