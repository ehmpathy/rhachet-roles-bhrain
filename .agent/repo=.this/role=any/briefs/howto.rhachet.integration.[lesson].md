# how rhachet integrates with this repo

## overview

rhachet provides agent roles, briefs, and skills that can be shared across repositories. this repo (`rhachet-roles-bhrain`) is a rhachet roles package that:
1. defines roles (e.g., `reviewer`, `thinker`)
2. publishes to npm for consumption by other repos
3. uses symlinks in `.agent/` to expose roles locally during development

---

## build pipeline

### `npm run build`

runs three steps:
1. `build:clean` - removes `dist/`
2. `build:compile` - compiles typescript via `tsc` + `tsc-alias`
3. `build:complete` - copies non-ts assets to `dist/` via rsync

### `build:complete` rsync

the rsync command selectively copies assets from `src/` to `dist/`:

**includes:**
- `**/briefs/**/*.md` - markdown briefs
- `**/skills/**/*.sh` - shell skills
- `**/skills/**/*.jsonc` - jsonc skill configs
- `**/skills/**/*.ts` - typescript skills (source files for dynamic execution)
- `**/*.template.md` - template files

**excludes:**
- `**/.route/**` - route scratch directories
- `**/.scratch/**` - scratch directories
- `**/.behavior/**` - behavior directories
- `**/*.test.sh` - shell test files
- `**/*.test.ts` - typescript test files

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

cause: `.ts` files not included in `build:complete` rsync

fix: add to `package.json` `build:complete`:
```
--include='**/skills/**/*.ts' --include='**/skills/*.ts'
```

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
2. **rsync controls what goes to `dist/`** - update `build:complete` to include new file types
3. **`.agent/` is generated** - don't edit `.agent/` directly; edit `src/` and rebuild
4. **briefs go in `src/roles/<role>/briefs/`** - will be symlinked via rhachet
5. **skills go in `src/roles/<role>/skills/<skill>/`** - entrypoint is `<skill>.ts` or `<skill>.sh`
