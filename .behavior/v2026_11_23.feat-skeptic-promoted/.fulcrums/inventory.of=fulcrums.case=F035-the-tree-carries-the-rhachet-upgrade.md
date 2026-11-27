# F035 — the tree carries the rhachet upgrade

- **fork**: split the rhachet 1.51 → 1.54.1 bump, the ehmpathy roles bump, the playwright pin, the lockfile, the regenerated hook settings and manifest, `.gitattributes`, and the seven `prepare:rhachet` roles into their own PR; or keep them beside the skeptic promotion
- **read**:
  - this route's own seats run under `hooks.dispatch.manifest v1`, a file rhachet 1.54 writes (`node_modules/rhachet/bin/hooks.dispatch.sh` reads v1 only)
  - the skeptic dispatcher suite runs `node_modules/rhachet/bin/hooks.dispatch.sh`, so it pins the 1.54 dispatcher
  - the peer floor reads `rhachet >=1.49.2`; the role was only run on 1.54.1
- **taken**: keep them in the tree for 5.1. neither a split nor a floor raise is mine to make, so the halt asks for both (`blocker/5.1.execution.from_vision.md`, row 1)
- **rework**: clean — a split moves files between two branches; a floor raise is one `package.json` line
- **confidence**: 55%; the reviewers read the bumps as unrelated, and two of them are (the playwright pin, `.gitattributes`)
- **where**: `package.json`, `pnpm-lock.yaml`, `.gitattributes`, `.agent/.actors/actor.via.repo=ambient/brain/.claude/**`
- **verdict**: settled by the driver on precedent (seed S11). bulletin `rhachet-upgrade-rides-in-the-first-tree` says the first tree to bump rhachet commits the bump, so the bump, its lockfile, the hook regen it writes, and the `.gitattributes` sections its init writes ride here. the bulletin skill is not linked here; its rule is read as the director stated it. the peer floor is raised to `rhachet >=1.54.1` (`package.json` peerDependencies), the one version the evidence backs: every suite ran on 1.54.1, and `skeptic.stop.dispatch` drives 1.54's v1 manifest dispatcher. no suite here ran on 1.49.2
