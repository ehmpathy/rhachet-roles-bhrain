# how acceptance tests work in rhachet-roles-bhrain

## overview

acceptance tests verify the full `rhachet roles link` workflow end-to-end. this requires careful coordination between three directories:

```
repo root/
├── dist/                          # built output (skills, briefs)
├── node_modules/
│   └── rhachet-roles-bhrain/      # symlink to repo root via `link:.`
└── .temp/
    └── review-rep-clean-xyz/      # temp test directory
        └── .agent/
            └── repo=bhrain/
                └── role=reviewer/
                    └── skills/    # symlink created by `rhachet roles link`
```

---

## the three directories

### 1. `dist/` — built output

contains compiled typescript and copied assets:
- `dist/domain.roles/reviewer/skills/review.sh` — skill entrypoint
- `dist/domain.roles/reviewer/skills/review.ts` — skill implementation
- `dist/domain.roles/reviewer/briefs/` — role briefs

created by `npm run build`, which:
1. compiles typescript via `tsc`
2. copies non-ts assets via `rsync` (briefs, skills, readme.md)

### 2. `node_modules/rhachet-roles-bhrain` — package symlink

**critical**: must be a symlink to repo root, not a copy.

in `package.json`:
```json
"devDependencies": {
  "rhachet-roles-bhrain": "link:."
}
```

this makes `node_modules/rhachet-roles-bhrain` → `..` (repo root)

why symlink matters:
- `rhachet roles link` resolves skills via `node_modules/rhachet-roles-bhrain/dist/`
- if pnpm copied files at install time (via `file:.`), `dist/` would be empty
- symlink ensures `dist/` always resolves to the actual built output

### 3. `.temp/` — test directories

`genTempDir({ clone: ASSETS_DIR })` creates isolated test environments:
- copies fixture files (rules, source code)
- each test gets a fresh directory
- `rhachet roles link` creates `.agent/` symlinks inside

---

## the flow

### at install time

```
pnpm install
  └── resolves "rhachet-roles-bhrain": "link:."
  └── creates symlink: node_modules/rhachet-roles-bhrain → ..
```

### at build time

```
npm run build
  └── compiles src/ → dist/
  └── copies briefs, skills to dist/
```

### at test time

```
npm run test:acceptance:locally
  └── npm run build (ensures dist/ exists)
  └── jest runs tests
      └── genTempDir({ clone: ASSETS_DIR })
          └── creates .temp/review-rep-clean-xyz/
          └── copies fixture files
      └── execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir })
          └── rhachet looks up "bhrain" package in node_modules
          └── finds node_modules/rhachet-roles-bhrain (symlink to repo root)
          └── reads dist/domain.roles/reviewer/
          └── creates .agent/repo=bhrain/role=reviewer/skills → symlink to dist/
      └── invokeReviewSkill({ cwd: tempDir })
          └── runs .agent/repo=bhrain/role=reviewer/skills/review.sh
          └── skill imports from rhachet-roles-bhrain package
          └── resolves to node_modules/rhachet-roles-bhrain/dist/
```

---

## why `link:.` instead of `file:.`

| protocol | behavior | problem |
|----------|----------|---------|
| `file:.` | pnpm COPIES package at install time | `dist/` doesn't exist yet → empty copy |
| `link:.` | pnpm creates SYMLINK to repo root | always resolves to current `dist/` |

### the ci timeline problem with `file:.`

1. `git clone` — `dist/` absent (gitignored)
2. `pnpm install` — copies `dist/` → but it's empty!
3. `npm run build` — creates `dist/` at repo root
4. `npm run test:acceptance` — `rhachet roles link` points to empty copy

### the fix with `link:.`

1. `git clone` — `dist/` absent
2. `pnpm install` — creates symlink to repo root
3. `npm run build` — creates `dist/` at repo root
4. `npm run test:acceptance` — symlink resolves to actual `dist/` ✓

---

## key files

| file | purpose |
|------|---------|
| `package.json` | `"rhachet-roles-bhrain": "link:."` enables symlink |
| `blackbox/.test/invokeReviewSkill.ts` | `execAsync` utility for shell commands |
| `blackbox/review.*.acceptance.test.ts` | acceptance tests via the full flow |
| `blackbox/.test/assets/codebase-mechanic/` | fixture files cloned to temp dirs |

---

## debug tips

### verify node_modules symlink

```sh
ls -la node_modules/rhachet-roles-bhrain
# should show: rhachet-roles-bhrain -> ..
```

### verify dist exists after build

```sh
ls dist/domain.roles/reviewer/skills/
# should show: review.sh, review.ts, etc.
```

### verify .agent symlinks in temp dir

```sh
ls -la .temp/*/. agent/repo=bhrain/role=reviewer/
# should show symlinks to node_modules/.../dist/
```

---

## summary

the acceptance test setup ensures we test the real `rhachet roles link` workflow:

1. **`link:.` protocol** — node_modules symlinks to repo root
2. **`npm run build`** — creates dist/ with skills and briefs
3. **`rhachet roles link`** — creates .agent/ symlinks in temp dirs
4. **skill invocation** — resolves through the full symlink chain

this setup mirrors how consumers use the package. it provides confidence that the published package works correctly.
