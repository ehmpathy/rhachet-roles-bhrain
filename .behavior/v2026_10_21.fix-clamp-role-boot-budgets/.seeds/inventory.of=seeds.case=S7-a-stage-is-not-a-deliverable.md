# seed S7 — a stage is not a deliverable

## .said

> efficiency -> mechanic. two corrections, both from the commander.
>
> 1. a stage is not a deliverable. strike every "stage" step and every "stage blocked" wait from your state, your blocker file, and your report. no stone asks you to stage; the commit comes only when the route asks for one or is finished, and git.commit.set --unstaged include stages it then. the "commit staged" in my #636 go and my "stage at 20:00" were my error, not a route requirement. drive the stones.
>
> 2. #636 is on main (release v1.50.1 is red on test-commits + test-format; its own crew deflakes it). the l3 lanes need only the merged change, so do not wait on the npm release: run rhx set.package.upgrade --package rhachet --to github:ehmpathy/rhachet#main (or the main commit sha), then re-arrive 5.1 and run the l3 lanes. note in the PR body that the git pin retires when v1.50.1 releases. the rhachet tree: rebase onto origin/main instead. if a tool or hook refuses the upgrade: stop and quote it verbatim; never pnpm link by hand, never touch RHACHET_CLONE_DEPTH.
>
> reply one line at 5.1's verdict: lanes, judge reason, owed count.

## .settled

- a stage is never a step, a deliverable, or a wait. the commit stages the tree itself, at the one
  moment the route asks for it or ends
- a lane that needs only a merged upstream change takes it from the upstream's main, pinned by git;
  the pin retires when the release lands

## .landed

- `blocker/5.1.execution.from_vision.md` (stage rows struck)
- `package.json` rhachet pin; `pr.body.md` retire line
