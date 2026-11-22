import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { asRouteReminderCloneAddr } from '@src/domain.operations/route/reminder/asRouteReminderCloneAddr';
import { asRouteReminderFocusLabel } from '@src/domain.operations/route/reminder/asRouteReminderFocusLabel';
import { asRouteReminderHaltLabel } from '@src/domain.operations/route/reminder/asRouteReminderHaltLabel';
import { asRouteReminderIntervalMs } from '@src/domain.operations/route/reminder/asRouteReminderIntervalMs';
import { asRouteReminderLegacyReapLines } from '@src/domain.operations/route/reminder/asRouteReminderLegacyReapLines';
import { asRouteReminderProcessFaultError } from '@src/domain.operations/route/reminder/asRouteReminderProcessFaultError';
import { asRouteReminderSayTimeoutMs } from '@src/domain.operations/route/reminder/asRouteReminderSayTimeoutMs';
import { DEFAULT_REMINDER_INTERVAL_MS } from '@src/domain.operations/route/reminder/DEFAULT_REMINDER_INTERVAL_MS';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from '@src/domain.operations/route/reminder/DEFAULT_REMINDER_SAY_TIMEOUT_MS';
import { delRouteReminder } from '@src/domain.operations/route/reminder/delRouteReminder';
import { delRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/delRouteReminderCrashBreaker';
import {
  delRouteReminderLegacyHandles,
  type RouteReminderLegacyReapOutcome,
} from '@src/domain.operations/route/reminder/delRouteReminderLegacyHandles';
import { genRouteReminder } from '@src/domain.operations/route/reminder/genRouteReminder';
import { getRouteDriverCloneAddr } from '@src/domain.operations/route/reminder/getRouteDriverCloneAddr';
import { getRouteReminder } from '@src/domain.operations/route/reminder/getRouteReminder';
import { getRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/getRouteReminderCrashBreaker';
import { getRouteReminderDriveActivity } from '@src/domain.operations/route/reminder/getRouteReminderDriveActivity';
import { getRouteReminderFocus } from '@src/domain.operations/route/reminder/getRouteReminderFocus';
import { getRouteReminderLogPath } from '@src/domain.operations/route/reminder/getRouteReminderLogPath';
import { getRouteReminderLogPresence } from '@src/domain.operations/route/reminder/getRouteReminderLogPresence';
import { getRouteReminderRepoRoot } from '@src/domain.operations/route/reminder/getRouteReminderRepoRoot';
import { MAX_ROUTE_REMINDER_CRASHES } from '@src/domain.operations/route/reminder/MAX_ROUTE_REMINDER_CRASHES';
import { ROUTE_REMINDER_FLAGS } from '@src/domain.operations/route/reminder/ROUTE_REMINDER_FLAGS';
import { runRouteReminderDaemon } from '@src/domain.operations/route/reminder/runRouteReminderDaemon';
import { sayToClone } from '@src/domain.operations/route/reminder/sayToClone';
import { setRouteReminderFocus } from '@src/domain.operations/route/reminder/setRouteReminderFocus';
import { spawnRouteReminderDaemon } from '@src/domain.operations/route/reminder/spawnRouteReminderDaemon';
import { withEnoentAsNull } from '@src/domain.operations/route/withEnoentAsNull';

import { emitRouteReminderFault } from './emitRouteReminderFault';

/**
 * .what = the shell surface for RouteReminder — register / detect / deregister + the daemon loop
 * .why = the wish's headline ask is "manage whether the reminder is live via shell or typescript".
 *        this is that shell surface: `route.reminder.gen|get|del` manage the clone's one reminder
 *        from a terminal, and `route.reminder.daemon` is the detached process a register spawns. it
 *        is an ISOLATED cli subpath (no brain / review imports) so it loads fast
 *        (rule.require.isolated-cli-subpath-exports).
 *
 * .note = one file, several exports, by design: a cli subpath is one package entry, and each verb
 *         entrypoint plus the `routeReminderCli` dispatcher is a surface of that one entry. the
 *         subpath is the unit of isolation (rule.require.isolated-cli-subpath-exports), so a split
 *         per verb would add four entries for no load gain. every domain step stays one op per
 *         file under `domain.operations/route/reminder/`
 */

/**
 * .what = parses `--key value` / `--flag` pairs from the invocation args
 * .why = a light, self-contained parser so this cli subpath pulls in no heavy shared cli module.
 */
const parseArgs = (): Record<string, string | undefined> => {
  const tokens = getInvocationArgs(process.argv);

  // fold the tokens into { key: value } pairs. a `--flag` opens a key; the next non-flag token is
  // its value, else the flag stands as a bare boolean `'true'`. a fold with one open-key accumulator
  // reads plainer than a positional `i++` walk with an `args[i+1]` lookahead
  // (rule.forbid.inline-decode-friction) — no index arithmetic to mentally simulate.
  const options: Record<string, string | undefined> = {};
  let keyOpen: string | null = null;
  for (const token of tokens) {
    // a new flag opens a key. any prior open key never got a value, so it was a bare boolean.
    if (token.startsWith('--')) {
      if (keyOpen) options[keyOpen] = 'true';
      const body = token.slice(2);
      // support the `--key=value` idiom too, split on the FIRST '=' (so a value may itself hold
      // '='). without this branch, `--interval-ms=60000` folds to a bogus key `interval-ms=60000`
      // and the REAL `interval-ms` silently falls to its default — a failhide the repo's own rules
      // forbid: a common CLI idiom must not degrade to a silently-wrong default (rule.forbid.failhide).
      const eq = body.indexOf('=');
      if (eq !== -1) {
        options[body.slice(0, eq)] = body.slice(eq + 1);
        keyOpen = null;
        continue;
      }
      keyOpen = body;
      continue;
    }

    // a value token closes the open key. a stray value with NO open key is a caller mistake — a
    // typo'd flag (a dropped `--`) or a bogus positional. do NOT silently drop it — fail loud, name
    // the fix (rule.forbid.failhide / rule.require.failfast / rule.require.errors-name-the-fix).
    if (!keyOpen)
      throw new BadRequestError(
        `unexpected argument "${token}" — the reminder commands take only --flag value pairs`,
        {
          hint: 'did you drop a "--" prefix? e.g. --clone-addr @:driver-1',
          token,
        },
      );
    options[keyOpen] = token;
    keyOpen = null;
  }

  // a final flag with no value closes as a bare boolean
  if (keyOpen) options[keyOpen] = 'true';
  return options;
};

/**
 * .what = reads a required arg or throws a constraint error that names the fix
 * .why = an absent --repo-root / --clone-addr is a caller mistake; the error states the flag to add
 *        (rule.require.errors-name-the-fix); BadRequestError marks it a caller-must-fix constraint.
 *
 * .note = the throw is mapped to exit 2 at the shell seam (routeReminderCli), not here: an
 *         in-process caller (the integration tests) must get the throw
 */
const getRequiredArg = (input: {
  options: Record<string, string | undefined>;
  key: string;
  example: string;
}): string => {
  const value = input.options[input.key];
  if (!value || value === 'true')
    throw new BadRequestError(`--${input.key} is required`, {
      hint: `e.g. --${input.key} ${input.example}`,
    });
  return value;
};

/**
 * .what = reads gen's --route, defaults to the branch's bound route when absent
 * .why = a human who already bound this route to the branch (rhx route.bind.set) should not have
 *        to repeat the exact path — the same "explicit, else bound" default route.drive leans on.
 *        gen points the clone's reminder at this route (the focus), then findserts the daemon.
 */
const getRouteArgDeclared = async (
  options: Record<string, string | undefined>,
): Promise<string> => {
  const explicit = options[ROUTE_REMINDER_FLAGS.route];
  if (explicit && explicit !== 'true') return explicit;
  const bind = await getRouteBindByBranch({ branch: null });
  if (bind) return bind.route;
  throw new BadRequestError(`--${ROUTE_REMINDER_FLAGS.route} is required`, {
    hint: `e.g. --${ROUTE_REMINDER_FLAGS.route} .behavior/my-feature (or bind one first: rhx route.bind.set --route <path>)`,
  });
};

/**
 * .what = reads gen's route (explicit, else bound) and refuses one that is not a dir
 * .why = a focus on an absent route reads "not live" forever: gen would print a calm "not spawned"
 *        line for a typo, a silent dead end. the refusal names the path (rule.require.errors-name-the-fix)
 */
const getRouteArg = async (
  options: Record<string, string | undefined>,
): Promise<string> => {
  const route = await getRouteArgDeclared(options);
  const found = await withEnoentAsNull(() => fs.stat(route));
  if (!found?.isDirectory())
    throw new BadRequestError(
      `the route "${route}" is not a dir — the reminder cannot focus on it`,
      {
        hint: `pass the path of a route dir, e.g. --${ROUTE_REMINDER_FLAGS.route} .behavior/my-feature`,
        route,
      },
    );
  return route;
};

/**
 * .what = refuses --route and --repo-root on a verb that reads or reaps the clone's one reminder
 * .why = get and del anchor on the cwd's worktree and read no route. a flag that is accepted and
 *        ignored would let a human believe they read or stopped another route's or worktree's
 *        reminder; a refusal that names the fix tells the truth (rule.forbid.surprises,
 *        rule.require.errors-name-the-fix)
 */
const refuseScopeArgs = (input: {
  options: Record<string, string | undefined>;
  verb: 'get' | 'del';
}): void => {
  if (input.options[ROUTE_REMINDER_FLAGS.route] !== undefined)
    throw new BadRequestError(
      `route.reminder.${input.verb} takes no --${ROUTE_REMINDER_FLAGS.route} — the reminder is one per clone, and follows the route the clone drives`,
      {
        hint: `drop --${ROUTE_REMINDER_FLAGS.route}; to reach another clone's reminder, pass --${ROUTE_REMINDER_FLAGS.cloneAddr} @:<serial>`,
      },
    );
  if (input.options[ROUTE_REMINDER_FLAGS.repoRoot] !== undefined)
    throw new BadRequestError(
      `route.reminder.${input.verb} takes no --${ROUTE_REMINDER_FLAGS.repoRoot} — it acts on the reminder of the worktree it runs in`,
      {
        hint: `drop --${ROUTE_REMINDER_FLAGS.repoRoot}; to reach another worktree's reminder, run route.reminder.${input.verb} from that worktree`,
      },
    );
};

/**
 * .what = reads --clone-addr, defaults to THIS session's own address when absent
 * .why = an enrolled driver already knows its own address (getRouteDriverCloneAddr reads
 *        RHACHET_CLONE_SERIAL) — the same value the auto-wire reads to manage ITS OWN reminder. an
 *        explicit --clone-addr still overrides, for a human who inspects a DIFFERENT session.
 */
const getCloneAddrArg = (
  options: Record<string, string | undefined>,
): string => {
  const explicit = options[ROUTE_REMINDER_FLAGS.cloneAddr];
  if (explicit && explicit !== 'true')
    return asRouteReminderCloneAddr({ raw: explicit });
  const driver = getRouteDriverCloneAddr();
  if (driver) return driver.cloneAddr;
  throw new BadRequestError(`--${ROUTE_REMINDER_FLAGS.cloneAddr} is required`, {
    hint: `e.g. --${ROUTE_REMINDER_FLAGS.cloneAddr} @:driver-1 (auto-derives inside an enrolled clone)`,
  });
};

/**
 * .what = runs a reminder operation and maps a process-probe fault to an error that states the fix
 * .why = the register/detect/deregister operations all probe a pid's liveness, which rethrow the
 *        EPERM pid-reuse residual rather than swallow it (rule.forbid.failhide). this one wrapper
 *        maps it to a BadRequestError that states the stale-handle fix, so every human entrypoint
 *        gets the same named-fix error (rule.require.errors-name-the-fix,
 *        rule.require.hook-wrapper-pattern).
 */
const withRouteReminderProcessFaultMap = async <T>(
  input: { repoRoot: string; cloneAddr: string },
  op: () => Promise<T>,
): Promise<T> => {
  try {
    return await op();
  } catch (error: unknown) {
    throw asRouteReminderProcessFaultError({
      error,
      repoRoot: input.repoRoot,
      cloneAddr: input.cloneAddr,
    });
  }
};

/**
 * .what = the stdout writer every route.reminder command routes through, instead of a bare
 *         console.log call
 * .why = an integration test that captures cli stdout must inject a real collector function, never
 *        reassign the console.log global (rule.forbid.integration.mocks).
 */
type RouteReminderSay = (line: string) => void;

/**
 * .what = prints the shared usage block for the route.reminder commands, returns true when help was asked
 * .why = a human who types `--help` must get the flags, not an absent-arg error
 *        (rule.require.help-on-demand). one shared block keeps every command's help in sync.
 */
const printHelpIfAsked = (
  options: Record<string, string | undefined>,
  say: RouteReminderSay,
): boolean => {
  if (!options.help && !options.h) return false;

  // build the flag rows from { name, desc, default } tuples, then pad each column to its widest
  // entry so the three columns line up no matter how long a flag name grows. defaults derive from
  // the constants so the printed default never drifts from the real one.
  const flagRows = [
    {
      name: `--${ROUTE_REMINDER_FLAGS.route} <path>`,
      desc: 'gen only: the route to focus',
      dflt: '(default: the bound route)',
    },
    {
      name: `--${ROUTE_REMINDER_FLAGS.cloneAddr} <addr>`,
      desc: 'the driver clone addr',
      dflt: '(default: this clone addr)',
    },
    {
      name: `--${ROUTE_REMINDER_FLAGS.repoRoot} <path>`,
      desc: 'daemon only: the clone anchor',
      dflt: '(required; the register passes it)',
    },
    {
      name: `--${ROUTE_REMINDER_FLAGS.intervalMs} <n>`,
      desc: 'cadence in ms',
      dflt: `(default: ${DEFAULT_REMINDER_INTERVAL_MS} = ${Math.round(DEFAULT_REMINDER_INTERVAL_MS / 60_000)}m)`,
    },
    {
      name: `--${ROUTE_REMINDER_FLAGS.sayTimeoutMs} <n>`,
      desc: 'inject-call bound in ms',
      dflt: `(default: ${DEFAULT_REMINDER_SAY_TIMEOUT_MS} = ${Math.round(DEFAULT_REMINDER_SAY_TIMEOUT_MS / 1_000)}s)`,
    },
  ];
  const nameWidth = Math.max(...flagRows.map((row) => row.name.length));
  const descWidth = Math.max(...flagRows.map((row) => row.desc.length));
  const flagLines = flagRows.map(
    (row) =>
      `  ${row.name.padEnd(nameWidth)}   ${row.desc.padEnd(descWidth)}  ${row.dflt}`,
  );

  say(
    [
      'route.reminder — manage a driver clone RouteReminder daemon (one per clone)',
      '',
      'commands:',
      '  gen     focus the reminder on a route, and register (findsert) the daemon',
      '  get     report whether the reminder is live, its pid, and its focus route',
      '  del     deregister — stop the daemon and clear the handle',
      '  daemon  the detached loop a register spawns (not called by hand)',
      '',
      'flags:',
      ...flagLines,
      '',
      'note:',
      '  one clone holds one reminder, whatever routes it drives. the reminder',
      '  nudges about its focus: the live route the clone drove last (route.drive',
      '  sets it; gen sets it too, except that a route which is not a live drive',
      '  never moves a live daemon off its focus). get and del take no --route.',
      '',
      '  --clone-addr takes the SAME "@:"-prefixed address `rhx clone say` and',
      '  `rhx clone whoami` use — e.g. `@:<serial>` (the serial from',
      '  $RHACHET_CLONE_SERIAL / `rhx clone whoami`), or `@:<slug>` for a named',
      '  clone. one address form everywhere — no bare-serial variant is accepted.',
      '',
      'example:',
      '  route.reminder.get                       (inside an enrolled session)',
      '  route.reminder.gen --route .behavior/my-feature --clone-addr @:driver-1',
    ].join('\n'),
  );
  return true;
};

/**
 * .what = a real wall-clock sleep — the daemon's interval timer boundary
 * .why = the one external timer the daemon loop needs; kept a named boundary so the loop composes
 *        it (rule.forbid.inject-same-repo-domain-ops keeps only genuine boundaries injected).
 */
const sleepMs = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

/**
 * .what = the RouteReminder DAEMON entrypoint — the detached process a register spawns
 * .why = composes the real injection boundary (sayToClone) + the real timer (sleepMs) into the
 *        already-tested `runRouteReminderDaemon` loop. on exit it prints WHY it died and about which
 *        focus route — this stdout is redirected to the clone log, so a human reads the exit cause.
 *
 * .note = `sayToClone` and `sleep` default to the real nudge and the real timer; a cli-boundary test
 *         injects them to reach the exits that follow a landed nudge (`handle-lost`), which a sandbox
 *         cannot reach with no live clone (rule.require.dependency-injection)
 */
export const routeReminderDaemon = async (context?: {
  say?: RouteReminderSay;
  sayToClone?: typeof sayToClone;
  sleep?: (ms: number) => Promise<void>;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  const repoRoot = getRequiredArg({
    options,
    key: ROUTE_REMINDER_FLAGS.repoRoot,
    example: '/path/to/repo',
  });
  const cloneAddr = asRouteReminderCloneAddr({
    raw: getRequiredArg({
      options,
      key: ROUTE_REMINDER_FLAGS.cloneAddr,
      example: '@:driver-1',
    }),
  });
  const intervalMs = asRouteReminderIntervalMs({
    raw: options[ROUTE_REMINDER_FLAGS.intervalMs],
  });
  const sayTimeoutMs = asRouteReminderSayTimeoutMs({
    raw: options[ROUTE_REMINDER_FLAGS.sayTimeoutMs],
  });

  // run the loop; it self-exits on a dead focus route or dead session. a genuine fault throws out
  // (crash-loud, by design) so the host sees the crash rather than a silent busy-loop.
  // the loop owns its handle under this process's pid: it exits once the slot names another, and
  // drops the slot on any exit while it still names this pid
  const { exitReason, route, ticks } = await runRouteReminderDaemon(
    { repoRoot, cloneAddr, pid: process.pid, intervalMs, sayTimeoutMs },
    {
      sayToClone: context?.sayToClone ?? sayToClone,
      sleep: context?.sleep ?? sleepMs,
    },
  );

  // the observability line: the exit cause + tick count + focus, into the redirected clone log. the
  // focus renders in the form get prints (asRouteReminderFocusLabel), so a grep of the log for the
  // route get named finds this line
  const focusLabel = route
    ? asRouteReminderFocusLabel({ repoRoot, route })
    : '(no focus)';
  say(
    `route.reminder.daemon exited: reason=${exitReason} ticks=${ticks} focus=${focusLabel} clone=${cloneAddr}`,
  );
};

/**
 * .what = REGISTER — focus the clone's reminder on a route, then findsert its daemon
 * .why = the shell "turn the reminder on" command. idempotent: a live daemon is returned, never
 *        duplicated (genRouteReminder findsert); the focus moves to this route, so the live daemon
 *        nudges about it from its next tick.
 *
 * .note = `context` injects the spawn host (the one genuinely external OS boundary) and the stdout
 *         writer, so a cli-boundary test drives this with a fake spawn
 *         (rule.require.dependency-injection).
 */
export const routeReminderGen = async (context?: {
  spawnDaemon?: (input: {
    repoRoot: string;
    cloneAddr: string;
    intervalMs: number;
    sayTimeoutMs: number;
  }) => Promise<{ pid: number }>;
  say?: RouteReminderSay;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  const route = await getRouteArg(options);
  const cloneAddr = getCloneAddrArg(options);
  const intervalMs = asRouteReminderIntervalMs({
    raw: options[ROUTE_REMINDER_FLAGS.intervalMs],
  });
  const sayTimeoutMs = asRouteReminderSayTimeoutMs({
    raw: options[ROUTE_REMINDER_FLAGS.sayTimeoutMs],
  });
  const clone = {
    repoRoot: await getRouteReminderRepoRoot({ from: route }),
    cloneAddr,
  };

  const spawnDaemon =
    context?.spawnDaemon ?? ((i) => spawnRouteReminderDaemon(i));

  // a live daemon keeps its focus when this route is not a live drive: a move would make it exit on
  // its next tick and drop the nudges of the route the clone does drive. say so, and change naught
  const activityBefore = await getRouteReminderDriveActivity({ route });
  if (!activityBefore.active) {
    const liveBefore = await withRouteReminderProcessFaultMap(clone, () =>
      getRouteReminder(clone),
    );
    if (liveBefore) {
      const focusKept = await getRouteReminderFocus(clone);
      const focusKeptLabel = focusKept
        ? asRouteReminderFocusLabel({
            repoRoot: clone.repoRoot,
            route: focusKept.route,
          })
        : '(none)';
      say(
        `reminder already live — daemon pid ${liveBefore.pid} keeps its focus ${focusKeptLabel}; ${asRouteReminderFocusLabel({ repoRoot: clone.repoRoot, route })} is not a live drive (${asRouteReminderHaltLabel({ activity: activityBefore })}), so the focus was not moved`,
      );
      return;
    }
  }

  // point the clone's one reminder at this route, so the daemon nudges about it
  await setRouteReminderFocus({ ...clone, route });

  // a manual gen is the human's explicit RE-ARM of the auto-respawn circuit breaker: clear the
  // consecutive crash count so auto-respawn resumes on the next drive (rule.forbid.behavior-hazards)
  await delRouteReminderCrashBreaker(clone);

  // a route that is not a live drive gets no daemon: one would exit on its first tick, and until
  // then it would hold the clone's one slot unowned, so a drive of a live route in that window
  // could spawn a second. the focus stands, so the next drive here that goes live spawns it
  if (!activityBefore.active) {
    say(
      `reminder not spawned — focus ${asRouteReminderFocusLabel({ repoRoot: clone.repoRoot, route })} is not a live drive (${asRouteReminderHaltLabel({ activity: activityBefore })}); the next route.drive of a live route registers it`,
    );
    return;
  }

  // genRouteReminder probes the extant handle's pid for its findsert; map an EPERM pid-reuse fault
  // to a named-fix error rather than leak a raw `kill EPERM` to the human.
  const { pid, created, alive, legacyOutcomes } =
    await withRouteReminderProcessFaultMap(clone, () =>
      genRouteReminder({ ...clone, intervalMs, sayTimeoutMs }, { spawnDaemon }),
    );

  // the outcome line first, then the legacy sweep: a kept handle still nudges beside the new
  // daemon, so its fix must be the last line a human reads, never buried above a success line
  const focusLabel = asRouteReminderFocusLabel({
    repoRoot: clone.repoRoot,
    route,
  });
  say(
    (() => {
      // an already-live daemon (findsert hit) needs no probe — it now nudges about this route
      if (!created)
        return `reminder already live — daemon pid ${pid}, focus ${focusLabel} (no duplicate spawned)`;

      // the route was live at the check, so the crash-on-arrival probe is the verdict. a route that
      // went dead since lets the daemon exit on its first tick, and it drops its own handle on exit
      if (alive)
        return `reminder registered — daemon spawned and live (pid ${pid}), focus ${focusLabel}`;

      // crash on arrival on an ACTIVE route → genRouteReminder already reconciled the handle
      return `reminder daemon spawned (pid ${pid}) but exited on arrival — the spawn crashed before its first tick; daemon log: ${getRouteReminderLogPath(clone)}`;
    })(),
  );

  // the legacy sweep before a spawn reports to the human at the terminal too, as del does: a kept
  // handle names a fix only a human can run (the clone log holds the same lines)
  for (const line of asRouteReminderLegacyReapLines({
    outcomes: legacyOutcomes,
  }))
    say(line);
};

/**
 * .what = DETECT — report whether a clone's reminder is live, its pid, and its focus route
 * .why = the shell "is it live?" read. a dead/stale/absent handle reads as "not live"
 *        (getRouteReminder), so this never reports a phantom live daemon. a reminder that halted
 *        names its focus route and why, read from that route's own state.
 *
 * .note = `cwd` anchors the clone handle (default process.cwd()); injected so a test anchors on a
 *         temp dir with no chdir, the same seam as `say`
 */
export const routeReminderGet = async (context?: {
  say?: RouteReminderSay;
  cwd?: string;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  refuseScopeArgs({ options, verb: 'get' });
  const clone = {
    repoRoot: await getRouteReminderRepoRoot({
      from: context?.cwd ?? process.cwd(),
    }),
    cloneAddr: getCloneAddrArg(options),
  };
  const focus = await getRouteReminderFocus(clone);
  const focusLabel = focus
    ? asRouteReminderFocusLabel({
        repoRoot: clone.repoRoot,
        route: focus.route,
      })
    : null;

  // the focus route's activity: the daemon reads the same composite each tick, so get and the
  // daemon agree on whether the next nudge comes
  const focusActivity = focus
    ? await getRouteReminderDriveActivity({ route: focus.route })
    : null;

  // a live daemon — report its pid and focus. the liveness probe can hit the EPERM pid-reuse
  // residual; map it to a named-fix error, never a raw `kill EPERM` stack trace.
  const found = await withRouteReminderProcessFaultMap(clone, () =>
    getRouteReminder(clone),
  );

  // a live daemon on a halted focus nudges no more: it exits on its next tick. say so, rather
  // than report as live a nudge that is about to stop (rule.forbid.surprises)
  if (found && focusActivity?.active === false) {
    say(
      `reminder is live for now — daemon pid ${found.pid}, focus ${focusLabel} is not a live drive (${asRouteReminderHaltLabel({ activity: focusActivity })}); the daemon exits on its next tick, with no more nudges`,
    );
    return;
  }

  // a live daemon with no focus has no route to nudge about: its next tick exits, same as above
  if (found && !focusLabel) {
    say(
      `reminder is live for now — daemon pid ${found.pid} has no focus route; the daemon exits on its next tick, with no more nudges. focus it with route.reminder.gen --route <route>`,
    );
    return;
  }
  if (found) {
    say(`reminder is live — daemon pid ${found.pid}, focus ${focusLabel}`);
    return;
  }

  // NOT live, and the auto-respawn CIRCUIT BREAKER is TRIPPED → a DISTINCT operator state: a wait
  // will NOT revive it. point at the crash history AND the re-arm (rule.require.errors-name-the-fix)
  const breaker = await getRouteReminderCrashBreaker(clone);
  if (breaker.count > MAX_ROUTE_REMINDER_CRASHES) {
    say(
      `reminder is not live — auto-respawn is circuit-broken after ${breaker.count} consecutive crash-on-arrivals (the spawn dies on each boot); the drive will not re-spawn it until you re-arm. fix: repair the spawn, then run route.reminder.gen. crash history: ${getRouteReminderLogPath(
        clone,
      )}`,
    );
    return;
  }

  // NOT live, and the focus route is not a live drive → the reminder halted with its route, by
  // design. name the route and why; the next drive of a live route registers afresh
  if (focusActivity?.active === false) {
    say(
      `reminder is not live — its focus ${focusLabel} is not a live drive (${asRouteReminderHaltLabel({ activity: focusActivity })}); the next route.drive of a live route registers it`,
    );
    return;
  }

  // NOT live on a live focus (or no focus) — discriminate by the clone log's presence: a log means
  // a daemon WAS registered and went quiet (read why) (rule.require.status-feedback)
  const { present: everRegistered } = await getRouteReminderLogPresence(clone);
  if (everRegistered) {
    say(
      `reminder is not live — a daemon was registered but has gone quiet (self-exited or crashed); read why: ${getRouteReminderLogPath(
        clone,
      )}`,
    );
    return;
  }

  // no log, but a focus on a live route: a daemon was registered here and torn down (a `del`), or
  // never spawned yet. name the focus and how it re-arms, never a false "never registered"
  if (focusLabel) {
    say(
      `reminder is not live — no daemon is registered for this clone; its focus ${focusLabel} is a live drive, so the next route.drive of it registers one (or run route.reminder.gen)`,
    );
    return;
  }
  say(
    `reminder is not live — no daemon is registered for this clone under ${clone.repoRoot}; register one with route.reminder.gen (or the next route.drive of a live route registers one). a clone in another worktree keeps its reminder under that worktree: run get from there`,
  );
};

/**
 * .what = DEREGISTER — stop a clone's daemon and clear its handle (idempotent)
 * .why = the shell "turn the reminder off" command. safe to re-run: an already-absent reminder
 *        is a no-op (delRouteReminder).
 *
 * .note = `cwd` anchors the clone handle (default process.cwd()), the same seam as get
 */
export const routeReminderDel = async (context?: {
  say?: RouteReminderSay;
  cwd?: string;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  refuseScopeArgs({ options, verb: 'del' });
  const clone = {
    repoRoot: await getRouteReminderRepoRoot({
      from: context?.cwd ?? process.cwd(),
    }),
    cloneAddr: getCloneAddrArg(options),
  };

  // reap any pre-upgrade per-route daemon of this clone first; the outcomes go to stdout below
  const { outcomes: legacyOutcomes } =
    await delRouteReminderLegacyHandles(clone);

  // deregister signals the live pid (stopProcess); map an EPERM pid-reuse fault to a named-fix
  // error rather than leak a raw `kill EPERM` to the human.
  const { stopped, torn } = await withRouteReminderProcessFaultMap(clone, () =>
    delRouteReminder(clone),
  );
  say(
    asRouteReminderDelHeadline({
      stopped,
      torn,
      legacyReapedCount: getCountOfLegacyReaped({ outcomes: legacyOutcomes }),
    }),
  );

  // the legacy sweep reports to the human here, never to the clone log: a line there after a
  // deliberate teardown would read to `get` as a daemon that went quiet
  for (const line of asRouteReminderLegacyReapLines({
    outcomes: legacyOutcomes,
  }))
    say(line);
};

/**
 * .what = the count of live legacy daemons a sweep stopped
 * .why = del's headline must say a daemon was stopped when the only live one was a legacy one, and
 *        must not count a stale file (its pid already gone) as a stopped daemon
 */
const getCountOfLegacyReaped = (input: {
  outcomes: RouteReminderLegacyReapOutcome[];
}): number =>
  input.outcomes.filter(
    (outcome) => outcome.kind === 'reaped' && outcome.signalled,
  ).length;

/**
 * .what = del's one headline: a torn handle cleared, a daemon stopped, legacy daemons stopped, or naught
 * .why = on upgrade day the only live daemon may be a legacy one; "was not live" there would tell a
 *        human who just stopped the nudges that naught was live (rule.forbid.surprises)
 */
const asRouteReminderDelHeadline = (input: {
  stopped: boolean;
  torn: { pidPath: string; raw: string } | null;
  legacyReapedCount: number;
}): string => {
  if (input.torn)
    return `reminder handle was torn (it held "${input.torn.raw.trim()}", not a pid) — cleared ${input.torn.pidPath}; the next live drive registers afresh`;
  if (input.stopped)
    return 'reminder deregistered — live daemon stopped, handle cleared';
  if (input.legacyReapedCount > 0)
    return `reminder deregistered — ${input.legacyReapedCount} legacy daemon(s) stopped (no clone daemon was live)`;
  return 'reminder was not live (no live daemon to stop)';
};

/**
 * .what = the shell entrypoint for a reminder verb: runs it, and maps a fault to its exit
 * .why = the four `route.reminder.*.sh` skills call this, so each refusal exits 2 behind a
 *        `✋ ConstraintError:` header, the same as every other `rhx route.*` refusal. the verb
 *        entrypoints above still throw, so an in-process caller gets the error itself
 */
export const routeReminderCli = async (input: {
  verb: 'gen' | 'get' | 'del' | 'daemon';
}): Promise<void> => {
  const run = {
    gen: routeReminderGen,
    get: routeReminderGet,
    del: routeReminderDel,
    daemon: routeReminderDaemon,
  }[input.verb];
  await run().catch((error: unknown) => emitRouteReminderFault({ error }));
};
