# F10 · the `roles boot` onBoot hooks that `rhachet repo introspect` refuses

## .the fork
- (a) delete the ten self-boot onBoot hooks and raise the peer floor to the rhachet this tree builds against
- (b) pin `rhachet` back to 1.48.1 here and leave both to a peer-floor change
- (c) merge red and fix after

## .taken, and why at the time
(a), taken on 2026-10-17 on the wisher's call to drive on and converge. it was (c) until then, held
open for the wisher through four review rounds.

the red build rides in this tree: the `rhachet 1.48.1 → 1.49.2` bump is what makes introspect refuse
the hooks, and `test:acceptance`, `prepush`, `prepublish` and `prepare:rhachet` all open with
`npm run build`. while it stood, no acceptance suite ran and no release published. (b) undoes the
split layout this fix targets. (a) is mechanical: introspect's own hint says to delete each
`roles boot --role` hook, because `boot.md` already renders the role.

what landed: the self-boot hook is gone from achiever, driver, learner, librarian, navigator,
reflector, researcher, reviewer, telepath and thinker (the roles' other hooks stay), and
`peerDependencies.rhachet` reads `>=1.49.2`, the version this tree builds and tests against.

## .rework
clean while unreleased — one tree, ten role files and one line of `package.json`. a revert restores
them. it turns dirty at the first publish, because a peer floor is a contract every consumer leans on.

## .confidence — 75%, and why it is not higher
a consumer on a rhachet before the `boot.md` render loses its booted briefs once the hooks go, so the
floor raise changes the contract for them. the verified floor is 1.49.2; an earlier version may render
`boot.md` too, and the wisher may want a lower floor or a major bump on release.

## .where
`src/domain.roles/*/get*Role.ts` (ten files) and `package.json`.

## .proof
`npm run build` passes, and the acceptance clamp runs: 9 passed, 0 failed
(`rhx git.repo.test --what acceptance --against local --env test --mode apply --scope 'path://blackbox/driver.init.status-line-survives-enroll'`).

## .verdict
confirmed by the wisher, 2026-10-17: accept `>=1.49.2` as the peer floor
