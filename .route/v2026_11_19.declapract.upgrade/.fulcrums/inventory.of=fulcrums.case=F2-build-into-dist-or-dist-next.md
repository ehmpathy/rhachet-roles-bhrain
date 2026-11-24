# fulcrum F2: build straight into dist/, or keep the dist.next swap

## .the fork
- **adopt the practice**: `build:clean:tsc` and `build:compile:tsc` now target `dist/` directly. the repo's own `build:complete:dist` and `build:complete:swap` still target `dist.next/`, so the scripts disagree
- **keep the swap**: compile into `dist.next/`, then swap it into `dist/` only once the build succeeds

## .why it matters here
this repo links its own roles from `dist/`. a build that clears `dist/` first, then fails, leaves every role hook unresolvable, so every tool call fails closed (`hazard.a-build-wipes-role-links-and-fails-every-hook-closed`). this upgrade did exactly that: the session wedged until the roles were relinked to the published 0.44.1 copy

## .verdict
final, by the director: conform now. `build:complete:dist` targets `dist/`; the `dist.next` swap is dropped; the upgrade lands as the practice declares it. why: the rework is clean (restore the swap once declapract-typescript-ehmpathy ships a staged build or an override), and the worst harm, every hook failed closed, is already covered by the role links on the published 0.44.1. the upstream dispatch stays held for the radio.

the first verdict (keep the swap as an in-repo override) proved unbuildable; the record below says why.

## .taken
- dispatched upstream (held for the radio until `rhx radio.uses allow`)
- the in-repo override is NOT yet declared: declapract 0.13.27 offers no override mechanism (no exclude in `declapract.use.yml`, no ignore marker), and the practice owns `build`, `build:clean`, `build:clean:tsc`, `build:compile:tsc` under a CONTAINS check, so each `declapract fix` rewrites them. `build:clean:tsc` always runs `rm -rf dist/` before the compile
- ⇒ no in-repo config can keep a failed practice build from a wipe of `dist/` while the skills load from `dist/`. the one in-repo route: move the runtime off `dist/` (package.json `main`, `exports`, `files` → a dir the practice never cleans, which a repo-owned `build:complete` swaps in only on success). that touches the published layout. returned to the director for a call

## .where
package.json scripts: build:clean:tsc · build:compile:tsc · build:complete:dist · build:complete:swap
