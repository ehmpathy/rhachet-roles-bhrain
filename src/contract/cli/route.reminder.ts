import { BadRequestError } from 'helpful-errors';

import { getInvocationArgs } from '@src/domain.operations/cli/getInvocationArgs';
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';
import { asRouteReminderCloneAddr } from '@src/domain.operations/route/reminder/asRouteReminderCloneAddr';
import { asRouteReminderIntervalMs } from '@src/domain.operations/route/reminder/asRouteReminderIntervalMs';
import { asRouteReminderProcessFaultError } from '@src/domain.operations/route/reminder/asRouteReminderProcessFaultError';
import { asRouteReminderSayTimeoutMs } from '@src/domain.operations/route/reminder/asRouteReminderSayTimeoutMs';
import { DEFAULT_REMINDER_INTERVAL_MS } from '@src/domain.operations/route/reminder/DEFAULT_REMINDER_INTERVAL_MS';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from '@src/domain.operations/route/reminder/DEFAULT_REMINDER_SAY_TIMEOUT_MS';
import { delRouteReminder } from '@src/domain.operations/route/reminder/delRouteReminder';
import { delRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/delRouteReminderCrashBreaker';
import { delRouteReminderPidHandleIfPid } from '@src/domain.operations/route/reminder/delRouteReminderPidHandleIfPid';
import { genRouteReminder } from '@src/domain.operations/route/reminder/genRouteReminder';
import { getRouteDriverCloneAddr } from '@src/domain.operations/route/reminder/getRouteDriverCloneAddr';
import { getRouteReminder } from '@src/domain.operations/route/reminder/getRouteReminder';
import { getRouteReminderCrashBreaker } from '@src/domain.operations/route/reminder/getRouteReminderCrashBreaker';
import { getRouteReminderDriveActivity } from '@src/domain.operations/route/reminder/getRouteReminderDriveActivity';
import { getRouteReminderLogPath } from '@src/domain.operations/route/reminder/getRouteReminderLogPath';
import { getRouteReminderLogPresence } from '@src/domain.operations/route/reminder/getRouteReminderLogPresence';
import { MAX_ROUTE_REMINDER_CRASHES } from '@src/domain.operations/route/reminder/MAX_ROUTE_REMINDER_CRASHES';
import { ROUTE_REMINDER_FLAGS } from '@src/domain.operations/route/reminder/ROUTE_REMINDER_FLAGS';
import { runRouteReminderDaemon } from '@src/domain.operations/route/reminder/runRouteReminderDaemon';
import { sayToClone } from '@src/domain.operations/route/reminder/sayToClone';
import { spawnRouteReminderDaemon } from '@src/domain.operations/route/reminder/spawnRouteReminderDaemon';

/**
 * .what = the shell surface for RouteReminder — register / detect / deregister + the daemon loop
 * .why = the wish's headline ask is "manage whether the reminder is live via shell or typescript".
 *        this is that shell surface: `route.reminder.gen|get|del` manage the reminder from a
 *        terminal, and `route.reminder.daemon` is the detached process a register spawns. it is an
 *        ISOLATED cli subpath (no brain / review imports) so it loads fast
 *        (rule.require.isolated-cli-subpath-exports).
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
    // typo'd flag (a dropped `--`) or a bogus positional. do NOT silently drop it (that vanishes the
    // slip into a no-op, the exact failhide the repo's own rules forbid) — fail loud, name the fix
    // (rule.forbid.failhide / rule.require.failfast / rule.require.errors-name-the-fix).
    if (!keyOpen)
      throw new BadRequestError(
        `unexpected argument "${token}" — the reminder commands take only --flag value pairs`,
        {
          hint: 'did you drop a "--" prefix? e.g. --route .behavior/my-feature',
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
 * .why = an absent --route / --clone-addr is a caller mistake; the error states the flag to add
 *        (rule.require.errors-name-the-fix), and BadRequestError carries exit 2 (a constraint).
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
 * .what = resolves --route, defaults to the branch's bound route when absent
 * .why = a human who already bound this route to the branch (rhx route.bind.set) should not have
 *        to repeat the exact path on every reminder command — the same "explicit, else bound"
 *        default route.drive's own hook already leans on (getRouteBindByBranch). an explicit
 *        --route still overrides, for cross-route inspection.
 */
const getRouteArg = async (
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
 * .what = resolves --clone-addr, defaults to THIS session's own address when absent
 * .why = an enrolled driver already knows its own address (getRouteDriverCloneAddr reads
 *        RHACHET_CLONE_SERIAL) — the same value the auto-wire (syncRouteReminderForDrive) already
 *        reads to manage ITS OWN reminder. an explicit --clone-addr still overrides, for a human
 *        who inspects a DIFFERENT session's reminder from outside that session.
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
    hint: `e.g. --${ROUTE_REMINDER_FLAGS.cloneAddr} @:driver-1 (auto-resolves inside an enrolled clone)`,
  });
};

/**
 * .what = runs a reminder operation and maps a process-probe fault to an error that states the fix
 * .why = the register/detect/deregister operations all probe a pid's liveness (isProcessAlive /
 *        stopProcess), which rethrow the EPERM pid-reuse residual rather than swallow it
 *        (rule.forbid.failhide). shown raw to a human that is a bare `kill EPERM` stack trace with no
 *        remedy; this one wrapper maps it to a BadRequestError that states the stale-handle fix, so
 *        every human entrypoint gets the same named-fix error, not three copied catches
 *        (rule.require.errors-name-the-fix, rule.prefer.decomposable-architecture). a `with*` HOF
 *        keeps the map a one-line seam at each call site (rule.require.hook-wrapper-pattern).
 */
const withRouteReminderProcessFaultMap = async <T>(
  input: { route: string; cloneAddr: string },
  op: () => Promise<T>,
): Promise<T> => {
  try {
    return await op();
  } catch (error: unknown) {
    throw asRouteReminderProcessFaultError({
      error,
      route: input.route,
      cloneAddr: input.cloneAddr,
    });
  }
};

/**
 * .what = the stdout writer every route.reminder command routes through, instead of a bare
 *         console.log call
 * .why = an integration test that captures cli stdout must inject a real collector function, never
 *        reassign the console.log global (rule.forbid.integration.mocks) — the same seam
 *        surfaceRouteReminderFault/spawnRouteReminderDaemon already give their stderr writer. every
 *        command below defaults this to console.log in production, so the shell behavior is
 *        unchanged; only a test supplies its own array-collector.
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
  // entry so the three columns line up no matter how long a flag name grows (a hand-spaced block
  // drifts out of alignment the moment a longer flag like --say-timeout-ms lands — the exact
  // treestruct-output blemish; padEnd holds the columns aligned). defaults derive from the
  // constants so the printed default never drifts from the real one (rule.require.treestruct-output).
  const flagRows = [
    {
      name: `--${ROUTE_REMINDER_FLAGS.route} <path>`,
      desc: 'the route dir',
      dflt: '(default: the bound route)',
    },
    {
      name: `--${ROUTE_REMINDER_FLAGS.cloneAddr} <addr>`,
      desc: 'the driver clone addr',
      dflt: '(default: this session addr)',
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
      'route.reminder — manage a driver session RouteReminder daemon',
      '',
      'commands:',
      '  gen     register (findsert) the daemon; spawns one if absent',
      '  get     report whether the reminder is live, and its pid',
      '  del     deregister — stop the daemon and clear the handle',
      '  daemon  the detached loop a register spawns (not called by hand)',
      '',
      'flags:',
      ...flagLines,
      '',
      'note:',
      '  gen/get/del derive both flags on their own when run inside a bound,',
      '  enrolled session: --route defaults to the branch bound route (rhx',
      '  route.bind.set), --clone-addr defaults to this session own addr',
      '  (RHACHET_CLONE_SERIAL). pass either flag to override — e.g. to inspect a',
      '  DIFFERENT route or session.',
      '',
      '  --clone-addr takes the SAME "@:"-prefixed address `rhx clone say` and',
      '  `rhx clone whoami` use — e.g. `@:<serial>` (the serial from',
      '  $RHACHET_CLONE_SERIAL / `rhx clone whoami`), or `@:<slug>` for a named',
      '  clone. one address form everywhere — no bare-serial variant is accepted.',
      '',
      'example:',
      '  route.reminder.get                       (inside a bound, enrolled session)',
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
 *        already-tested `runRouteReminderDaemon` loop. on exit it prints WHY it died
 *        (`route-not-live` / `route-complete` / `session-dead`) + how many ticks it ran — the observability seam:
 *        this stdout is redirected to the per-session daemon log, so a human reads the exit cause.
 */
export const routeReminderDaemon = async (context?: {
  say?: RouteReminderSay;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  const route = getRequiredArg({
    options,
    key: ROUTE_REMINDER_FLAGS.route,
    example: '.behavior/my-feature',
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

  // run the loop; it self-exits on a dead route or dead session. a genuine fault throws out
  // (crash-loud, by design) so the host sees the crash rather than a silent busy-loop.
  const { exitReason, ticks } = await runRouteReminderDaemon(
    { route, cloneAddr, intervalMs, sayTimeoutMs },
    { sayToClone, sleep: sleepMs },
  );

  // the observability line: the exit cause + tick count, into the redirected daemon log
  say(
    `route.reminder.daemon exited: reason=${exitReason} ticks=${ticks} route=${route} clone=${cloneAddr}`,
  );
};

/**
 * .what = REGISTER — findsert the daemon for a driver session (spawns a detached daemon if absent)
 * .why = the shell "turn the reminder on" command. idempotent: a live daemon is returned, never
 *        duplicated (genRouteReminder findsert). named `gen` to match the internal findsert verb
 *        (rule.require.get-set-gen-verbs — `set` overwrites; `gen` preserves an extant live daemon).
 *
 * .note = `context` injects ONLY the spawn host — the one genuinely external OS boundary (a detached
 *         `child_process.spawn`), so a cli-boundary test drives this with a fake spawn and no real
 *         detached child (rule.require.dependency-injection). crash-on-arrival detection is NOT done
 *         here — genRouteReminder OWNS its findsert postcondition (probe + reconcile) and returns
 *         `alive`; this command only reads that verdict and surfaces it (rule.require.directional-deps).
 */
export const routeReminderGen = async (context?: {
  spawnDaemon?: (input: {
    route: string;
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

  const spawnDaemon =
    context?.spawnDaemon ?? ((i) => spawnRouteReminderDaemon(i));

  // a manual gen is the human's explicit RE-ARM of the auto-respawn circuit breaker: if a prior
  // spawn-storm tripped the crash-breaker cutoff (which halts the drive's auto-respawn), a hand-run
  // gen clears the consecutive crash count so auto-respawn resumes on the next drive. reset it here,
  // before the spawn, so even a gen that itself crashes-on-arrival starts from a clean streak
  // (rule.forbid.behavior-hazards — the human took an explicit action, so the latch releases).
  await delRouteReminderCrashBreaker({ route, cloneAddr });

  // genRouteReminder probes the extant handle's pid for its findsert; map an EPERM pid-reuse fault
  // to a named-fix error rather than leak a raw `kill EPERM` to the human.
  const { pid, created, alive } = await withRouteReminderProcessFaultMap(
    { route, cloneAddr },
    () =>
      genRouteReminder(
        { route, cloneAddr, intervalMs, sayTimeoutMs },
        { spawnDaemon },
      ),
  );

  // an already-live daemon (findsert hit) needs no probe — it was live when getRouteReminder read it
  if (!created) {
    say(`reminder already live — daemon pid ${pid} (no duplicate spawned)`);
    return;
  }

  // a freshly spawned daemon's fate is DETERMINED by the route's activity, not the raw liveness
  // probe: on a NOT-active route (blocked / rewound / exhausted / malfunction / completed) the daemon
  // self-exits on tick 1 BY DESIGN — a dead pid there is EXPECTED, not a crash. so read the route's
  // activity — the SAME composite the daemon itself exits on (getRouteReminderDriveActivity) — first,
  // to interpret genRouteReminder's `alive` correctly (rule.forbid.surprises).
  const activity = await getRouteReminderDriveActivity({ route });

  // a NOT-active route → the daemon self-exits on arrival by design. reconcile the just-claimed
  // handle (idempotent — genRouteReminder already reconciled it if its own probe caught the pid
  // dead; this covers the race where the probe caught it still alive) and report the honest reason.
  if (!activity.active) {
    await delRouteReminderPidHandleIfPid({ route, cloneAddr, pid });
    say(
      `reminder daemon spawned (pid ${pid}) but the route is not a live drive (${activity.reason}) — it self-exits on arrival; daemon log: ${getRouteReminderLogPath(
        { route, cloneAddr },
      )}`,
    );
    return;
  }

  // an ACTIVE route → the daemon should stay up, so genRouteReminder's crash-on-arrival probe was
  // RACE-FREE (an active route has no self-exit for the probe to race). genRouteReminder OWNS that
  // detection + the dead-handle reconcile now, so we only READ its `alive` verdict and SURFACE it —
  // no re-derived probe, no duplicated reconcile (rule.require.directional-deps).
  if (alive) {
    say(`reminder registered — daemon spawned and live (pid ${pid})`);
    return;
  }

  // crash on arrival on an ACTIVE route → genRouteReminder already reconciled the handle; report it
  say(
    `reminder daemon spawned (pid ${pid}) but exited on arrival — the spawn crashed before its first tick; daemon log: ${getRouteReminderLogPath(
      { route, cloneAddr },
    )}`,
  );
};

/**
 * .what = DETECT — report whether a driver session's reminder is live, and its pid
 * .why = the shell "is it live?" read the wish asks for. a dead/stale/absent handle reads as
 *        "not live" (getRouteReminder), so this never reports a phantom live daemon.
 */
export const routeReminderGet = async (context?: {
  say?: RouteReminderSay;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  const route = await getRouteArg(options);
  const cloneAddr = getCloneAddrArg(options);

  // a live daemon needs no more — report its pid and return. the liveness probe can hit the EPERM
  // pid-reuse residual; map it to a named-fix error, never a raw `kill EPERM` stack trace.
  const found = await withRouteReminderProcessFaultMap(
    { route, cloneAddr },
    () => getRouteReminder({ route, cloneAddr }),
  );
  if (found) {
    say(`reminder is live — daemon pid ${found.pid}`);
    return;
  }

  // NOT live, and the auto-respawn CIRCUIT BREAKER is TRIPPED → the drive stopped re-spawning this
  // session's daemon after MAX_ROUTE_REMINDER_CRASHES consecutive crash-on-arrivals (a systematically
  // broken spawn). this is a DISTINCT operator state from "went quiet": waiting it out will NOT revive
  // it — the fix is to repair the spawn, then re-arm with `route.reminder.gen`. report it first and
  // point at BOTH the crash history AND the re-arm command (rule.require.errors-name-the-fix), so the
  // trip is not collapsed into the generic "gone quiet" message.
  const breaker = await getRouteReminderCrashBreaker({ route, cloneAddr });
  if (breaker.count > MAX_ROUTE_REMINDER_CRASHES) {
    say(
      `reminder is not live — auto-respawn is CIRCUIT-BROKEN after ${breaker.count} consecutive crash-on-arrivals (the spawn keeps dying on boot); the drive will NOT re-spawn it until you re-arm. fix: repair the spawn, then run route.reminder.gen. crash history: ${getRouteReminderLogPath(
        { route, cloneAddr },
      )}`,
    );
    return;
  }

  // NOT live — but "not live" alone is ambiguous, and this is THE diagnostic tool. discriminate the
  // two operator situations by the per-session log's presence: the daemon opens the log the moment it
  // spawns, and only the pid handle is reaped on self-exit, so the log PERSISTS past a death. a log
  // that exists means a daemon WAS registered and went quiet (read the log for WHY); an absent log
  // means one was NEVER registered (start one). one message for two states misdirects the operator —
  // this names the actual next move (rule.require.status-feedback / rule.require.errors-name-the-fix).
  const { present: everRegistered } = await getRouteReminderLogPresence({
    route,
    cloneAddr,
  });
  say(
    everRegistered
      ? `reminder is not live — a daemon was registered but has gone quiet (self-exited or crashed); read why: ${getRouteReminderLogPath(
          { route, cloneAddr },
        )}`
      : `reminder is not live — no daemon was ever registered for this session; register one with route.reminder.gen (or it auto-registers on the next route.drive while the route is a live drive)`,
  );
};

/**
 * .what = DEREGISTER — stop a driver session's daemon and clear its handle (idempotent)
 * .why = the shell "turn the reminder off" command. safe to re-run: an already-absent reminder
 *        is a no-op (delRouteReminder).
 */
export const routeReminderDel = async (context?: {
  say?: RouteReminderSay;
}): Promise<void> => {
  const say = context?.say ?? console.log;
  const options = parseArgs();
  if (printHelpIfAsked(options, say)) return;
  const route = await getRouteArg(options);
  const cloneAddr = getCloneAddrArg(options);

  // deregister signals the live pid (stopProcess); map an EPERM pid-reuse fault to a named-fix
  // error rather than leak a raw `kill EPERM` to the human.
  const { stopped } = await withRouteReminderProcessFaultMap(
    { route, cloneAddr },
    () => delRouteReminder({ route, cloneAddr }),
  );
  say(
    stopped
      ? 'reminder deregistered — live daemon stopped, handle cleared'
      : 'reminder was not live (no live daemon to stop)',
  );
};
