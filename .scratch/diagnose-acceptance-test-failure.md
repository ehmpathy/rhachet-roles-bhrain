# diagnosis: acceptance test ci failure

## timeline: ci execution

### ci step 1: install dependencies
```yaml
# .github/workflows/.install.yml
pnpm install --frozen-lockfile --ignore-scripts
```
note: `--ignore-scripts` means no postinstall/prepare scripts run

### ci step 2: run test:acceptance
```yaml
# .github/workflows/.test.yml line 369
run: THOROUGH=true npm run test:acceptance --if-present
```

which expands to:
```bash
npm run build && jest -c ./jest.acceptance.config.ts ...
```

### ci step 3: npm run build
builds `dist/` from `src/`:
- compiles typescript
- copies briefs/skills to dist
- runs `rhachet repo introspect`

### ci step 4: jest runs test file

## timeline: test execution

### test step 1: clone fixture to temp dir
```ts
const tempDir = genTempDir({ slug: 'review-rep-clean', clone: ASSETS_DIR });
```

creates: `/tmp/review-rep-clean.{hash}/`

contents after clone:
```
/tmp/review-rep-clean.{hash}/
├── rules/
│   └── *.md
└── src/
    ├── clean.ts
    └── dirty.ts
```

note: NO package.json, NO node_modules, NO .agent/, NO rhachet.repo.yml

### test step 2: run rhachet roles link
```ts
await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });
```

question: how does `rhachet roles link --role reviewer` find the reviewer role when:
- tempDir has no package.json
- tempDir has no node_modules
- tempDir has no rhachet.repo.yml

repo's `rhachet.repo.yml` defines:
```yaml
slug: bhrain
roles:
  - slug: reviewer
    skills:
      dirs: dist/domain.roles/reviewer/skills
```

### test step 3: invoke review skill
```ts
const skillPath = path.join(input.cwd, '.agent/repo=bhrain/role=reviewer/skills/review.sh');
```

expects: `tempDir/.agent/repo=bhrain/role=reviewer/skills/review.sh` to exist

## the question

when `npx rhachet roles link --role reviewer` runs in tempDir:
- tempDir has no package.json
- tempDir has no node_modules
- tempDir has no rhachet.repo.yml

how does rhachet discover the `reviewer` role to link it?

## hypotheses

### hypothesis 1: rhachet searches up parent directories
rhachet might walk up the directory tree to find a rhachet.repo.yml or node_modules.

if true locally: would find repo's node_modules
if true on CI: would also find repo's node_modules (test runs from repo checkout)

### hypothesis 2: rhachet uses global npm/npx resolution
`npx rhachet` resolves rhachet from the repo's node_modules, and rhachet then searches its own package's dependencies.

### hypothesis 3: rhachet uses cwd's node_modules only
rhachet only searches the cwd's node_modules, and the command silently fails when no package is found.

## data needed

1. what does `npx rhachet roles link --role reviewer` actually do when run in a temp dir?
2. does it produce output or error when it can't find the role?
3. what's different between local and CI environment?

## ci error

```
ENOENT: no such file or directory, open '.../review-rep-clean.f6c979a7/review-representative-clean.md'
bash: .../review-rep-clean.f6c979a7/.agent/repo=bhrain/role=reviewer/skills/review.sh: No such file or directory
```

this confirms: `.agent/` was NOT created in tempDir on CI.

## root cause identified

### the problem: pnpm `file:.` self-reference time sequence

package.json line 102:
```json
"devDependencies": {
  "rhachet-roles-bhrain": "file:.",
}
```

package.json lines 18-21:
```json
"files": [
  "/dist",
  "rhachet.repo.yml"
]
```

### timeline on ci (failure)

1. `git clone` - repo cloned, but `dist/` is gitignored → NOT present
2. `pnpm install --frozen-lockfile --ignore-scripts`
   - creates `node_modules/.pnpm/rhachet-roles-bhrain@file+.../`
   - copies `dist/` from repo root → BUT dist/ doesn't exist yet
   - result: `node_modules/.pnpm/.../dist/` is empty or absent
3. `npm run build` - creates `dist/` at repo root
4. jest runs test
5. `genTempDir` creates `.temp/2026-.../`
6. `rhachet roles link --role reviewer` creates symlinks:
   ```
   .temp/.../.agent/repo=bhrain/role=reviewer/skills
     -> ../../../../../node_modules/.pnpm/.../dist/domain.roles/reviewer/skills
   ```
7. symlink points to empty/absent directory from step 2!

### timeline locally (success)

1. `pnpm install` ran previously when `dist/` existed (from prior builds)
2. `node_modules/.pnpm/.../dist/` has files from that install
3. test runs, symlinks resolve to the populated directory

### key insight

pnpm copies `file:.` referenced packages at install time. on CI, `dist/` doesn't exist at install time because:
- `dist/` is gitignored
- build happens AFTER install

### solutions

option 1: run build before pnpm install
- pre-build dist/ before install deps
- ensures `file:.` reference finds dist/

option 2: avoid self-reference for acceptance tests
- change how the test discovers the reviewer role
- use the repo's dist/ directly instead of via node_modules

option 3: use pnpm workspace protocol instead of file:.
- `"rhachet-roles-bhrain": "workspace:*"`
- may have different copy-vs-link behavior

## solution implemented

chose option 2: create `.agent/` symlinks directly in the test

changed `blackbox/review.representative-clean.acceptance.test.ts`:
```ts
// before: relied on rhachet roles link (fails on CI)
await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });

// after: create symlinks directly to repo's dist/
const agentRolePath = path.join(tempDir, '.agent/repo=bhrain/role=reviewer');
await fs.mkdir(agentRolePath, { recursive: true });
await fs.symlink(
  path.join(REPO_ROOT, 'dist/domain.roles/reviewer/skills'),
  path.join(agentRolePath, 'skills'),
);
```

this works because:
- `npm run build` runs before jest (part of `test:acceptance` command)
- symlinks point directly to repo's `dist/`, not to node_modules copy
- avoids the pnpm `file:.` time sequence issue entirely
