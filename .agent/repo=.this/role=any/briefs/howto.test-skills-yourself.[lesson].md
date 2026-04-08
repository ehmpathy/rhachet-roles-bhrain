# howto: test skills yourself

## .what

before you claim a skill works, you must test it yourself. not via acceptance tests alone — via the actual shell skill invocation.

## .why

- acceptance tests run in sandboxed temp directories
- manual CLI verification uses real repo state
- you must experience what the user will experience
- "i ran the tests" is not "i ran the skill"

## .how

### 1. build and link

```sh
npm run build && npx rhachet roles link --role $role
```

this creates `.agent/repo=bhrain/role=$role/skills/` symlinks to `dist/`.

### 2. invoke the skill

after link, skills are available via `rhx` (shorthand for `npx rhachet run --skill`).

```sh
# example: achiever role
rhx goal.memory.set --scope repo

# example: with stdin
cat <<'EOF' | rhx goal.memory.set --scope repo
slug: my-goal
why:
  ask: do this
  purpose: verification
  benefit: confidence
what:
  outcome: it is done
how:
  task: run the command
  gate: output matches expected
status:
  choice: enqueued
  reason: manual test
source: peer:human
EOF
```

### 3. verify expected outcome

- check exit code (0 = success)
- check stdout shows expected output
- check filesystem for created files
- check state changes (flags, artifacts)

### 4. clean up

remove any artifacts created in manual verification:

```sh
rm -rf .goals/$(git branch --show-current)
```

## .antipattern

```sh
# bad: tsx instead of the skill
npx tsx src/contract/cli/goal.ts goal.memory.set --scope repo

# bad: "tests pass" claim without skill invocation
npm run test:acceptance:locally -- blackbox/achiever
# "all tests pass" is not "i tested the skill"
```

## .the rule

acceptance tests + manual skill invocation = verified.

acceptance tests alone = not verified.

