# acceptance test flow for rhachet-roles-bhrain

## what

acceptance tests verify the full skill invocation flow as real agents experience it:

```
temp fixture dir/
├── src/, rules/, etc.        # cloned fixture assets
└── .agent/
    └── repo=bhrain/
        └── role=reviewer/
            └── skills/
                └── review.sh  # symlink → node_modules/.../dist/
```

## why

the tests intentionally exercise the full `rhachet roles link` workflow because:

1. **tests what agents actually call** — agents invoke skills via `.agent/` symlinks, not dist/ directly
2. **validates symlink resolution** — ensures the shell entrypoint resolves paths correctly from symlink location
3. **catches integration bugs** — like the `node -e` argv parsing issue where `process.argv` lacks an entrypoint path
4. **proves the published package works** — the `node_modules/rhachet-roles-bhrain` symlink simulates an installed package

## how

### test infrastructure

```
blackbox/
├── .test/
│   ├── assets/
│   │   └── codebase-mechanic/     # fixture: rules, src files
│   └── invokeReviewSkill.ts       # helper to invoke skill via shell
├── review.representative-*.ts     # tests clean/dirty code detection
└── review.failfast-*.ts           # tests validation errors
```

### the flow

1. **clone fixture to temp dir**
   ```ts
   const tempDir = genTempDir({ slug: 'review-test', clone: ASSETS_DIR });
   ```

2. **link the reviewer role via rhachet**
   ```ts
   await execAsync('npx rhachet roles link --role reviewer', { cwd: tempDir });
   ```
   this creates `.agent/repo=bhrain/role=reviewer/skills/` symlinks

3. **invoke the skill via shell entrypoint**
   ```ts
   const skillPath = path.join(tempDir, '.agent/repo=bhrain/role=reviewer/skills/review.sh');
   const cmd = `bash "${skillPath}" --rules "..." --paths "..." --output "..."`;
   await execAsync(cmd, { cwd: tempDir });
   ```

4. **assert on cli output and generated files**
   ```ts
   expect(cli.code).toEqual(0);
   expect(reviewContent).toContain('blocker');
   ```

### symlink chain

```
.agent/repo=bhrain/role=reviewer/skills/
    → node_modules/rhachet-roles-bhrain/dist/domain.roles/reviewer/skills/
    → (symlink via "rhachet-roles-bhrain": "link:." in package.json)
    → repo-root/dist/domain.roles/reviewer/skills/
```

the `link:.` protocol in package.json makes `node_modules/rhachet-roles-bhrain` a symlink to repo root, so `dist/` always reflects the latest build.

### shell → node invocation

the skill shell entrypoint (`review.sh`) invokes the js module:

```bash
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node -e "import('$SKILL_DIR/review.cli.js').then(m => m.review())" -- "$@"
```

note: `node -e` mode means `process.argv` lacks an entrypoint path, so `review.cli.ts` detects this via `isNodeEvalMode()` to parse args correctly.

## key files

| file | purpose |
|------|---------|
| `blackbox/.test/invokeReviewSkill.ts` | helper to invoke skill and capture stdout/stderr/code |
| `blackbox/.test/assets/codebase-mechanic/` | fixture with rules and source files |
| `src/domain.roles/reviewer/skills/review.sh` | shell entrypoint for the skill |
| `src/domain.roles/reviewer/skills/review.cli.ts` | node entrypoint with arg parsing |

## summary

acceptance tests prove the skill works as agents would use it — through the full `rhachet roles link` → symlink → shell → node chain. this catches integration issues that unit tests would miss.
