# rule.prefer.scoped-tests-locally

## .what

run **scoped** tests locally, for fast feedback. run **blast-radius** (large-scope,
`--thorough`, or whole-suite) tests on cicd, where shards parallelize them.

- local iteration → always `--scope 'path://…'` or `--scope 'name://…'`
- full coverage → let cicd carry it (cicd shards the suite across runners)

## .why

acceptance and integration tests are **real-brain, no-mock** by rule
(`rule.forbid.acceptance.mocks`, `rule.forbid.integration.mocks`). their cost is
dominated by real LLM latency, not test logic:

- one real `review` / `reflect` / `choice.ask` call is seconds to tens of seconds
- each blackbox step spawns a real `rhx` CLI subprocess (node cold-start per step)
- `when.repeatably` runs `attempts: 3`; locally the criteria is `EVERY`, so a
  repeatable test makes **3× the LLM calls** (`rule.require.repeatable-for-llm-tests`)

so a whole acceptance suite runs serially in the tens of minutes locally — a feedback
loop far too slow to iterate against. cicd absorbs that cost via shards: it splits the
suite across parallel runners, so wall-clock stays low even as the suite grows.

the split of labor:

| run | where | why |
|-----|-------|-----|
| scoped (one file / one case) | local | fast feedback while you build |
| blast-radius (`--thorough`, whole suite, cross-suite regression) | cicd | shards → parallel → fast, and it's the real gate anyway |

## .how

### local — always scope

```sh
# by path fragment (a file or dir)
rhx git.repo.test --what acceptance --scope 'path://driver.route.myfeature.journey' --mode apply

# by test/describe name
rhx git.repo.test --what unit --scope 'name://myFeature'

# stack path + name for the tightest loop
rhx git.repo.test --what integration --scope 'path://myfeature' --scope 'name://case3' --mode apply
```

start narrow, then widen scope only as needed
(`path://feature.case3` → `path://feature` → `name://case3`). reach the full suite only
by a push to cicd, not by a whole-suite run on your own machine.

### cicd — blast radius, sharded

let the pipeline run the unscoped / `--thorough` suite. do not reproduce that whole run
locally to "be sure" — that is what the sharded cicd gate exists for.

## .the trap

a loose scope silently falls through to "all". e.g. a hyphenated
`--scope 'path://peer-measurement'` can match the whole blackbox suite (90 files) instead
of the one journey. always confirm the `matched: N files` line narrowed to what you
intended before you wait on a run.

## .enforcement

- an unscoped / `--thorough` whole-suite run locally, as you iterate = **nitpick**
  (prefer a scope; let cicd carry the blast radius)
- a push that skips the full sharded cicd suite = **nitpick**
  (the full suite is the gate; do not treat scoped-only as sufficient coverage)
