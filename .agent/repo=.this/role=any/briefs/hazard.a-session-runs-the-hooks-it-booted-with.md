# hazard.a-session-runs-the-hooks-it-booted-with

> **a claude code session reads its hook settings once, at start. a hook command you change
> mid-session never runs in that session — so a silent call proves naught about the change.**

## .why it bites

- the settings file on disk shows the new command, so it reads as live
- a call that passes in silence looks like proof the new hook ran; a hook that never ran is
  silent too
- ⇒ a "live check" made in the same session that changed the hook checks the OLD hook

## .the test

> **which command did the harness run?** the transcript's hook record names it
> (`"command": …` on each `hook_success`). read it before you cite a live run.

| when… | then… |
|---|---|
| you change a hook command and want proof it runs | run the exact command yourself, the way the harness does (`sh -c`, payload on stdin), in a test |
| you need proof against a real role layout | an acceptance test that runs a real `rhachet roles link`, then the command |
| you would write "this session's hooks ran the new command" | check the transcript's hook record first; it likely names the old one |
| a hook only blocks in some trees | fire one call that MUST block; a block is proof the hook ran, silence is not |

blocker: a live check cited as proof of a hook command changed in the same session · a "no
notice appeared" claim used as proof a hook ran.

⇒ worked example: `.behavior/v2026_11_01.fix-memory-guard-fails-open/5.1.execution.from_vision.yield.md`
— the first yield claimed its own session ran the new memory.guard command; a forced memory
write showed the old `rhx memory.guard` hook still in force. the cure was
`blackbox/learner.memory-guard.hook.acceptance.test.ts`.
