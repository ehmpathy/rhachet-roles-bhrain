import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { isReviewSubprocess } from '@src/domain.operations/isReviewSubprocess';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { computeRouteBouncerCache } from './bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from './bouncer/setRouteBouncerCache';
import { applyStoneBrainOnEntry } from './brain/applyStoneBrainOnEntry';
import { asStoneBrainEffort } from './brain/asStoneBrainEffort';
import { asStoneBrainSlug } from './brain/asStoneBrainSlug';
import { formatStoneBrainOutcome } from './brain/formatStoneBrainOutcome';
import { isRouteBrainDeclared } from './brain/isRouteBrainDeclared';
import type { StoneBrainOutcome } from './brain/setStoneBrain';
import { asRouteDisplayPath } from './drive/asRouteDisplayPath';
import { asRouteDispositions } from './drive/asRouteDispositions';
import { asRouteInflightFreshness } from './drive/asRouteInflightFreshness';
import { asRouteInflightNote } from './drive/asRouteInflightNote';
import { asRouteStoneDisposition } from './drive/asRouteStoneDisposition';
import { formatRouteDriveHeader } from './drive/formatRouteDriveHeader';
import { formatRouteDriveMixedHalt } from './drive/formatRouteDriveMixedHalt';
import { formatRouteDriveRoundLines } from './drive/formatRouteDriveRoundLines';
import { formatRouteDriveWhere } from './drive/formatRouteDriveWhere';
import { getCurrentExhaustedSlugs } from './drive/getCurrentExhaustedSlugs';
import { getOneRouteDriveBlockerMessage } from './drive/getOneRouteDriveBlockerMessage';
import { getOneStoneGuardRoundLatest } from './drive/getOneStoneGuardRoundLatest';
import { getRouteDriveExhaustedMessage } from './drive/getRouteDriveExhaustedMessage';
import { getRouteInflight } from './drive/getRouteInflight';
import { getStoneGuardBlockerReport } from './drive/getStoneGuardBlockerReport';
import { isRouteStoneBlockerArticulated } from './drive/isRouteStoneBlockerArticulated';
import { setDriveBlockerState } from './drive/setDriveBlockerState';
import { getOneStoneByName } from './getOneStoneByName';
import { asGuardMalfunctionReasonLines } from './guard/asGuardMalfunctionReasonLines';
import { formatGuardMalfunctionClearLines } from './guard/formatGuardMalfunctionClearLines';
import { asRouteStoneSetCommandHead } from './guard/review/peer/asRouteStoneSetCommandHead';
import { getAllLatestPassageByStone } from './passage/getAllLatestPassageByStone';
import { getAllPassageReportsRaw } from './passage/getAllPassageReportsRaw';
import { getLatestPassageFromReports } from './passage/getLatestPassageFromReports';
import { RouteReminderOrphanError } from './reminder/RouteReminderOrphanError';
import { spawnRouteReminderDaemon } from './reminder/spawnRouteReminderDaemon';
import { surfaceRouteReminderFault } from './reminder/surfaceRouteReminderFault';
import { syncRouteReminderForDrive } from './reminder/syncRouteReminderForDrive';
import { getOneStoneContent } from './stones/getOneStoneContent';
import { getRouteDriveFrontier } from './stones/getRouteDriveFrontier';

/**
 * .what = echoes current stone and pass command for bound route
 * .why = provides GPS-like guidance for clones at session start/end
 *
 * .note = `when` parameter distinguishes hook contexts:
 *         - hook.onBoot: show stone, exit 0 (don't block session start)
 *         - hook.onStop: show stone, exit 2 (block premature stop) — unless a fresh
 *           repairs-in-flight watermark names the stone, then one quiet line, exit 0
 */
export const stepRouteDrive = async (
  input: {
    route?: string;
    when?: 'hook.onBoot' | 'hook.onStop';
  },
  context?: {
    spawnDaemon?: (input: {
      route: string;
      cloneAddr: string;
      intervalMs: number;
      sayTimeoutMs: number;
    }) => Promise<{ pid: number }>;
  },
): Promise<{
  emit: {
    stdout?: string;
    stderr?: { reason: string; code: number };
  } | null;
}> => {
  // derive effective hook context from input
  const hookContext = input.when;

  // a hook fired inside a guard-summoned review is not the driver's session — stay silent
  // .why = an enrolled reviewer clone shares this worktree, so it sees the same bound route
  //        and the same repo-wide hooks. unguarded, onStop blocks the clone's turn-end until
  //        claude code overrides the hook and empties the clone's final message (the review
  //        is lost, and the lane reads as a malfunction), and each block bumps the DRIVER's
  //        stop counter. `runOneReview` marks every review subprocess, on both capture
  //        tactics, and the clone inherits the mark, so it names the session exactly
  if (hookContext && isReviewSubprocess({ env: process.env }))
    return { emit: null };

  // derive route from input or bound branch
  const route =
    input.route || (await getRouteBindByBranch({ branch: null }))?.route;

  // no route bound = not our concern, don't block
  if (!route)
    return {
      emit: { stdout: formatRouteDriveUnbound() },
    };

  // precompute bouncer cache for artifact gate enforcement
  const bouncerCache = await computeRouteBouncerCache({
    cwd: process.cwd(),
    route,
  });
  await setRouteBouncerCache({ cache: bouncerCache, route });

  // read the stone frontier (every stone + its artifacts + the next-one frontier) EXACTLY ONCE, up
  // front, and thread that one snapshot through every branch below — the reminder auto-wire's
  // completion gate, the malfunction halt's stone lookup, and this drive's own next-stone pick.
  // .why = a second, independent frontier read could observe a concurrent artifact/passage write and
  //        yield a frontier that disagrees with the first (a TOCTOU split: the reminder's "is the
  //        drive complete?" verdict and this drive's "is there a next stone?" verdict diverge). one
  //        read = one consistent view, and it halves the frontier I/O on every hook call — the SAME
  //        single-read-threaded discipline this file already applies to passageLatestByStone
  //        (rule.forbid.behavior-hazards, rule.prefer.most-common-denominator).
  const frontier = await getRouteDriveFrontier({ route });

  // read passage.jsonl EXACTLY ONCE here, then derive every view below from this ONE snapshot:
  // the true-latest entry (threaded to the reminder auto-wire's liveness gate) AND the
  // latest-per-stone reduction (the hook pre-check / onStop / direct-mode reads). the reminder used
  // to do its OWN independent full-file read, so two reads of an append-only file could observe a
  // concurrent write and disagree (a TOCTOU split between the reminder's "is the drive live?" and
  // this drive's "is there a next stone / a halt?"). one read = one consistent view — the SAME
  // read-once discipline this file already applies to frontier (rule.forbid.behavior-hazards).
  const passageReportsRaw = await getAllPassageReportsRaw({ route });
  const passageLatest = getLatestPassageFromReports({
    reports: passageReportsRaw,
  });

  // keep this driver session's RouteReminder in sync with the route's live state (auto start/stop)
  // .why = the wish's headline: "the route system upserts the reminder into cron as needed… halt it
  //        when the route is blocked". route.drive runs as a hook inside the driver clone on every
  //        boot/stop, so it is the pulse that findserts the reminder while the route is a live drive
  //        and reaps it when dead — no human runs `route.reminder.gen` by hand (vision Q9, in-scope).
  // .why the fault-guard splits by "is a daemon LOOSE?", keyed on a DEDICATED type:
  //   - a RouteReminderOrphanError (a daemon spawned but un-reapable — loose, unaddressable by
  //     get/del) CANNOT self-correct, so it PROPAGATES: the hook fails loud, a human acts on the
  //     named pid + `kill -9` recovery. it is a dedicated subtype, NOT the base
  //     UnexpectedCodePathError — so a MALFORMED pid handle or a TORN passage line (which also throw
  //     UnexpectedCodePathError but leave NO process loose) do NOT brick route.drive on every
  //     boot/stop (rule.forbid.behavior-hazards — the reminder's failure stays scoped to itself).
  //   - every OTHER reminder fault leaves no process loose → surfaceRouteReminderFault writes it to
  //     the WATCHED per-session reminder log (not the hook's unwatched stderr) and the drive
  //     proceeds; the next drive re-findserts (rule.forbid.failhide — surfaced, never hidden).
  //   a non-enrolled session skips entirely (getRouteDriverCloneAddr → null inside the sync).
  // .why an orphan propagates even at hook.onBoot — a DELIBERATE exception to the boot contract
  //   ("onBoot: show stone, exit 0, don't block session start"): a loose daemon nudges a session
  //   forever with no handle to stop it (the wish's forbidden infiniloop), so a blocked boot that
  //   forces a human to `kill -9` the named pid is the LESSER harm than a session that boots clean
  //   while an unaddressable drone nudges on. this is the ONE fault allowed to break boot; every
  //   other reminder fault honors exit-0. both branches are clamped in stepRouteDrive.integration
  //   (case15 benign-surfaces-and-proceeds, case16 orphan-propagates-under-onBoot).
  await syncRouteReminderForDrive(
    { route, frontier, latest: passageLatest },
    {
      spawnDaemon: context?.spawnDaemon ?? ((i) => spawnRouteReminderDaemon(i)),
    },
  ).catch(async (reminderError: unknown) => {
    // a loose daemon is the ONE un-proceedable fault → propagate, the hook fails loud
    if (reminderError instanceof RouteReminderOrphanError) throw reminderError;

    // every other fault leaves no process loose → surface to the watched channel, drive proceeds
    await surfaceRouteReminderFault({ route, error: reminderError });
  });

  // the latest passage entry per stone, threaded through every branch below (hook pre-check,
  // onBoot, onStop, direct mode). derived from the SAME `passageReportsRaw` read above — NOT a
  // second read — so the reminder's liveness gate and this drive's push/halt decision share one
  // consistent view of an append-only file (rule.forbid.behavior-hazards). getLatestForStone(name)
  // reads from this snapshot rather than a second read of the file.
  const passageLatestByStone = await getAllLatestPassageByStone({
    route,
    reports: passageReportsRaw,
  });
  const getLatestForStone = (name: string): PassageReport | null =>
    passageLatestByStone.find((report) => report.stone === name) ?? null;

  // the route's stones, from the one frontier snapshot — the hard-stop gate below needs a
  // stone's guard to apply its brain, and it fires before the main flow
  const stones = frontier.stones;

  // 🔴 the dropped-key advisory does NOT ride the drive
  // .why = a guard typo is true on every tick until fixed, and a warn seen on every tick
  //        is a warn no one reads. it belongs to a surface that reads a guard on purpose
  // 🟡 .note = no such surface calls `formatGuardParseWarnings` yet; it is unwired

  // does ANY stone declare a brain? a per-ROUTE fact, computed once at zero I/O
  // .why = it parts case=10 from case=7 in `applyStoneBrainOnEntry`: every extant route is
  //        `false`, so its drive stays byte-identical; an opted-in route may render
  //        an inherited `brain = <slug>` on its brainless stones
  const routeDeclaresBrain = isRouteBrainDeclared({ stones });

  // apply a stone's prescribed brain, then mark the entry
  // .why = onBoot + direct dispatch UNCONDITIONALLY (a resumed session at a marked stone
  //        must still switch, F7); onStop only on ENTRY (a per-tick spawn is waste)
  const applyStoneBrain = (stoneApplied: {
    name: string;
    guard: RouteStoneGuard | null;
  }): Promise<StoneBrainOutcome> =>
    applyStoneBrainOnEntry({
      stone: stoneApplied,
      route,
      dispatchAlways: hookContext !== 'hook.onStop',
      routeDeclaresBrain,
    });

  // in hook mode, surface a hard-stop halt (malfunction or driver wall) immediately
  // .why = the push/halt classification comes from asRouteStoneDisposition — the SAME single
  //        source the onStop path and the statusline read — so the hook can never disagree
  //        with them (rule.require.single-source-of-truth-for-render). the two hard-stop
  //        halts are caught here, up front, so they escalate at once; the softer halts
  //        (approval / exhausted) fall through to the per-stone onStop path below.
  // .note = getAllLatestPassageByStone reads RAW file order (true chronological last-per-
  //         stone), so any forward motion (a later --as entry) already superseded a stale
  //         halt before we read it. it must NOT read getAllPassageReports, whose sticky
  //         re-bucket would return BOTH an 'approved' row and a 'malfunction' row for a
  //         `[malfunction, approved]` stone → a false malfunction halt after a human approved.
  //         a driver wall = status 'blocked' with NO guard blocker → disposition halt(blocked);
  //         an agent-fixable blocker (review.self/peer/…) → push, so it does not match here.
  if (hookContext) {
    const dispositions = asRouteDispositions({ reports: passageLatestByStone });

    // 🔴 apply the HALTED stone's brain, then render the halt with it on the `where do we
    //    go?` line — a human who comes to fix the halt works at this stone, so its brain
    //    must be live. a stone with no brain renders byte-identically
    // .note = the halt body is a BUILDER of the prescription, since the slug is known only
    //         after the apply; that lets the brain sit inside the halt's own tree
    // .note = the halted stone is the right one because this gate is TERMINAL: no second
    //         stone reaches the surface. after a rewind (stone 5 walls, driver rewinds to 3)
    //         it applies stone 5's brain for one tick; the next onStop sees 5 ≠ 3 and
    //         dispatches stone 3's (a convergent applier, F14)
    const composeHaltStdout = async (
      stoneName: string,
      // the whole prescription (choice + effort), so no halt renders one fact short
      buildHalt: (prescribed: {
        brain: string | null;
        effort: string | null;
      }) => string,
    ): Promise<string> => {
      const stoneApplied = getOneStoneByName({ stones, name: stoneName });
      const guard = stoneApplied?.guard ?? null;
      const outcome = await applyStoneBrain({ name: stoneName, guard });
      return formatStoneBrainOutcome(
        {
          route,
          stone: stoneName,
          outcome,
          drive: buildHalt({
            brain: asStoneBrainSlug({ outcome }),
            effort: asStoneBrainEffort({ outcome }),
          }),
        },
        // stack the brain halt ABOVE the route halt; a replace would hide the route halt
        { whenUndispatched: 'prepend' },
      );
    };

    // a guard malfunction → surface it. malfunction takes priority over a driver wall.
    // .why = onStop escalates to a human at once (exit 1, the malfunction code per
    //        rule.require.exit-code-semantics: 0 ok, 1 malfunction, 2 constraint); onBoot
    //        must NOT block session start (the hook contract: "onBoot: show stone, exit 0"),
    //        so at boot it shows the same message but WITHOUT the exit stderr — else a
    //        malfunction anywhere in history would make every fresh session's boot fail and
    //        stall the route.
    const malfunction = dispositions.find(
      (d) => d.disposition.of === 'halt' && d.disposition.why === 'malfunction',
    );
    if (malfunction) {
      // a MIXED halt (a malfunction that broke the SAME pass a lower level exhausted) carries
      // both reasons in its persisted reason. render every reason + remedy — not the bare
      // escalation — so the replay matches the live pass (no dropped exhaustion guidance).
      const malfunctionReason = malfunction.report.reason ?? '';
      if (malfunctionReason.includes('budget exhausted')) {
        const stoneForHalt = frontier.stones.find(
          (s) => s.name === malfunction.report.stone,
        );
        if (stoneForHalt) {
          const { meters } = await getCurrentExhaustedSlugs({
            stone: stoneForHalt,
            route,
          });
          const stdoutMixed = await composeHaltStdout(
            malfunction.report.stone,
            (prescribed) =>
              formatRouteDriveMixedHalt({
                route,
                stone: malfunction.report.stone,
                ...prescribed,
                reason: malfunctionReason,
                meters,
              }),
          );
          if (hookContext === 'hook.onBoot')
            return { emit: { stdout: stdoutMixed } };
          return {
            emit: {
              stdout: stdoutMixed,
              stderr: {
                reason: formatRouteDriveMalfunctionEscalate({
                  stone: malfunction.report.stone,
                }),
                code: 1,
              },
            },
          };
        }
      }

      const stdout = await composeHaltStdout(
        malfunction.report.stone,
        (prescribed) =>
          formatRouteDriveMalfunction({
            route,
            stone: malfunction.report.stone,
            ...prescribed,
            reason: malfunction.report.reason ?? null,
          }),
      );
      if (hookContext === 'hook.onBoot') return { emit: { stdout } };
      return {
        emit: {
          stdout,
          stderr: {
            reason: formatRouteDriveMalfunctionEscalate({
              stone: malfunction.report.stone,
            }),
            code: 1,
          },
        },
      };
    }

    // a driver wall (--as blocked, no guard blocker) → allow a graceful stop
    const wall = dispositions.find(
      (d) => d.disposition.of === 'halt' && d.disposition.why === 'blocked',
    );
    if (wall) {
      // read the articulation presence up front, since the halt builder is synchronous
      const articulated = await isRouteStoneBlockerArticulated({
        route,
        stone: wall.report.stone,
      });
      return {
        emit: {
          stdout: await composeHaltStdout(wall.report.stone, (prescribed) =>
            formatRouteDriveBlocked({
              route,
              stone: wall.report.stone,
              ...prescribed,
              articulated,
            }),
          ),
        },
      };
    }
  }

  // the next stone(s) come from the ONE frontier snapshot read up front (shared with the reminder
  // auto-wire's completion gate) — never a second read (rule.forbid.behavior-hazards)
  const nextStones = frontier.nextStones;

  // no next stones → route complete, ok to stop
  if (nextStones.length === 0) {
    // in hook mode, silent exit when route complete
    if (hookContext) {
      return { emit: null };
    }
    return {
      emit: { stdout: formatRouteDriveComplete() },
    };
  }

  // get first stone and read its content
  const stone = nextStones[0]!;
  const stoneContent = await getOneStoneContent({ path: stone.path });

  // one renderer for the three surfaces (onBoot/onStop/direct)
  // .note = `kind` parts a HALT body from WORK prose: an undispatched brain STACKS above a
  //         halt and REPLACES work prose (an unswitched stone never reads as ready, case=8 [t2])
  const asRenderFor =
    (outcome: StoneBrainOutcome) =>
    (drive: string, kind: 'halt' | 'work' = 'work'): string =>
      formatStoneBrainOutcome(
        { route, stone: stone.name, outcome, drive },
        { whenUndispatched: kind === 'halt' ? 'prepend' : 'replace' },
      );

  // 🔴 apply the current stone's brain ONCE, before every branch of all three surfaces
  // .why = the hard-stop gate above already returned for any malfunction/wall (with the
  //        HALTED stone's brain), so this runs once per invocation; `dispatchAlways` in
  //        `applyStoneBrain` fits whichever surface this is. so every return below — work,
  //        blocked, exhausted, stuck — carries the switch, never a silent no-op
  const brainedStone = await applyStoneBrain({
    name: stone.name,
    guard: stone.guard ?? null,
  });
  const asRendered = asRenderFor(brainedStone);

  // the brain facts the drive renders beside route + stone: the choice, and its effort
  // .note = null when a stone neither declares nor inherits one, so the line drops and
  //         every extant route renders byte-identically (case=10)
  // .note = the two travel TOGETHER, so no surface reports half a prescription
  const prescribed = {
    brain: asStoneBrainSlug({ outcome: brainedStone }),
    effort: asStoneBrainEffort({ outcome: brainedStone }),
  };

  // onBoot: show stone guidance, exit 0 (don't block session start)
  // but if blocked on a guard blocker, show the blocker message
  if (hookContext === 'hook.onBoot') {
    // onBoot dispatches UNCONDITIONALLY
    // .why = the entry marker persists on DISK, so a fresh session that boots at an
    //        already-entered stone would never switch — the most common resume (F7). a
    //        re-assert is one redundant idempotent `/model` (F14)
    // the brain was applied once, above — this surface reuses that outcome
    const asBooted = asRendered;

    // check blocker report to see why the stone is blocked, if at all
    const blockerReport = await getStoneGuardBlockerReport({
      stone: stone.name,
      route,
    });

    // if a live blocker message applies, show it
    const blockerMessage = await getOneRouteDriveBlockerMessage({
      blockerReport,
      stone,
      route,
      ...prescribed,
    });
    if (blockerMessage)
      return { emit: { stdout: asBooted(blockerMessage.stdout, 'halt') } };

    // exhausted status → show the approve-or-extend / concession prompt at boot too.
    // .why = an exhausted status is a halt of any kind — ordinary/urgent (a human must
    //        approve or extend the peer budget) or a `better` concession (the driver's own
    //        `--add N --peer`). all render the same prompt, and onBoot blocks no stop, so it
    //        consumes only the message. the ONE live read inside getRouteDriveExhaustedMessage
    //        classifies the halt (S12), so onBoot never re-decodes the concession mark here
    //        (rule.require.single-source-of-truth-for-render).
    const latestForStoneBoot = getLatestForStone(stone.name);
    if (latestForStoneBoot?.status === 'exhausted')
      return {
        emit: {
          stdout: asBooted(
            (
              await getRouteDriveExhaustedMessage({
                stone,
                route,
                ...prescribed,
              })
            ).stdout,
            'halt',
          ),
        },
      };

    // otherwise, show generic stone guidance
    const roundBoot = await getOneStoneGuardRoundLatest({ stone, route });
    return {
      emit: {
        stdout: asBooted(
          formatRouteDrive({
            route,
            stone: stone.name,
            ...prescribed,
            content: stoneContent,
            round: roundBoot,
            count: 0,
            suggestBlocked: false,
          }),
        ),
      },
    };
  }

  // onStop: track and potentially block premature stop
  if (hookContext === 'hook.onStop') {
    // the brain was applied once, above — this surface reuses that outcome on every
    // onStop return, blocked and exhausted included
    // .note = `applyStoneBrainOnEntry` marks the entry, so a stone that halts straight to
    //         blocked does not re-dispatch per tick; the block count is untouched
    const asStopped = asRendered;

    // read the driver's repairs-in-flight watermark for this stone
    // .why = a driver that delegated the round's repairs waits on them; arrived, passed, and
    //        blocked are each wrong for that wait. a fresh watermark lets the stop through
    //        with one quiet line; a stale one keeps the nudge and names itself beside it
    const inflightFreshness = asRouteInflightFreshness({
      inflight: await getRouteInflight({ route }),
      stone: stone.name,
      now: Date.now(),
    });
    if (inflightFreshness.of === 'fresh')
      return { emit: { stdout: asRouteInflightNote(inflightFreshness) } };

    // check blocker report to see why the stone is blocked, if at all
    // this is set by route.stone.set --as passed when it fails
    const blockerReport = await getStoneGuardBlockerReport({
      stone: stone.name,
      route,
    });

    // if a live blocker message applies, honor its stop disposition
    // .why = approval / exhausted (not-approved) ALLOW the stop (agent waits for
    //        a human); feedbackUnabsorbed BLOCKS it (agent can act now: write .taken).
    //        a null message means the blocker is stale or resolved — fall through
    //        to the block-stop logic below (e.g. approval was granted → proceed).
    const blockerMessage = await getOneRouteDriveBlockerMessage({
      blockerReport,
      stone,
      route,
      ...prescribed,
    });
    if (blockerMessage) {
      if (blockerMessage.blocksStop)
        return {
          emit: {
            stdout: asStopped(blockerMessage.stdout, 'halt'),
            stderr: { reason: blockerMessage.stdout, code: 2 },
          },
        };
      return { emit: { stdout: asStopped(blockerMessage.stdout, 'halt') } };
    }

    // no live blocker message → the one halt left is an exhausted status. driver-wall
    // blocked and malfunction already returned above; a stale volatile blocker keeps
    // status 'blocked' and so pushes forward here.
    //
    // 🔴 the message AND the stop disposition come from ONE live read (B1 fix). a `better`
    //    concession BLOCKS the stop (stderr code 2) — no human is owed, so to allow the stop
    //    would end the session over a command the driver holds (`--add N --peer`), and a
    //    human would have to restart it. every other exhaustion — ordinary, `urgent` (a
    //    grant a HUMAN must make, r008.b1), or a stale halt — ALLOWS the stop. the decision
    //    can no longer disagree with the rendered message, because both read the same live
    //    concession kind inside getRouteDriveExhaustedMessage (S12).
    //
    // .note = the block emits stderr code 2, the same shape the feedbackUnabsorbed and undeclared
    //         gates use for "the driver can act NOW".
    const latestForStone = getLatestForStone(stone.name);
    if (latestForStone?.status === 'exhausted') {
      const exhausted = await getRouteDriveExhaustedMessage({
        stone,
        route,
        ...prescribed,
      });
      const stdout = asStopped(exhausted.stdout, 'halt');
      if (exhausted.blocksStop)
        return { emit: { stdout, stderr: { reason: stdout, code: 2 } } };
      return { emit: { stdout } };
    }

    // push → the route self-drives: track this block attempt and block the stop
    // .note = state.count tracks hooks without passage attempt; used for nudge threshold
    const { state } = await setDriveBlockerState({ route, stone: stone.name });

    // check if we've exceeded max consecutive blocks (cutoff: 21)
    const maxBlocks = 21;
    if (state.count > maxBlocks) {
      // stop-block exhausted → exit 1 (malfunction: the route is stuck and a human must
      // step in). the guard-malfunction branch uses code 1 too; per
      // rule.require.exit-code-semantics (0 ok, 1 malfunction, 2 constraint) — never a
      // non-standard code 3
      // a HALT surface too — the route is stuck and a human is escalated, so the brain
      // that prices the fix must be named here as on every other onStop return
      const stdoutStuck = asStopped(
        formatRouteDriveExhausted({
          route,
          stone: stone.name,
          ...prescribed,
          count: state.count,
          max: maxBlocks,
        }),
        'halt',
      );
      return {
        emit: {
          stdout: stdoutStuck,
          stderr: {
            reason: formatRouteDriveEscalate({
              route,
              stone: stone.name,
              count: state.count,
            }),
            code: 1,
          },
        },
      };
    }

    // format output with nudge threshold and blocked suggestion; a stale watermark is named
    // beneath the nudge, so the driver sees why the hook is loud again
    const stdoutNudge = formatRouteDrive({
      route,
      stone: stone.name,
      ...prescribed,
      content: stoneContent,
      round: await getOneStoneGuardRoundLatest({ stone, route }),
      count: state.count,
      suggestBlocked: state.count > 5,
    });
    const stdoutDrive =
      inflightFreshness.of === 'stale'
        ? [stdoutNudge, '', asRouteInflightNote(inflightFreshness)].join('\n')
        : stdoutNudge;

    // block stop - exit code 2 signals it, and the two channels carry DIFFERENT cuts
    // 🔴 .why = `stderr.reason` answers "why am I blocked?", so it carries the RAW drive
    //    body. the composed render may REPLACE that body with a brain halt (undispatched,
    //    F-a), which would hide the stop cause — as the `blocksStop` arm above also does
    // .note = `stdout` stays COMPOSED: a human needs the brain halt, a consumer the cause
    const stdout = asStopped(stdoutDrive);
    return {
      emit: {
        stdout,
        stderr: { reason: stdoutDrive, code: 2 },
      },
    };
  }

  // direct mode (`rhx route.drive`) reuses the outcome applied above
  // .why = it is the command every halt tells a lost driver to run; without the brain halt
  //        here, an unenrolled driver would read the stone as ready when its guard says not
  const asDriven = asRendered;

  // direct mode: check for blocker status and show appropriate message
  const blockerReport = await getStoneGuardBlockerReport({
    stone: stone.name,
    route,
  });

  // if a live blocker message applies, show it
  const blockerMessage = await getOneRouteDriveBlockerMessage({
    blockerReport,
    stone,
    route,
    ...prescribed,
  });
  if (blockerMessage)
    return { emit: { stdout: asDriven(blockerMessage.stdout, 'halt') } };

  // read the latest passage and derive its disposition through the SAME shared op the
  // onStop branch reads (asRouteStoneDisposition) — so direct mode honors the vision's
  // "one disposition, two surfaces": the halt reason is derived once, never re-inlined
  const latestForStoneDirect = getLatestForStone(stone.name);
  const dispositionDirect = latestForStoneDirect
    ? asRouteStoneDisposition({
        status: latestForStoneDirect.status,
        blocker: latestForStoneDirect.blocker ?? null,
        reason: latestForStoneDirect.reason ?? null,
      })
    : null;

  // driver wall (--as blocked, no guard blocker) → surface the same halted/blocked
  // message hook mode shows, so direct `rhx route.drive` does not silently drop it
  if (dispositionDirect?.of === 'halt' && dispositionDirect.why === 'blocked')
    return {
      emit: {
        stdout: asDriven(
          formatRouteDriveBlocked({
            route,
            stone: stone.name,
            ...prescribed,
            articulated: await isRouteStoneBlockerArticulated({
              route,
              stone: stone.name,
            }),
          }),
          'halt',
        ),
      },
    };

  // exhausted status → show the approve-or-extend / concession prompt (its own halt, no
  // blocker). every exhaustion kind — ordinary/urgent or a `better` concession — renders
  // the same prompt; direct mode has no stop to block, so it consumes only the message. the
  // ONE live read inside getRouteDriveExhaustedMessage classifies the halt (S12), so direct
  // mode never re-decodes the concession mark here.
  if (latestForStoneDirect?.status === 'exhausted')
    return {
      emit: {
        stdout: asDriven(
          (
            await getRouteDriveExhaustedMessage({
              stone,
              route,
              ...prescribed,
            })
          ).stdout,
          'halt',
        ),
      },
    };

  // no blocker or already approved, show generic stone guidance
  const roundDirect = await getOneStoneGuardRoundLatest({ stone, route });
  return {
    emit: {
      stdout: asDriven(
        formatRouteDrive({
          route,
          stone: stone.name,
          ...prescribed,
          content: stoneContent,
          round: roundDirect,
          count: 0,
          suggestBlocked: false,
        }),
      ),
    },
  };
};

/**
 * .what = formats route.drive output when no route is bound
 * .why = friendly feedback instead of silence
 */
const formatRouteDriveUnbound = (): string =>
  [
    `🦉 where were we?`,
    '',
    `🗿 route.drive`,
    `   └─ dunno, route not bound`,
  ].join('\n');

/**
 * .what = formats route.drive output when route is complete
 * .why = consistent output for completed routes
 */
const formatRouteDriveComplete = (): string =>
  [
    `🦉 where were we?`,
    '',
    `🗿 route.drive`,
    // .note = 🌴🤙 matches asStatusLine's complete glyph (one render truth for "done, hang
    //         loose — close it out or rewind"); do not diverge to 🎉
    `   └─ route complete! 🌴🤙`,
  ].join('\n');

/**
 * .what = formats reason for block in hook mode
 * .why = provides clear instruction to Claude on what to do next
 */
const formatRouteDriveBlockReason = (input: {
  route: string;
  stone: string;
  count: number;
}): string => {
  const passCmd = `${asRouteStoneSetCommandHead({ stone: input.stone })} --as passed`;
  return `route not complete (block ${input.count}/21). next stone: ${input.stone}. when done, run: ${passCmd}`;
};

/**
 * .what = formats output when block limit exhausted
 * .why = signals need for human intervention
 */
const formatRouteDriveExhausted = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
  count: number;
  max: number;
}): string =>
  [
    ...formatRouteDriveHeader(input),
    `   └─ 🟡 stuck! blocked ${input.count}x (max: ${input.max})`,
    `      └─ please tell a human what you saw and where`,
  ].join('\n');

/**
 * .what = formats escalation message for stderr when stuck
 * .why = provides context for human intervention
 */
const formatRouteDriveEscalate = (input: {
  route: string;
  stone: string;
  count: number;
}): string => {
  return `stuck on stone ${input.stone} after ${input.count} attempts. please tell a human what you saw, where you got stuck, and what you tried.`;
};

/**
 * .what = formats route.drive output when reviewer/judge malfunctioned
 * .why = a malfunction halts the stone, yet it is the DRIVER's to clear: a transient fault
 *        clears with a re-arrive, an overflow or a bad glob with a guard edit, and every
 *        lane that did return still owes an answer. so the halt names which lanes broke
 *        and why, and lists the driver's levers first — a human only for a grant the
 *        driver cannot make (rule.always.diagnose-reviewer-malfunctions)
 *
 * .note = a record persisted before the reason was recorded carries no lanes; the levers
 *         still render, since they hold whatever the lanes were
 */
const formatRouteDriveMalfunction = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
  reason: string | null;
}): string => {
  const detail = asGuardMalfunctionReasonLines({ reason: input.reason });

  // the header — how many parts broke, of how many — empty when the record predates it
  const headerLines = detail ? [`      ├─ reason = ${detail.header}`] : [];

  // 💥 is a CLAIMED REGISTER GLYPH, never decoration. `catalog.of=glyph.axis=halt.md`
  // declares it for `malfunction`, against ✋ `blocked` and 👋 `exhausted` — it answers
  // "which halt is this?" before the words parse, which is the one test the register
  // applies (`term=glyph._.choice._.md`).
  //
  // ⛔ do NOT strip it to match the bare halt headers beside it.
  //    `rule.prefer.chill-nature-emojis` caps UNCLAIMED prose emphasis and holds no
  //    jurisdiction over a claimed marker. the bare peers are the defect — they are owed
  //    ✋ and 👋 — so consistency here is repaid upward, never by a strip.
  return [
    ...formatRouteDriveHeader(input),
    `   └─ 💥 halted, guard malfunction`,
    ...headerLines,
    ...formatGuardMalfunctionClearLines({
      stone: input.stone,
      reason: input.reason,
      indent: '      ',
      branch: '└─',
    }),
  ].join('\n');
};

/**
 * .what = formats escalation message for stderr when malfunction detected
 * .why = the stop must hold, yet the message must not send driver work to a human
 */
const formatRouteDriveMalfunctionEscalate = (input: {
  stone: string;
}): string => {
  return `a reviewer or judge malfunctioned on stone ${input.stone}. it is yours to clear: each broken part names its cause and next step above (rule.always.diagnose-reviewer-malfunctions).`;
};

/**
 * .what = formats route.drive output when stone is blocked
 * .why = allows agent to stop gracefully when stone marked as blocked
 */
const formatRouteDriveBlocked = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
  articulated: boolean;
}): string => {
  // render '.' when the route IS the cwd (else `route = ` shows empty), and build
  // the reason via path.join so it never gains a spurious slash-prefix
  const routeRelative = asRouteDisplayPath({ route: input.route });
  const articulationPath = path.join(
    routeRelative,
    'blocker',
    `${input.stone}.md`,
  );

  // cite the articulation path only when the file is there; a guard-written `blocked`
  // row has no file, and a cited path that names naught on disk misleads the reader
  const reasonLine = input.articulated
    ? `      └─ reason: ${articulationPath}`
    : `      └─ reason: no articulation written (no ${articulationPath})`;
  return [
    ...formatRouteDriveHeader(input),
    `   └─ halted, stone marked blocked`,
    reasonLine,
  ].join('\n');
};

/**
 * .what = returns drum nudge tree bucket for stuck clones
 * .why = gentle reminder after 7+ hooks without passage attempt
 */
const formatRouteDriveNudge = (): string[] => {
  return [
    `   ├─ 🪘 walk the way`,
    `   │  ├─`,
    `   │  │`,
    `   │  │  do your work, then step back`,
    `   │  │  the only path to serenity`,
    `   │  │`,
    `   │  │  — tao te ching`,
    `   │  │`,
    `   │  └─`,
    `   │`,
  ];
};

/**
 * .what = formats route.drive output with stone content
 * .why = provides GPS-like guidance with full stone context
 *
 * .note = count tracks hooks without passage attempt (via setDriveBlockerState)
 *         if count >= 7, includes drum nudge to encourage action
 */
const formatRouteDrive = (input: {
  route: string;
  stone: string;
  brain: string | null;
  effort: string | null;
  content: string;
  /**
   * the stone's latest guard round, or null where no peer lane has spoken. rendered as the
   * latest-round block above the commands, so a round whose stdout was lost stays readable
   */
  round: Parameters<typeof formatRouteDriveRoundLines>[0]['round'] | null;
  count: number;
  suggestBlocked: boolean;
}): string => {
  // .note = deliberate local line-builder, scoped to this formatter — the escape hatch in
  //         rule.require.immutable-vars permits a scoped emit builder; no array crosses a boundary.
  const lines: string[] = [];

  // tea pause for stuck drivers (same trigger as suggestBlocked) — the aside between the
  // owl and the tree, the one header slot only this surface fills
  const head = asRouteStoneSetCommandHead({ stone: input.stone });
  const arrivedCmd = `${head} --as arrived`;
  const passedCmd = `${head} --as passed`;
  const blockedCmd = `${head} --as blocked`;
  const teaLines = input.suggestBlocked
    ? [
        `🍵 tea first. then, choose your path.`,
        `   │`,
        `   ├─ you must choose one`,
        `   │  ├─ ready for review?`,
        `   │  │  └─ ${arrivedCmd}`,
        `   │  │`,
        `   │  ├─ ready to continue?`,
        `   │  │  └─ ${passedCmd}`,
        `   │  │`,
        `   │  └─ blocked and need help?`,
        `   │     └─ ${blockedCmd}`,
        `   │`,
        `   └─ 🟡 to refuse is not an option.`,
        `      work on the stone, or mark your status.`,
        '',
      ]
    : [];

  // header, then the tea pause aside (where one applies), then the route.drive tree
  // .note = the aside sits between the owl and the tree, so this surface cannot reuse
  //         `formatRouteDriveHeader` whole; it shares the `where do we go?` bucket instead
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(...teaLines);
  lines.push(`🗿 route.drive`);
  lines.push(...formatRouteDriveWhere(input));
  lines.push(`   │`);

  // the latest guard round, where one exists — what each lane said, and what the judge decided
  if (input.round)
    lines.push(...formatRouteDriveRoundLines({ round: input.round }));

  // command prompt with both options
  lines.push(`   ├─ are you here?`);
  lines.push(`   │  ├─ when ready for review, run:`);
  lines.push(`   │  │  └─ ${arrivedCmd}`);
  lines.push(`   │  └─ when ready to continue, run:`);
  lines.push(`   │     └─ ${passedCmd}`);
  lines.push(`   │`);

  // drum nudge for stuck clones (7+ hooks without passage attempt)
  if (input.count >= 7) {
    lines.push(...formatRouteDriveNudge());
  }

  // stone content block
  lines.push(`   ├─ here's the stone`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);

  // format stone content with proper indentation
  const contentLines = input.content.split('\n');
  for (const contentLine of contentLines) {
    lines.push(`   │  │  ${contentLine}`);
  }

  lines.push(`   │  └─`);
  lines.push(`   │`);

  // command prompt at bottom (easy copy after you read the stone)
  if (input.suggestBlocked) {
    // show blocked option when stuck
    lines.push(`   ├─ are you here?`);
    lines.push(`   │  ├─ when ready for review, run:`);
    lines.push(`   │  │  └─ ${arrivedCmd}`);
    lines.push(`   │  └─ when ready to continue, run:`);
    lines.push(`   │     └─ ${passedCmd}`);
    lines.push(`   │`);
    lines.push(`   └─ are you blocked? if so, run`);
    lines.push(`      └─ ${blockedCmd}`);
  } else {
    lines.push(`   └─ are you here?`);
    lines.push(`      ├─ when ready for review, run:`);
    lines.push(`      │  └─ ${arrivedCmd}`);
    lines.push(`      └─ when ready to continue, run:`);
    lines.push(`         └─ ${passedCmd}`);
  }

  return lines.join('\n');
};
