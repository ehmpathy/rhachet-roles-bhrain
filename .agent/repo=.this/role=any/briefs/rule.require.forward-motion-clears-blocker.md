# rule.require.forward-motion-clears-blocker

## .what

any forward motion clears the blocker. the moment a driver marks a stone
`--as <status>` — ANY status — the driver is **over** the prior blocker, so that
blocker (a stale escalation halt) must clear automatically.

## .the hard rule

> mark `--as xyz`, means you're over the blocker.
> any forward motion = automatic removal of the blocker.

there is no `--as` verb that leaves a stale blocker in place. every one of them is
forward motion, and forward motion supersedes a halt.

## .why

a `--as blocked` escalation is a driver's cry for help at a wall. once the driver takes
any next action — promises a self-review, contemplates a peer review, re-attempts
passage — the driver is no longer at that wall. to keep a `blocked` line (or to keep
the onStop hook halted) after the driver moved on is a stale lie: the statusline waves a
✋ that no longer applies, and the route sits halted while the driver is actively at
work.

the disposition (push | halt) — read by BOTH the statusline glyph and the onStop hook —
is derived from the **latest** passage entry (latest-entry-wins). so the mechanism of
"forward motion clears the blocker" is simply: **every `--as` verb writes a passage
entry**. the new entry supersedes the stale halt, and the disposition recomputes.

## .the mechanism

| `--as` verb | writes a passage entry? | supersedes a stale halt? |
|-------------|-------------------------|--------------------------|
| passed / arrived | yes (passed / blocked+blocker / exhausted / malfunction) | yes |
| approved | yes (approved) | yes |
| blocked | yes (blocked — a NEW, deliberate halt) | replaces with a fresh halt |
| rewound / overruled / forced | yes | yes |
| **promised** | **yes (promised)** — a self-review sub-step | **yes** |
| **contemplated** | **yes (contemplated)** — a peer-review sub-step | **yes** |

`promised` and `contemplated` are the two sub-step verbs. they were the exception that
broke the rule — they used to write only an artifact (a promise file, a `.taken`), no
passage entry — so a stale escalation lingered through them. they now write a passage
entry like every other forward verb, so the rule holds with no exception.

`promised` and `contemplated` carry a **push** disposition (they are the machine's own
review work, not a human-wait), so the superseded halt resolves to a state the route
self-drives.

## .enforcement

- a `--as <status>` verb that does not write a passage entry = **blocker** (it leaves a
  stale halt in place, which breaks the rule)
- a new forward-motion verb must map to a disposition in `asStoneDisposition` (push for
  agent work, halt only for a genuine human-wait)

## .see also

- `define.passage-statuses.md` — which statuses constitute passage (only `passed`)
- the `1.vision` of `v2026_07_22.fix-route-statusline` — the disposition model this rule
  completes
