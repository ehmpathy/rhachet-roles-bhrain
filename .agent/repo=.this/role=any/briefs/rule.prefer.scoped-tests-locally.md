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

### two levers cut the local cost — use both

**1. `path://` prunes the file set; `name://` does not.** jest imports every suite it
loads *before* it filters by test name. so a `name://` scope still loads all ~100 blackbox
files (each a real import), then runs only the named test — you pay the whole load. a
`path://` scope prunes the FILE set first, so jest loads only the one file. measured on the
guard-peer seam: `name://guard-peer` loaded 101 files in 695s; `path://review.by.guard-peer`
loaded 1 file in 104s — a ~6.7× cut for the identical assertion. **reach for `path://`
first; add `name://` only to narrow further *within* the file that path has already pruned.**

**2. `criteria: 'SOME'` stops at the first green attempt.** `when.repeatably({ criteria })`
short-circuits: with `'SOME'` the moment one attempt passes, the rest are skipped
(`🫧 [skipped] prior repeatably attempt passed`), so a green test costs 1 LLM call, not 3.
`'EVERY'` runs all 3 (it needs every attempt green). while you iterate locally, `'SOME'`
gives a 3× cut on the green path. this trades away the flake-detection `'EVERY'` buys — a
worthwhile trade for a fast local loop, but the CI gate should still exercise the repeated
attempts (`rule.require.repeatable-for-llm-tests`).

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

## .the resnap footgun — `--resnap` + `name://` prunes unrelated snapshots

`--resnap` runs `jest --updateSnapshot`, which does more than write NEW snapshots — it also
**prunes any snapshot jest deems obsolete** in every suite it LOADED. combine that with a
`name://` scope (which, per lever 1, loads ALL ~100 files) and the blast radius is total:
jest loads a hundred suites, runs only your named test, then deletes "obsolete" snapshots
across the ninety-nine you never intended to touch — a silent coverage regression in files
far from your change.

this is a real incident: a `--resnap --scope 'name://...'` run loaded the whole blackbox
suite and pruned 471 snapshot cases from three unrelated `driver.route.*` suites. the cases
were gone with no test failure — the regression only surfaced on a later `git status`.

the guard:

- **never pair `--resnap` with `name://`.** always resnap under a `path://` scope, so jest
  loads only the file you mean to rewrite and can prune only its snapshots
- after any resnap, `git status` / `git diff --stat` the `__snapshots__/` dir and confirm
  only the intended files changed — an unexpected `.snap` in the diff is a pruned regression
- to restore a pruned snapshot, rewrite the file to its index bytes (the committed version
  is the source of truth); a resnap will not bring pruned cases back

## .enforcement

- an unscoped / `--thorough` whole-suite run locally, as you iterate = **nitpick**
  (prefer a scope; let cicd carry the blast radius)
- a push that skips the full sharded cicd suite = **nitpick**
  (the full suite is the gate; do not treat scoped-only as sufficient coverage)
- `--resnap` under a `name://` (or unscoped) run = **blocker**
  (it prunes obsolete snapshots across every loaded suite — always resnap under `path://`)
