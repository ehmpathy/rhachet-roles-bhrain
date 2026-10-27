# F17 — the rhachet main pin and the openrouter patch ride this tree

## the fork

at i004, r11 asked to pull the rhachet pin (`github:ehmpathy/rhachet#main`) out of the commit or
pin it to a sha, and to revert the rhachet-brains-openrouter patch hunk, since neither is about
boot budgets.

| option | cost |
|---|---|
| revert both now | the l3 lanes cannot run: they need rhachet#636 (main, unreleased), and the reviews they launch need the openrouter patch. the director ordered both kept |
| keep both, say in the pr when each retires | two lines in the diff that serve the route, not the feature |

## taken, and why at the time

keep both. the director ordered the main pin (seed S7) and ordered the openrouter patch kept, and
said the 400 itself is rhachet-ktlo's lane. the lockfile already resolves the pin to one sha
(`1d747fd5…`), so an install is reproducible. the pr body names when each retires: the pin at
rhachet v1.50.1, the patch when rhachet-brains-openrouter.beav.fix-429-hop-and-tier-fallback
releases.

## rework: clean

each is one dependency line plus its lock or patch file; a revert or a version swap touches no
caller.

## confidence: 80%, and why it is not higher

- a branch ref in `package.json` breaks `rule.require.pinned-versions` in letter, even with the
  lock pinned
- not verified that CI installs a git-hosted dependency whose `prepare` step skips under `CI`

## where

`package.json` · `pnpm-lock.yaml` · `patches/rhachet-brains-openrouter@0.1.3.patch` · `pr.body.md` (note)

## verdict — the pin half retired

the second doubt above came true. ci built rhachet from the sha in its prepublish step, the build
failed (TS2742), and no suite ran. the director ruled: pin the published version, exactly.
rhachet v1.50.1 had shipped with rhachet#636, so the pin is now `"rhachet": "1.50.1"` and no
feature is sha-only. the openrouter patch half stands, with its retire line unchanged.
