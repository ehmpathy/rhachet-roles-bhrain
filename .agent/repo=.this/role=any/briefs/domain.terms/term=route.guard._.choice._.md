# domain.term: guard

term.chosen   = guard
term.kind     = noun
term.boundary = route
term.synonyms.forbidden:
- gate
- check
- validator
- gatekeeper
- barrier

## .what
a **guard** is the optional validation a **stone** carries — the mechanism that refuses passage
until its conditions hold. reviews, judges, and human approval are all run by a guard.

a guard **gates** progress; the stone **marks** it. a stone with no guard is ordinary and passes
freely; the guard is what makes a stone a gate.

## .refs
where the term composes declared objects & operations:
- src/domain.objects/Driver/RouteStoneGuard.ts, GuardProgressEvent.ts
- src/domain.objects/Driver/RouteStoneGuardApproveArtifact.ts, ...GuardJudgeArtifact.ts,
  ...GuardReviewArtifact.ts, ...GuardReviewPeerMeter.ts, ...GuardReviewSelfArtifact.ts,
  ...GuardBlockerReport.ts
- src/domain.operations/route/guard/                              # the operation namespace
- src/domain.roles/driver/skills/route.guard.budget.sh, route.guard.upgrade.sh

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard._.choice.reason.md` — etymology, why not `gate`/`validator`, and the guard-vs-stone
  line
