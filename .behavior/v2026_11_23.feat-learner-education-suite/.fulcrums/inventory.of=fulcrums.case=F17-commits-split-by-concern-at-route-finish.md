# F17: the pr's four concerns split into commits at route finish

- **fork**: r11 asks the pr's four concerns to be revertible apart: the education feature, the live-brain gate, the rhachet 1.51→1.54.1 upgrade, and the F14 term-hook pin with the dev-dependency guard. the `setRouteBind` refactor gets a commit of its own. (a) commit them now · (b) commit them at route finish, one commit per concern, in that order
- **taken**: (b). no stone of this route asks for a commit, and a driver commits only when a stone asks or the route is finished (`rule.forbid.commits-the-route-did-not-ask-for`). a commit now would also change the `since-main` scope the reviewers read
- **the split, as owed**: 1. `setRouteBind` → `getOneRouteBindFlagFound`, with the route/bind suite · 2. rhachet upgrade (`package.json`, lockfile, `settings.of.repo.json`, `prepare:rhachet`, `.gitattributes`, the two snapshots) · 3. live-brain gate (the jest env files, the global setup, the gated tests) · 4. F14 pin + `rhachet-artifact-git` guard · 5. the education suite
- **rework**: clean. a commit split changes no file
- **confidence**: 90%
- **where**: the branch, at finish
- **verdict**: open. the reviewer and the foreman rule on (b)
