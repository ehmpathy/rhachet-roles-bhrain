# fulcrum F25 · concurrent-build-fix-deferred-to-a-dream

## .the fork

three acceptance runs at once left `dist/` absent and locked every tool. two ways forward:

- (a) fix the build in this pr: one stage dir per build, a short-held swap, a clamp test
- (b) restore `dist/` and the links, correct the hazard brief, run suites one at a time, and catch
  the build fix as a dream

## .taken

(b). the human asked for the build and the own-build links back, and both stand. the hazard brief
now states the two-builds case truly and forbids parallel acceptance runs in one worktree.

## .rework

clean. the dream holds the full shape; a reviewer or the foreman who wants it in this pr can pull it
in with no ripple to the education suite.

## .confidence

80%. the fix is safe, but it spans `package.json`, `tsconfig.json`, `.gitignore`, a new swap
executable, and a clamp, which is not clean at `5.3`. the gap: the human's words could also mean
"fix the build defect itself".

## .where

`.dream/v2026_11_27.followup.build-stage-per-build-so-concurrent-builds-keep-dist.md` ·
`.agent/repo=.this/role=any/briefs/hazard.a-build-wipes-role-links-and-fails-every-hook-closed.md`

## .verdict

open, foreman rules.
