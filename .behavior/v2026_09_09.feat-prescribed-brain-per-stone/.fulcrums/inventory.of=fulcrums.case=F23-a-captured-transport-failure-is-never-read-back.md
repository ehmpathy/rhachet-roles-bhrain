# F23 — a captured transport failure is never read back

**rework** = 🔴 dirty · **status** = open · **confidence** = 75%

## .the fork

`dispatchBrainSwitch` hands the detached `clone say` an engine-owned stderr fd, so a loud failure —
*"message was written to the clone but did NOT leave its input buffer"*, plus a `hint` — lands in
`.log/bhrain/brain/apply.log` rather than vanishes. no surface reads it back: the drive still shows
`brain = <slug>` on a dispatch whose transport already refused.

| option | buys | costs |
|---|---|---|
| **capture only** — taken | the cause survives the hook's exit | a human who does not know the path believes the switch was submitted |
| read the tail back next tick, name the cause | the error reaches the reader with the stone in front of them | a timestamped, entry-keyed marker on `DriveBlockerState` and its snapshot |
| read it back in the same tick | no marker | 🔴 rejected: to read the stderr is to wait on the dispatch — the deadlock `case=5` forbids |

## .taken, and why

capture passed SAFE and CLEAN — one `stdio` argument. read-back passed SAFE only — a persisted field,
a resnap, three suites. so capture landed and read-back was caught as a dream.

## .rework — dirty

a tick must know **which** write it read, or it re-reports a fixed failure — the same timestamp
`F21` needs, on the same record `F22` disputes.

## .the counter-case

- the render under-reports and never lies — it claims a request, not an acceptance
- a log tail carries no run id, and a stale line reads the same as a fresh one; to promote it into a
  named cause lets a guess replace an honest abstention
- a smaller middle, unweighed in the dream: leave the line, and have a halt name the log path — no
  marker, no field, no resnap

## .where

`src/domain.operations/route/brain/dispatchBrainSwitch.ts` ·
`.dream/v2026_09_16.fix.dispatch-brain-switch-discards-a-loud-clone-say-failure.md`

## .the verdict

open.
