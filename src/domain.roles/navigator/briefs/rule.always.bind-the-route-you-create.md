# rule.always.bind-the-route-you-create

> **a route that is not bound does not exist.** create it, then bind it, then confirm
> the driver sees it — in the same turn, every time.

```sh
rhx route.bind.set --route .route/v$date.goal=$slug
rhx route.drive     # the confirmation. it must name your stone
```

## .why

the bind is what joins a directory of files to the machinery that drives it. with no
bind:

- `route.drive` reports no route, so the onBoot and onStop hooks stay silent
- the guards never fire, so no stone is ever gated
- the status line shows no stone
- the work proceeds offroad **exactly as it would have with no route at all**

⇒ so the failure is not partial. an unbound route buys the full cost of the route —
the decomposition, the guards, the stones — and delivers **none** of its benefit.

🔴 **and it fails silently.** no error, no warn. the files are on disk and they look
right. the tell is only visible if you look for it, which is why the confirm step is
part of the rule rather than a nicety.

## .the confirm is not optional

`route.bind.set` reports success on a path it merely wrote down. `route.drive` is what
proves the join holds and the stones parse.

| you ran | it proves |
|---|---|
| `route.bind.set` alone | a bind record was written |
| `route.drive` after it | the driver resolved the route AND read your stones |

⇒ a bind with no `route.drive` after it is a claim, not a check.

| when… | then… |
|---|---|
| you author a skill that creates a route | 🔴 that skill must bind it too, or it ships orphans |
| you create a route by hand | bind it in the same turn — a later turn is a turn that may not come |
| you rebind to a sub-route | rebind to the parent when the sub-route closes, or the parent is orphaned |
| `route.drive` says "dunno, route not bound" | that is this rule fired. bind it |
| `route.drive` names a DIFFERENT route | you are bound elsewhere. decide which, do not leave it ambiguous |
| you finish an offroad task with a route on disk | check the bind before you call it done |

## .enforcement

blocker: a route created and left unbound · a skill that creates a route and does not
bind it · a sub-route rebind that never returns to its parent.
nitpick: a bind with no `route.drive` confirmation after it.

⇒ see also: `howto.boot-an-offroad-route` (move 6) · `howto.create-routes`
(rhachet/enroller) — *"critical: without a bind, the driver won't know the route exists"*.
