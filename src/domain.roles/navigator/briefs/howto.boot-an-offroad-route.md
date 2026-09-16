# howto: boot an offroad route

## .what

the moves that take a goal with **no route** to a **bound route the driver can walk**.

offroad = there is no paved path for this work today. that is legitimate and often
necessary. it is also the most expensive mode there is, paid per traveler — so the
exploration owes a route at the end of it.

## .why boot the route FIRST, not last

the obvious instinct is to explore, finish, then write the route from memory. that
produces a **sanitized** route: the wrong turns are gone, the reasons are gone, and
what is left reads like a plan nobody actually walked.

⇒ **boot a thin route up front, and grow it as you walk.** the stone you add at the
moment you discover you need it carries the cue that made you notice. the same stone
reconstructed at the end does not.

🟡 this does not mean predict every stone. it means **keep the outline live** — add,
split, and re-order stones as the ground teaches you.

## .the six moves

### 1. name the bars, before the stones

a goal with no bar is unfalsifiable. for each qualifier in the ask — *fast*, *durable*,
*cheap*, *with no loss* — write what **clears** it and what **fails** it, and the test
that tells them apart.

```
.route/v$date.goal=$slug/0.wish.md
```

⚠️ a qualifier is a bar with a test, never an adjective in the lead line.

### 2. put the INSTRUMENT before the work

if the goal is measurable, the first stone builds what measures it — and it must be
able to fail. a stopwatch that only counts up licenses you to delete work to win.

> the test: **can this instrument report that I made things worse?** no → it is a
> cheerleader, not an instrument.

### 3. cut stones at the points where you would want to STOP

a stone is a milestone, never a task. the cut is right when a traveler could halt
there and hand off cleanly.

| a good cut | a bad cut |
|---|---|
| "measure the baseline" | "open the config file" (too small, no milestone) |
| "cut the per-test fixture cost" | "make it fast" (too large, no guard) |

### 4. give every stone a guard — how it KNOWS it is done

an unguarded stone passes on vibes. name the check, the measurement, or the artifact.

```yaml
# $route/2.baseline.guard
artifacts:
  - $route/2.baseline.yield.md
```

⇒ if you cannot state the guard, the stone is not yet a milestone. split it until you can.

### 5. order by DEPENDENCE, never by comfort

ask of each stone: *what breaks if this runs after the one below it?* if the answer is
"the measurement is meaningless", then the order carries real weight — say so in the
stone itself, so a later traveler does not re-order it for tidiness.

🟡 stones that share a numeric prefix run in parallel (`3.1.a`, `3.1.b`). reach for that
only when neither reads the other's output.

### 6. 🔴 BIND it — or the route does not exist

```sh
rhx route.bind.set --route .route/v$date.goal=$slug
```

**without a bind the driver never learns the route is there.** the stones sit on disk,
the hooks stay silent, and the work proceeds offroad exactly as before — with the extra
cost of a route nobody walks.

⇒ an unwalked path is the worst case: paid for, and amortized over nobody.

## .the moves, as commands

```sh
rhx mkdirsafe --path '.route/v$date.goal=$slug' --parents
printf '...' | rhx route.stone.add --stone 1.instrument --from @stdin --route $route --mode apply
rhx route.bind.set --route $route
rhx route.drive                      # confirm the driver sees it
```

🟡 `.route/` is guarded — write stones through `route.stone.add`, never a raw editor write.

## .the wrong turns to expect

| the turn | what reverses it |
|---|---|
| the route is written at the END, from memory | boot it thin at the start, grow it as you walk |
| a stone with no guard | state the check, or split the stone until you can |
| stones ordered by what felt easy | ask what breaks if the order flips |
| the route is created and never bound | `route.bind.set`, then `route.drive` to confirm |
| every stone is a task | a stone is where a traveler could hand off |

## .see also

- `rule.always.bind-the-route-you-create` — the mandate behind move 6
- `rule.require.a-stone-names-its-guard` — the mandate behind move 4
- `philosophy.offroad-pays-for-pavement` — why this role exists
- `howto.create-routes` (rhachet/enroller) — the file-level contract for stones and guards
