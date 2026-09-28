import * as fs from 'fs/promises';
import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getRouteBindByBranch } from './bind/getRouteBindByBranch';
import { computeRouteBouncerCache } from './bouncer/computeRouteBouncerCache';
import { setRouteBouncerCache } from './bouncer/setRouteBouncerCache';
import { asRouteDisplayPath } from './drive/asRouteDisplayPath';
import { asRouteStoneDisposition } from './drive/asRouteStoneDisposition';
import { formatRouteDriveMixedHalt } from './drive/formatRouteDriveMixedHalt';
import { getCurrentExhaustedSlugs } from './drive/getCurrentExhaustedSlugs';
import { getRouteDriveBlockerMessage } from './drive/getRouteDriveBlockerMessage';
import { getRouteDriveExhaustedMessage } from './drive/getRouteDriveExhaustedMessage';
import { getStoneGuardBlockerReport } from './drive/getStoneGuardBlockerReport';
import { setDriveBlockerState } from './drive/setDriveBlockerState';
import { getAllLatestPassageByStone } from './passage/getAllLatestPassageByStone';
import { getAllPassageReportsRaw } from './passage/getAllPassageReportsRaw';
import { getLatestPassageFromReports } from './passage/getLatestPassageFromReports';
import { RouteReminderOrphanError } from './reminder/RouteReminderOrphanError';
import { spawnRouteReminderDaemon } from './reminder/spawnRouteReminderDaemon';
import { surfaceRouteReminderFault } from './reminder/surfaceRouteReminderFault';
import { syncRouteReminderForDrive } from './reminder/syncRouteReminderForDrive';
import { getRouteDriveFrontier } from './stones/getRouteDriveFrontier';

/**
 * .what = echoes current stone and pass command for bound route
 * .why = provides GPS-like guidance for clones at session start/end
 *
 * .note = `when` parameter distinguishes hook contexts:
 *         - hook.onBoot: show stone, exit 0 (don't block session start)
 *         - hook.onStop: show stone, exit 2 (block premature stop)
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
  // derive route from input or bound branch
  let route = input.route;
  if (!route) {
    const bind = await getRouteBindByBranch({ branch: null });
    if (!bind) {
      // no route bound = not our concern, don't block
      return {
        emit: { stdout: formatRouteDriveUnbound() },
      };
    }
    route = bind.route;
  }

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
    const dispositions = passageLatestByStone.map((report) => ({
      report,
      disposition: asRouteStoneDisposition({
        status: report.status,
        blocker: report.blocker ?? null,
        reason: report.reason ?? null,
      }),
    }));

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
          const stdoutMixed = formatRouteDriveMixedHalt({
            route,
            stone: malfunction.report.stone,
            reason: malfunctionReason,
            meters,
          });
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

      const stdout = formatRouteDriveMalfunction({
        route,
        stone: malfunction.report.stone,
      });
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
      return {
        emit: {
          stdout: formatRouteDriveBlocked({
            route,
            stone: wall.report.stone,
          }),
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
  const stoneContent = await fs.readFile(stone.path, 'utf-8');

  // onBoot: show stone guidance, exit 0 (don't block session start)
  // but if blocked on a guard blocker, show the blocker message
  if (hookContext === 'hook.onBoot') {
    // check blocker report to see why the stone is blocked, if at all
    const blockerReport = await getStoneGuardBlockerReport({
      stone: stone.name,
      route,
    });

    // if a live blocker message applies, show it
    const blockerMessage = await getRouteDriveBlockerMessage({
      blockerReport,
      stone,
      route,
    });
    if (blockerMessage) return { emit: { stdout: blockerMessage.stdout } };

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
          stdout: (await getRouteDriveExhaustedMessage({ stone, route }))
            .stdout,
        },
      };

    // otherwise, show generic stone guidance
    const stdout = formatRouteDrive({
      route,
      stone: stone.name,
      content: stoneContent,
      count: 0,
      suggestBlocked: false,
    });
    return {
      emit: { stdout },
    };
  }

  // onStop: track and potentially block premature stop
  if (hookContext === 'hook.onStop') {
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
    const blockerMessage = await getRouteDriveBlockerMessage({
      blockerReport,
      stone,
      route,
    });
    if (blockerMessage) {
      if (blockerMessage.blocksStop)
        return {
          emit: {
            stdout: blockerMessage.stdout,
            stderr: { reason: blockerMessage.stdout, code: 2 },
          },
        };
      return { emit: { stdout: blockerMessage.stdout } };
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
      const { stdout, blocksStop } = await getRouteDriveExhaustedMessage({
        stone,
        route,
      });
      if (blocksStop)
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
      return {
        emit: {
          stdout: formatRouteDriveExhausted({
            route,
            stone: stone.name,
            count: state.count,
            max: maxBlocks,
          }),
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

    // format output with nudge threshold and blocked suggestion
    const stdout = formatRouteDrive({
      route,
      stone: stone.name,
      content: stoneContent,
      count: state.count,
      suggestBlocked: state.count > 5,
    });

    // block stop - same content in stdout AND stderr (for visibility), exit code 2 to signal
    return {
      emit: {
        stdout,
        stderr: { reason: stdout, code: 2 },
      },
    };
  }

  // direct mode: check for blocker status and show appropriate message
  const blockerReport = await getStoneGuardBlockerReport({
    stone: stone.name,
    route,
  });

  // if a live blocker message applies, show it
  const blockerMessage = await getRouteDriveBlockerMessage({
    blockerReport,
    stone,
    route,
  });
  if (blockerMessage) return { emit: { stdout: blockerMessage.stdout } };

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
        stdout: formatRouteDriveBlocked({ route, stone: stone.name }),
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
        stdout: (await getRouteDriveExhaustedMessage({ stone, route })).stdout,
      },
    };

  // no blocker or already approved, show generic stone guidance
  const stdout = formatRouteDrive({
    route,
    stone: stone.name,
    content: stoneContent,
    count: 0,
    suggestBlocked: false,
  });
  return {
    emit: { stdout },
  };
};

/**
 * .what = formats route.drive output when no route is bound
 * .why = friendly feedback instead of silence
 */
const formatRouteDriveUnbound = (): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   └─ dunno, route not bound`);
  return lines.join('\n');
};

/**
 * .what = formats route.drive output when route is complete
 * .why = consistent output for completed routes
 */
const formatRouteDriveComplete = (): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  // .note = 🌴🤙 matches asStatusLine's complete glyph (one render truth for "done, hang
  //         loose — close it out or rewind"); do not diverge to 🎉
  lines.push(`   └─ route complete! 🌴🤙`);
  return lines.join('\n');
};

/**
 * .what = formats reason for block in hook mode
 * .why = provides clear instruction to Claude on what to do next
 */
const formatRouteDriveBlockReason = (input: {
  route: string;
  stone: string;
  count: number;
}): string => {
  const passCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
  return `route not complete (block ${input.count}/21). next stone: ${input.stone}. when done, run: ${passCmd}`;
};

/**
 * .what = formats output when block limit exhausted
 * .why = signals need for human intervention
 */
const formatRouteDriveExhausted = (input: {
  route: string;
  stone: string;
  count: number;
  max: number;
}): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ 🟡 stuck! blocked ${input.count}x (max: ${input.max})`);
  lines.push(`      └─ please tell a human what you saw and where`);
  return lines.join('\n');
};

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
 * .why = immediate halt with escalation to human
 */
const formatRouteDriveMalfunction = (input: {
  route: string;
  stone: string;
}): string => {
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  // 💥 is a CLAIMED REGISTER GLYPH, never decoration. `catalog.of=glyph.axis=halt.md`
  // declares it for `malfunction`, against ✋ `blocked` and 👋 `exhausted` — it answers
  // "which halt is this?" before the words parse, which is the one test the register
  // applies (`term=glyph._.choice._.md`).
  //
  // ⛔ do NOT strip it to match the bare halt headers beside it.
  //    `rule.prefer.chill-nature-emojis` caps UNCLAIMED prose emphasis and holds no
  //    jurisdiction over a claimed marker. the bare peers are the defect — they are owed
  //    ✋ and 👋 — so consistency here is repaid upward, never by a strip.
  lines.push(`   └─ 💥 halted, guard malfunction`);
  lines.push(
    `      └─ please tell a human this needs to be fixed before you can continue`,
  );
  return lines.join('\n');
};

/**
 * .what = formats escalation message for stderr when malfunction detected
 * .why = provides context for human intervention
 */
const formatRouteDriveMalfunctionEscalate = (input: {
  stone: string;
}): string => {
  return `reviewer or judge malfunctioned on stone ${input.stone}. a human must fix the malfunction before the route can proceed.`;
};

/**
 * .what = formats route.drive output when stone is blocked
 * .why = allows agent to stop gracefully when stone marked as blocked
 */
const formatRouteDriveBlocked = (input: {
  route: string;
  stone: string;
}): string => {
  // render '.' when the route IS the cwd (else `route = ` shows empty), and build
  // the reason via path.join so it never gains a spurious slash-prefix
  const routeRelative = asRouteDisplayPath({ route: input.route });
  const articulationPath = path.join(
    routeRelative,
    'blocker',
    `${input.stone}.md`,
  );
  const lines: string[] = [];
  lines.push(`🦉 where were we?`);
  lines.push('');
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${routeRelative}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);
  lines.push(`   └─ halted, stone marked blocked`);
  lines.push(`      └─ reason: ${articulationPath}`);
  return lines.join('\n');
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
  content: string;
  count: number;
  suggestBlocked: boolean;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🦉 where were we?`);
  lines.push('');

  // tea pause for stuck drivers (same trigger as suggestBlocked)
  if (input.suggestBlocked) {
    const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
    const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
    const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
    lines.push(`🍵 tea first. then, choose your path.`);
    lines.push(`   │`);
    lines.push(`   ├─ you must choose one`);
    lines.push(`   │  ├─ ready for review?`);
    lines.push(`   │  │  └─ ${arrivedCmd}`);
    lines.push(`   │  │`);
    lines.push(`   │  ├─ ready to continue?`);
    lines.push(`   │  │  └─ ${passedCmd}`);
    lines.push(`   │  │`);
    lines.push(`   │  └─ blocked and need help?`);
    lines.push(`   │     └─ ${blockedCmd}`);
    lines.push(`   │`);
    lines.push(`   └─ 🟡 to refuse is not an option.`);
    lines.push(`      work on the stone, or mark your status.`);
    lines.push('');
  }

  // route.drive tree
  lines.push(`🗿 route.drive`);
  lines.push(`   ├─ where do we go?`);
  lines.push(`   │  ├─ route = ${asRouteDisplayPath({ route: input.route })}`);
  lines.push(`   │  └─ stone = ${input.stone}`);
  lines.push(`   │`);

  // command prompt with both options
  const arrivedCmd = `rhx route.stone.set --stone ${input.stone} --as arrived`;
  const passedCmd = `rhx route.stone.set --stone ${input.stone} --as passed`;
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
    const blockedCmd = `rhx route.stone.set --stone ${input.stone} --as blocked`;
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
