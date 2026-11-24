## .what
the `typescript-node` practice build clears `dist/` before it compiles. a build that then fails leaves `dist/` empty or partial, and every repo that runs skills from its own `dist/` loses them until a green build lands.

## .the declared scripts (0.50.0)
```
build:clean:tsc   = (chmod -R u+w dist ...) && rm -rf dist/
build:compile:tsc = tsc -p ./tsconfig.build.json && tsc-alias -p ./tsconfig.build.json
build             = build:clean && build:compile && build:complete --if-present
```

## .who meets it
any repo that links its own roles, hooks, or skill scripts to its own `dist/` (rhachet role packages that self-link via `"<pkg>": "link:."`). in rhachet-roles-bhrain, one failed build left every PreToolUse hook unable to find its skill, so every tool call failed closed and the session wedged until the roles were relinked to a published copy.

## .why a repo cannot fix it locally
the practice owns `build`, `build:clean`, `build:clean:tsc`, and `build:compile:tsc` (FileCheckType.CONTAINS), and declapract 0.13.27 offers no per-repo override (no exclude in `declapract.use.yml`, no ignore marker). a repo that keeps a staged build has it rewritten on each `declapract fix`.

## .ask
build into a staged dir and swap only on success, e.g.:
```
build:clean:tsc   = rm -rf dist.next/
build:compile:tsc = tsc -p ./tsconfig.build.json --outDir dist.next && tsc-alias -p ./tsconfig.build.json --outDir dist.next
build:complete:swap = rm -rf dist.prev/ && ([ ! -d dist ] || mv dist dist.prev) && mv dist.next dist && rm -rf dist.prev/
```
or offer a per-repo override so a repo can declare one. a failed build must never wipe the `dist/` that skills run from.

## .seen
rhachet-roles-bhrain, branch `beav/feat-declapract-upgrade`, route `.route/v2026_11_19.declapract.upgrade`
