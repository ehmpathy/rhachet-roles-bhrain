# self-review: has-divergence-addressed (r3)

## stone
5.2.evaluation.v1

## question
did I address each divergence properly?

## answer
yes. all divergences are properly addressed — either repaired or backed up with sound rationale.

## method

1. read evaluation's divergence analysis section
2. for each divergence, run verification commands and read implementation files
3. for each backup, question the rationale skeptically
4. document the evidence with actual command output and line numbers

---

## fresh verification: git ls-files src/contract/cli/*.ts

```
src/contract/cli/goal.ts       ← achiever CLI (new)
src/contract/cli/index.ts
src/contract/cli/reflect.ts    ← reviewer CLI
src/contract/cli/research.ts
src/contract/cli/review.ts     ← reviewer CLI
src/contract/cli/route.ts      ← driver CLI
```

## fresh verification: glob src/domain.roles/achiever/inits/**/*

```
src/domain.roles/achiever/inits/init.claude.sh
src/domain.roles/achiever/inits/init.claude.hooks.sh
src/domain.roles/achiever/inits/claude.hooks/userpromptsubmit.ontalk.sh
```

## fresh verification: git ls-files blackbox/achiever.*.acceptance.test.ts

```
blackbox/achiever.goal.lifecycle.acceptance.test.ts
blackbox/achiever.goal.triage.acceptance.test.ts
```

---

## divergence 1: CLI consolidation

**type:** accepted change

**blueprint declared:**
```
src/domain.roles/achiever/skills/
├── goal.memory.set.cli.ts
├── goal.memory.get.cli.ts
└── goal.infer.triage.cli.ts
```

**actual implementation:**
```
src/contract/cli/goal.ts
```

**verification:**

checked extant pattern via git ls-files:

```
src/contract/cli/review.ts     # reviewer role CLI
src/contract/cli/reflect.ts    # reviewer role CLI
src/contract/cli/route.ts      # driver role CLI
src/contract/cli/goal.ts       # achiever role CLI (new)
```

no `.cli.ts` files exist in any `skills/` directory. consolidation follows established convention.

**skeptical question:** is this just laziness?

no. the consolidation provides benefits:
1. enables isolated subpath exports (`rhachet-roles-bhrain/cli/goal`)
2. avoids OOM per rule.require.isolated-cli-subpath-exports
3. follows codebase convention established by reviewer and driver roles

**conclusion:** sound rationale. accepted.

---

## divergence 2: inits/ directory addition

**type:** accepted addition

**blueprint declared:** no inits/ directory

**actual implementation:**
```
src/domain.roles/achiever/inits/
├── init.claude.sh                             # role init entrypoint
├── init.claude.hooks.sh                       # adds UserPromptSubmit to settings.json
└── claude.hooks/
    └── userpromptsubmit.ontalk.sh             # onTalk hook handler
```

**verification via file reads:**

**getAchieverRole.ts lines 21-36:**
```ts
hooks: {
  onBrain: {
    // onStop: enforce goal triage before session ends
    // halts until all asks are covered by goals
    onStop: [
      {
        command:
          './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop',
        timeout: 'PT10S',
      },
    ],
    // onTalk: implemented via init executable (inits/init.claude.hooks.sh)
    // rhachet's Role.build() only supports onBoot, onTool, onStop
    // the init adds UserPromptSubmit hook directly to settings.json
    // run: npx rhachet roles init --role achiever
  },
},
```

**init.claude.hooks.sh lines 32-34:**
```bash
HOOK_COMMAND="./node_modules/.bin/rhachet run --repo bhrain --role achiever --init claude.hooks/userpromptsubmit.ontalk"
HOOK_AUTHOR="repo=bhrain/role=achiever"
```

**init.claude.hooks.sh lines 84-92 (jq hook injection):**
```bash
.hooks.UserPromptSubmit += [{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": $cmd,
    "timeout": 5,
    "author": $author
  }]
}]
```

**userpromptsubmit.ontalk.sh lines 25-29:**
```bash
# invoke triage in onTalk mode
# exits 0 regardless of outcome (does not halt)
./node_modules/.bin/rhx goal.infer.triage --mode hook.onTalk || true

exit 0
```

the vision required onTalk hook. rhachet Role.build() only supports onBoot, onTool, onStop — no onTalk.

the init workaround achieves the goal:
- `npx rhachet roles init --role achiever` runs init.claude.hooks.sh
- init.claude.hooks.sh uses jq to add UserPromptSubmit hook to `.claude/settings.json`
- the hook command runs userpromptsubmit.ontalk.sh on each user message
- the handler invokes `goal.infer.triage --mode hook.onTalk` to accumulate asks

**skeptical question:** is this just avoidance of proper rhachet integration?

no. the abstraction doesn't support onTalk. the init pattern is the standard rhachet mechanism for role-specific configuration that exceeds Role.build() scope. this works with the system, not around it.

**conclusion:** necessary addition to achieve vision. accepted.

---

## divergence 3: acceptance test names

**type:** cosmetic, accepted

**blueprint declared:**
```
goal.triage.play.acceptance.test.ts
goal.lifecycle.play.acceptance.test.ts
```

**actual implementation:**
```
achiever.goal.triage.acceptance.test.ts
achiever.goal.lifecycle.acceptance.test.ts
```

**verification:**

checked extant pattern:
- reviewer role tests use `reviewer.*.acceptance.test.ts` pattern
- the `achiever.` prefix follows this convention
- `.play` was dropped as unnecessary

**skeptical question:** does the name change matter?

no. the tests exist and cover the same functionality. the names follow repo convention for role-specific tests.

**conclusion:** cosmetic divergence. functionally equivalent. accepted.

---

## divergence 4: im_a.bhrain_owl.md

**type:** minor, accepted

**blueprint declared:** symlink to driver/briefs/

**actual implementation:** file created (verified present in git ls-files)

**verification:**

the file exists and serves the purpose. whether it's a symlink or a file doesn't affect functionality.

**skeptical question:** should it be a symlink for DRY?

possibly, but not a blocker. the content is the owl persona brief which is reusable. if the driver brief changes, this would need manual sync. however, for v1 this is acceptable — symlink can be added in a future iteration.

**conclusion:** minor divergence. accepted for v1.

---

## non-issues: why they hold

**CLI consolidation is genuine improvement:**
- git ls-files shows `goal.ts` alongside `review.ts`, `reflect.ts`, `route.ts` in `src/contract/cli/`
- no `.cli.ts` files exist in any `skills/` directory (verified via glob)
- the consolidation enables isolated subpath exports and follows extant convention

**inits/ addition enables vision:**
- glob confirms all 3 files exist in `src/domain.roles/achiever/inits/`
- init.claude.hooks.sh (106 lines) fully implements UserPromptSubmit hook configuration
- userpromptsubmit.ontalk.sh (30 lines) invokes the triage skill in onTalk mode
- this is the correct pattern to extend beyond Role.build() scope

**both hooks are implemented:**
- onStop: getAchieverRole.ts lines 25-31 declares the hook via Role.build()
- onTalk: init executable + UserPromptSubmit hook handler implements the behavior
- the init workaround is documented in getAchieverRole.ts lines 32-35

**acceptance tests exist:**
- blackbox/achiever.goal.lifecycle.acceptance.test.ts
- blackbox/achiever.goal.triage.acceptance.test.ts
- names follow `achiever.*` convention (same as `reviewer.*` pattern)

the "no ask forgotten" promise is achievable in v1. both hooks are implemented.

---

## conclusion

all divergences properly addressed:

| divergence | type | resolution | valid? |
|------------|------|------------|--------|
| CLI consolidation | accepted change | follows extant pattern | yes |
| inits/ directory | accepted addition | enables onTalk workaround | yes |
| test names | cosmetic | follows role name convention | yes |
| owl brief | minor | file vs symlink, functional equivalent | yes |

no issues found. all backups have sound rationale.

