# howto: the RouteReminder

## .what
guide for the **RouteReminder** — a scheduled prose nudge ("you can do it! drive on, fulcrum,
and converge") that keeps a driver session in motion when the api hiccups or the model idles.
the reminder is **wired automatically** by `route.drive`; this runbook explains that auto path,
plus the three manual skills for inspection or override.

## .why
a long drive can stall — a transient anthropic outage errors a turn, or the model ends a turn
with no re-drive and idles. the reminder pokes the session back into motion every ~20 minutes.
its hard guarantee: the moment the route blocks, halts, or the session dies, the daemon reads
that state from disk and **exits itself** — no dead route ever gets nudged (the wish's
no-infiniloop requirement).

## the automatic path (the default) 🦉

you do **not** turn the reminder on by hand. `route.drive` runs as an onBoot/onStop hook inside
your driver clone, continuously while a route is inflight — so every drive keeps the reminder in
sync with the route's live state:

- **one per clone** — a clone holds one reminder, whatever routes it drives or stacks. each drive
  points the reminder's **focus** at its route; the daemon reads the focus each tick and nudges
  about that route alone. a clone that drives route A, then route B, keeps one daemon, and its
  next nudge is about B.
- **auto-start** — while the route is a **live drive**, each drive **findserts** the reminder (a
  live daemon is returned, never duplicated). the first drive after the route goes live spawns it.
- **auto-stop** — the moment the focus route is **dead** (blocked / rewound / exhausted /
  malfunction), the next drive of it **reaps** the reminder. a drive moves the focus to the route
  it drives first, so a drive of any dead route reaps it, a `route.drive --route <other>` peek
  included; only a drive that loses a race to a newer focus leaves the reminder be. the daemon
  also self-exits on its own next tick once its focus is dead — the two paths converge, so a dead
  route is never nudged.
- **owns its slot** — the daemon drops its own handle on exit, and exits if the handle stops to
  name its pid (e.g. `.agent/.cache` was wiped), so no orphan nudges beside a fresh daemon. the
  handle is published whole (a temp file, then a link), so a crash mid-write leaves none torn; a
  handle torn by hand makes `get` and `gen` refuse, and `rhx route.reminder.del` clears it.
- **your clone address** is read in-process from the enroller-injected `RHACHET_CLONE_SERIAL`, so
  a plain (non-enrolled) `claude` session simply skips the reminder — no setup, no error.

so on a normal enrolled drive there is no command to run — the reminder rides the drive. the
manual skills below are for inspection (`get`) or a deliberate override (`gen` / `del`).

---

## the road ahead 🦉

> a still session is not a stuck one — sometimes it only waits for a nudge.
> the reminder is a lit lantern left by the trail: it re-lights the way each time
> the traveler pauses, and it snuffs itself the moment the trail ends.

---

## manual override: turn it on

the auto path already findserts the reminder on every drive, so you rarely need this. reach for
`gen` only to force a reminder outside the drive loop — e.g. a manual test, or a session where you
want the reminder before your first drive.

```
rhx route.reminder.gen --route <route-dir>
```

- `--route` = the route to focus (e.g. `.behavior/v2026_08_07.driver-cron`); default: the
  branch's bound route
- `--clone-addr` = the clone address; default: this session's own (`rhx clone list` enumerates them)
- `--interval-ms` = optional cadence override; default ~20min. the sleeps *between* ticks are
  jittered to spread repeat nudges apart; the first tick fires near register (not jittered)

`gen` on a live route sets the focus to it, then **findserts**: a call that finds a live daemon
spawns no duplicate, and that daemon nudges about the new focus from its next tick. it reports
the pid, and whether the daemon is live or crashed on arrival.

`gen` on a route that is not a live drive spawns none. with a daemon live, it keeps that daemon's
focus, so the route the clone drives is still nudged. with none live, it sets the focus and says
the next route.drive of a live route registers it. either way it names why the route is not live, with its
passage status (e.g. `route-not-live, status blocked`).

## inspect: check whether it is live

```
rhx route.reminder.get
```

reports whether the clone's reminder is live, its pid, and its focus route (a deterministic
pid-file read + liveness probe). a reminder that halted with its route names that route and why.
a clone with no reminder reports "reminder is not live". `get` takes no `--route`: the reminder
is one per clone.

the handle files sit under the repo root, at
`.agent/.cache/repo=bhrain/role=driver/skill=route.reminder/` (gitignored), one set per clone.

## manual override: turn it off

the auto path already reaps the reminder on the first drive that reads the route dead, and the
daemon self-exits on its own tick. reach for `del` only to release the pid **at once** — e.g.
right after you block a route by hand, rather than wait for the next drive or tick.

```
rhx route.reminder.del
```

`del` is idempotent — a no-op if the reminder was never live ("reminder was not live"). it stops
the clone's daemon and clears its handle. like `get`, it takes no `--route`.

**note:** the no-infiniloop guarantee holds even if you never call `del` — the daemon reads
route-state each tick and exits on its own, and `route.drive` reaps on the next dead-route drive.
`del` is a courtesy reap for immediacy, not a safety requirement.

---

## the lifecycle at a glance

| moment | trigger | what happens |
|--------|---------|--------------|
| drive is live | `route.drive` (auto) | sets the focus, findserts the daemon, writes its per-clone pid handle |
| every later drive | `route.drive` (auto) | sets the focus, re-findserts: returns the live daemon, spawns no duplicate |
| drive moves to another route | `route.drive` (auto) | moves the focus; the one daemon nudges about the new route |
| a dead route is driven | `route.drive` of it, `--route` peek included (auto) | moves the focus to it, reaps the daemon, clears the handle |
| a drive that lost a race to a newer focus | `route.drive` of a dead route (auto) | leaves the daemon on the newer focus |
| block / dead session | (self-exit) | the daemon reads the state, drops its handle, exits itself |
| handle wiped or reclaimed | (self-exit, from tick 2) | the daemon sees its pid is no longer named, and exits |
| inspect liveness | `route.reminder.get` (manual) | reads the handle + probes the pid |
| force on / off now | `route.reminder.gen` / `del` (manual) | override outside the drive loop |
| a per-route daemon from before one-per-clone | a spawn (drive or `gen`), or `del` | reaps it from `.behavior/*/.route/` and `.route/*/.route/`, one line per pid (`del` prints them; a spawn logs them to the clone log); a reap that faults keeps the handle and names the fix |

---

## what it does not cover

the reminder overcomes two failure modes: a transient api outage that errors a turn, and model
hesitancy (a turn ends with no re-drive and the session idles). it does **not** clear a
**permission prompt** (the vision's open U2). a permission prompt suspends a turn mid-flight with
the pty on a y/n answer — an injected nudge queues *behind* that prompt, it does not answer it. so
a session stalled on a permission wall stays stalled until a human answers it; the daemon cannot
see that stall (it is not a `passage.jsonl` state, and `clone say`'s reach-gate cannot tell
"idle-at-a-prompt" from "mid-thought"). treat permission walls as a human-only unblock, not a
stall the reminder rescues.

### the first-fail self-exit (a deliberate anti-clog tradeoff)

the daemon self-exits on the **first** tick whose `clone say` fails its reach-gate — it reads one
failed reach as "session dead" and stops, with no retry. this is a deliberate choice, not an
oversight: it protects the hard no-infiniloop guarantee (a daemon that retried a truly-dead
session could clog the machine), and it fails safe (a stopped daemon never nudges a ghost).

the accepted cost is a **false-positive stop**: a single transient `clone say` blip — a momentary
unreachable read on a session that is in fact still alive — stops the reminder as if the session
had died. once stopped, the reminder revives only on the next `route.drive` hook boundary
(onBoot / onStop), which re-findserts it. that boundary covers the common case, because a driver
that is genuinely mid-drive keeps reaching turn boundaries. the residual gap is narrow and specific:
a daemon that stops on a false-positive blip **while** the driver is simultaneously idle-stalled
(the exact case the reminder exists to rescue) has no automatic revival, since no fresh boundary
fires to re-findsert it. a human "continue" restarts the drive, which re-findserts the reminder.

to close that residual gap — via a small bounded retry before the daemon commits to "session dead",
or a continuous enroller-level host that re-findserts outside the drive loop — is a **wisher-scope
decision left open**, not a defect in this behavior. it trades a wider false-positive blast radius
against the anti-clog guarantee, and the choice of where to sit on that tradeoff belongs to the
wisher, as a potential follow-up behavior.

---

## validate nudge efficacy (a one-time human check)

the reminder's core bet — U1's linchpin — is that the injected prose actually re-drives an idle
session, rather than reads as chatter the model skips. that cannot run in CI: `clone say` refuses a
non-LIVE clone, so no sandbox can exercise the inject-lands path. confirm it once, by hand, on a
real enrolled driver:

1. enroll a driver on a live route; let it reach an idle turn-end (or force an api error mid-turn).
2. from another shell, inject the nudge at the driver's clone address:
   `rhx clone say @:<driver-clone-addr> --what "you can do it! drive on, fulcrum, and converge"`
3. confirm the driver wakes and re-runs `route.drive` — it advances the stone, or re-reads it.

if step 3 holds, U1 is proven for that model. if the nudge reads as chatter, swap the payload for a
deterministic `rhx route.drive` command — the prose default lives in one constant
(`REMINDER_NUDGE_PROSE.ts`), so it is a one-file change.

## a stated constraint: single-writer passage.jsonl

the reminder reads route state from `passage.jsonl` via a tail-of-file read
(`getLatestPassageForRoute`), which assumes the route's passage log has **one writer**. that holds
in the drive model: `route.stone.set` is the sole appender, run serially by one driver session. two
concurrent appenders (a human and a hook in a race, or two clones on one route) could interleave a
partial line; the reminder does not defend against that — it is a stated constraint, not a
supported mode. a torn tail line fails loud (the strict passage parse throws), so a partial write
surfaces as a fault, never a silent misread.

---

## the owl's wisdom 🌙

> light the lantern when you set out on a long road.
> it re-lights each time you pause, and darkens itself when the road ends.
> you need not return to snuff it — a good lantern knows when its trail is done. 🪷
