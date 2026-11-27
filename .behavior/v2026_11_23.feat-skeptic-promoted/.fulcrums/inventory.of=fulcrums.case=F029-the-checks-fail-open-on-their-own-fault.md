# F029 — the skeptic's checks fail open on their own fault, loud, never closed

- **fork**: a Stop check or `razor.brief.check` that cannot run (jq absent, a payload, transcript, table, or boot.yml it cannot read, a mark it cannot write) either passes the act silently (exit 0), passes it loud (exit 1, a `💥 MalfunctionError:` note), or refuses it (closed: exit 2)
- **read**:
  - `rule.require.qualified-error-headers` (mechanic) asks a PreToolUse hook to exit 2 on a malfunction, since any other code lets the call through; its subject is a guard whose bypass ships harm
  - `razor.brief.check` refuses a Write of a booted brief that names a one-case org: a brief-quality razor. closed on its own fault, a consumer host with no jq has every Write and Edit refused, in every file, until a human installs jq; the razor's own miss is one unrazored brief
  - each Stop check refuses at most twice per turn so a session is never wedged (`case=8` `[t3]`, the vision's pit of success). closed on its own fault, an unreadable transcript refuses every stop of every turn: the wedge the cap exists to prevent
  - rhachet@1.54.1 `bin/hooks.dispatch.sh`, read 2026-11-24: a rule that exits 2 holds the event (`:18-20`); a rule that exits any other nonzero code is a crash, reported with its stderr, and the dispatcher exits with that code, a non-block (`:25`); a rule's stderr shows only on a nonzero exit (`:438`). so exit 0 hid every `💥` note, and exit 1 shows it without a hold
- **taken**: open and loud: exit 1 with one `💥 MalfunctionError:` line that names what it could not do. a table of only general rows is no fault (zero one-case slugs is a valid table) and passes at exit 0 with no note
- **rework**: clean. one exit code per fault path, over five skills, if the council prefers closed (exit 2) for `razor.brief.check`
- **confidence**: 92%. the dispatcher read settles the open-and-loud half; closed for the brief razor stays a council call on harm, and the case against it is plain
- **where**: `skeptic.answer.check.sh`, `skeptic.claims.sh`, `razor.stop.check.sh`, `razor.hold.check.sh`, `razor.brief.check.sh`; each header's fail-open line; clamps: answer case13, razor.stop case10, razor.hold case7 `[t4]`, claims case11, razor.brief `[t1]`
- **verdict**: open — peer review i001 (mech-failhides blocker.1, blocker.2, nitpick.1; arch-hazards-maintenance blocker.1, nitpick.1); i002 moved the exit from 0 to 1 (mech-failhides nitpick.1, ergo-friction-hazards nitpick.2); exit 2 for the brief razor (mech-failhides i002 nitpick.2) stays for the council
