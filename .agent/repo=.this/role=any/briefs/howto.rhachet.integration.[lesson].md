# how rhachet integrates with this repo

## overview

rhachet provides agent roles, briefs, and skills that can be shared across repositories. this repo (`rhachet-roles-bhrain`) is a rhachet roles package that:
1. defines roles (e.g., `reviewer`, `thinker`)
2. publishes to npm for consumption by other repos
3. uses symlinks in `.agent/` to expose roles locally during development

---

## build pipeline

### `npm run build`

runs three top-level commands, all staged in `dist.next/` so `dist/` is never absent mid-build:
1. `build:clean` - removes a stale `dist.next/`
2. `build:compile` - compiles typescript via `tsc` + `tsc-alias` into `dist.next/`
3. `build:complete` - rsyncs non-ts assets into `dist.next/`, swaps it into `dist/` via rename, then writes `rhachet.repo.yml`

each top-level command calls `:`-suffixed sub-commands (`build:clean` → `build:clean:tsc`,
`build:complete` → `build:complete:dist` · `:swap` · `:repo`, and so on). the per-sub-command
table, and which of them touch `dist/`, lives in one place:
`hazard.a-build-wipes-role-links-and-fails-every-hook-closed`. `package.json` is the source both
read from.

### `build:complete` rsync

the rsync command (`build:complete:dist`) selectively copies assets from `src/` to the stage `dist.next/` (only the rename swap writes `dist/`). its include/exclude list lives in `package.json` alone; in sum:

- **includes** — whole `briefs/`, `skills/`, `inits/`, and `templates/` trees, plus each `readme.md`, `boot.yml`, and `keyrack.yml`
- **excludes** — `.test/`, `.route/`, `.scratch/`, `.behavior/`, and every `*.test.*` file

---

## rhachet linking

### `rhachet link`

creates symlinks from `.agent/` into `dist/` after build:

```
.agent/
  repo=bhrain/
    role=reviewer/ -> ../../dist/roles/reviewer/
    role=thinker/ -> ../../dist/roles/thinker/
```

### `rhachet init` + `rhachet roles link`

in `prepare:rhachet`:
```json
"prepare:rhachet": "rhachet init && rhachet roles link --role mechanic && rhachet roles link --role behaver && rhachet roles init --role mechanic"
```

this:
1. initializes rhachet in the repo
2. links external roles from dependencies (e.g., `mechanic` from `rhachet-roles-ehmpathy`)
3. initializes role-specific configs

---

## skill execution

### `npx rhachet run --skill <name>`

rhachet resolves skills via `.agent/` symlinks:
1. looks up `.agent/repo=*/role=*/skills/<name>/`
2. finds skill entrypoint (`.sh`, `.ts`, or `.jsonc`)
3. executes the skill

for `.ts` skills:
- the source `.ts` file must exist in `dist/` (not just compiled `.js`)
- rhachet imports and executes the `.ts` file dynamically

---

## common issues

### "cannot find module ... skills/.../review.ts"

cause: the skill's `.ts` source never reached `dist/`. the include list already grants the whole
`skills/` tree (`--include='skills/**'`, per the rsync section above), so the source is absent
only when `dist/` predates the skill, or when that grant was dropped from `build:complete:dist`.

fix: rebuild with `npm run build`. if the `.ts` is still absent, confirm `package.json`
`build:complete:dist` still carries `--include='skills/**'`.

### permission denied on `dist/`

cause: symlinks or files owned by different user/process

fix: `sudo rm -rf dist && npm run build`

---

## directory structure

```
src/
  roles/
    reviewer/
      briefs/         -> markdown briefs
      skills/
        review/
          review.ts   -> skill entrypoint
          review.sh   -> shell wrapper
          .test/      -> test assets

dist/                 <- built output
  roles/
    reviewer/
      briefs/         <- copied from src
      skills/
        review/
          review.ts   <- copied by rsync (source)
          review.js   <- compiled by tsc
          review.sh   <- copied by rsync

.agent/               <- symlinks (created by rhachet link)
  repo=bhrain/
    role=reviewer/ -> ../../dist/roles/reviewer/
```

---

## key takeaways

1. **source `.ts` files must be in `dist/`** - rhachet executes skills from `.agent/` symlinks which point to `dist/`
2. **rsync controls what reaches `dist/`** - it stages into `dist.next/`, which the rename swap makes `dist/`; update `build:complete` to include new file types
3. **`.agent/` is generated** - don't edit `.agent/` directly; edit `src/` and rebuild
4. **briefs go in `src/roles/<role>/briefs/`** - will be symlinked via rhachet
5. **skills go in `src/roles/<role>/skills/<skill>/`** - entrypoint is `<skill>.ts` or `<skill>.sh`
