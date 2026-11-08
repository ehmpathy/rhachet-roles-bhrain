# F13 — the peer derive is clamped via init, not a live enroll

## .the fork

- **A.** derive the peer settings via `rhx init --hooks` over a written `actor.json`, then run the derived Stop command (case3 `[t1]`–`[t5]`)
- **B.** drive `rhx enroll`

## .taken — A

`rhx enroll` launches a brain session; a test cannot drive one without a live brain, keys, and a tty. the derive that enroll and init share is the narrow in `getSettingsForRoles` (author `role=` segment), and the init path runs that narrow over a real actor record. case3 then reads the Stop command out of the derived peer file and runs it: a stale stop holds, a fresh one passes, and after disable the re-derived peer has no entry.

## .rework — clean

one more `when` in case3, should rhachet ship a non-interactive enroll.

## .confidence — 85%, why not higher

enroll could one day derive through a path init does not share.

## .where

`src/contract/cli/learn.terms.hook.integration.test.ts` case3
