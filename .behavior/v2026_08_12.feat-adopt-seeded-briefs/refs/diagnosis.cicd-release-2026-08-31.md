# diagnosis: the 2026-08-31 release run, evidence as measured

**why this file exists:** the diagnosis below was held in a session at 2% before auto-compact. a
summary preserves conclusions and drops the evidence beneath them, so the next reader would
re-derive what was already known. the ids, timings, and checked negatives are the part that decays.

---

## .the two failure waves, in order

### wave 1 — RESOLVED: unpinned github actions

**run ids:** `33382442005` (suite) · `33382449631` (github/install) · `33382449016` (pullreq-title)

all 4 checks failed at **6–11s**, before any test ran:

```
The action actions/checkout@v4 is not allowed in ehmpathy/rhachet-roles-bhrain
because all actions must be pinned to a full-length commit SHA.
```

**not caused by this branch.** main's last successful run was **2026-08-06** — 25 days prior. the
org enabled the pin policy in that window, and this PR is simply the first run since.

**the fix, and where it came from:** `declapract-typescript-ehmpathy` had already solved it in its
`v2026_08_06.fix-workflow-sha-pins` behavior. **every sha was copied from that repo's
`src/practices/cicd-common/best-practice/.github/workflows/`, never derived here.**

| action | tag | sha |
|---|---|---|
| `actions/checkout` | v4 | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/setup-node` | v4 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/cache/restore` | v4 | `0057852bfaa89a56745cba8c7296529d2fc39830` |
| `actions/cache/save` | v4 | `0057852bfaa89a56745cba8c7296529d2fc39830` |
| `pnpm/action-setup` | v4 | `b906affcce14559ad1aafd4ab0e942779e9f58b1` |
| `actions/create-github-app-token` | v2 | `fee1f7d63c2ff003460e3d139729b119787bc349` |
| `actions/upload-artifact` | v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `actions/download-artifact` | v4 | `d3f86a106a0bac45b974a628896c90dbdf5c8093` |
| `aws-actions/configure-aws-credentials` | v4 | `7474bc4690e29a8392af63c5b98e7449536d5c3a` |
| `hashicorp/setup-terraform` | v3 | `b9cd54a3c349d3f38e8881555d616ced269862dd` |
| `amannn/action-semantic-pull-request` | v5 | `e32d7e603df1aa1ba07e981f2a23455dee596825` |

**46 references pinned across 6 files.** 46 = 53 total `uses:` minus the 7 local `./.github/...`
refs, which need no pin. that arithmetic is the completeness check.

⇒ **confirmed resolved:** the next run reached the real suite — 38 checks, where wave 1 never got
past setup.

---

## ✅ WAVE 2 WAS RIGHT — and wave 3's retraction of it was the actual error

**`FIREWORKS_API_KEY` is stale in CI. rotate it.** wave 3 below retracted that conclusion, and the
retraction rested on **a misread of a truncated job name**. the correction sits at the end of wave
3 — read it before you act on a word wave 3 says.

---

## 🔴 wave 2 — the 401, as measured (conclusion superseded)

**run id:** `33383053039`

| job id | check |
|---|---|
| `99459613546` | `test-shards-integration` (explicit, 1) — `stepReflect.casePriorRules.*` |
| `99459613569` | `test-shards-integration` (explicit, 3) — `stepReflect.caseTypescriptQua…` |
| `99459613434` | `test-shards-integration` (explicit, 4) — `stepReflect.caseProseAuthor.*` |
| `99459613285` | `test-shards-acceptance` (explicit, 4) — `blackbox/review.refs-single.acceptance.test.ts` |

**34 of 38 checks passed** — `test-unit`, `test-types`, `test-format`, `test-commits` among them.

### ✅ the measured cause — read from the logs, 2026-08-31

```
401 Unauthorized
  at OpenAI.makeStatusError  (openai@5.8.2/src/client.ts:425)
  at BrainAtom.ask           (rhachet-brains-fireworksai@0.1.6/…/genBrainAtom.ts:189)
  at Object.operation        (src/domain.operations/reflect/stepReflect.ts:245)
```

the default brain for these cases is **fireworks/deepseek**, and fireworks **rejects the key**.

🔴 **the secret REACHES the runner and is still refused.** the job env logs
`FIREWORKS_API_KEY: ***` — so this is not an absent secret, it is a **stale or revoked** one. that
distinction decides the fix: nobody has to add a secret; somebody has to **rotate** one.

⇒ **class: `constraint`, never `malfunction`.** the process rendered a verdict — *"this credential
is refused"* — with a named fix. per `term=route.guard.review.malfunction`, a malfunction is a
process that rendered **no** verdict at all. and per `rule.require.exit-code-semantics` a rejected
credential is exit 2, caller-must-fix.

### 🔴 the 34s was setup overhead, and the whole "uniform duration" inference was wrong

the acceptance shard reports `Time: 4.71 s` and the integration shard failed at `elapsed: 0s`.
**the tests ran in seconds; the 34s is checkout + setup-node + cache-restore.** every shard in this
matrix pays the same setup, which is exactly why four independent jobs agreed to three significant
figures.

⇒ ⚠️ **the agreement was real and the inference from it was not.** *"independent failures do not
agree on a duration"* silently assumed the duration measured the failure. it measured the job. a
shared prefix of work produces a shared duration with no shared cause at all.

**keep this, because the logic is what generalizes:** a coincidence across parallel jobs in one
matrix is weak evidence, since matrix jobs share their whole setup path by construction. the same
coincidence across **different workflows** would have been strong. read the durations the runner
reports **for the test**, never the ones it reports for the job.

### ⚠️ the acceptance failure is a SEPARATE shape — do not fold it in

`review.refs-single.acceptance` is `when.repeatably`, 3 attempts:

| attempt | verdict | duration |
|---|---|---|
| 1 | ✓ all four assertions | 1047 ms |
| 2 | ✓ all four assertions | 1019 ms |
| 3 | ✕ all four assertions | 1004 ms |

two attempts passed. so this is **not** a uniformly dead credential — it is a flake on one attempt.

🔴 **and it should not have failed the suite.** `REPEATABLE_CONFIG` sets
`criteria: process.env.CI ? 'SOME' : 'EVERY'` — under `SOME`, one attempt that passes is a pass.
jest still counted the 4 failed cases and exited 1, so **the `SOME` criterion did not protect the
run**. that is a defect in the repeatable harness, independent of any credential, and it is owed a
dream.

⚠️ **the reported error is a mask.** all four failures print
`UnexpectedCodePathError: useThen: tried to access value before test ran` at line 75 — the proxy
getter, not the throw site. the `useThen` body threw, the proxy swallowed it, and every downstream
`then` reports the proxy's complaint instead of the cause. **that is `rule.forbid.failhide` at the
harness layer**, and it is why attempt 3's real error is unreadable.

### ✅ the checked negative — do not re-walk it

a peer repo in the fleet, `rhachet-brains-anthropic@feat-frontier-claude-models`, reports
`ANTHROPIC_API_KEY` absent from **its** `.agent/keyrack.yml`, and names that absence as why its CI
missed defects.

**that cause does not apply here.** this repo's `.agent/keyrack.yml` declares it:

```yaml
env.test:
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY
  - TAVILY_API_KEY
  - XAI_API_KEY
  - FIREWORKS_API_KEY
```

⚠️ **the manifest is not the secret**, and the job env confirms every one of the five reaches the
runner as `***`. so **both halves are verified** — the keys are declared AND injected.

🔴 **the lead was directionally right and named the wrong key.** the dead credential here is
**`FIREWORKS_API_KEY`**, not `ANTHROPIC_API_KEY`, and it fails **rejected** rather than **absent**.
two different failure modes, one family: *a stale LLM-provider secret in CI*.

⇒ **that is worth more than the near-miss suggests.** two repos in one fleet, in one week, both
blinded by an LLM-provider credential. the pattern is a fleet-level hazard, and neither repo has a
check that says *"the key is present AND the provider accepts it"* before a suite depends on it.

### 🔴 .what this needs — human-fixable, and here is the exact command

a driver cannot rotate a repo secret. per `rule.always.diagnose-reviewer-malfunctions`, surface the
command rather than the symptom:

```sh
# ✅ step 1 — RUN, and it PASSED. see below
rhx keyrack unlock --owner ehmpath --env test
rhx git.repo.test --what integration --scope 'path://stepReflect.casePriorRules' --mode apply

# 🔴 step 2 — the human's, a driver cannot write a repo secret
gh secret set FIREWORKS_API_KEY --repo ehmpathy/rhachet-roles-bhrain

# step 3 — rerun only the failed jobs
rhx git.release --retry
```

### ✅ step 1's result — the branch that was open is now closed

**the very test CI failed on passes locally: 15 tests, 2 suites, 0 failed, 175s.**

⇒ **the key is valid at fireworks. only CI's copy is dead.** so step 2 is a **re-sync of a working
value**, never a request for a new key from the provider.

⚠️ **that branch was the whole reason step 1 exists**, and the two cases are indistinguishable from
the CI log alone. had the local run also returned 401, `gh secret set` would have pushed a dead
value into CI and the suite would have failed identically — with the fix apparently already applied,
which is the worst state to debug from.

🔴 **and the timings prove CI never did the work.** locally the suite needs **175s** of real brain
calls; in CI it failed at `elapsed: 0s`. a 401 returns before any work begins. **so these tests have
verified no behavior at all in CI for as long as the secret has been stale** — a green-looking gap
of unknown age, and the same blindness the peer repo reported.

### .the two dreams this round is owed

1. **`when.repeatably` + `criteria: 'SOME'` does not protect a CI run.** two of three attempts
   passed and the suite still exited 1. either the criterion is unwired or jest's own count
   overrides it — and every repeatable LLM test in this repo depends on the answer
2. **`useThen`'s proxy masks the error that broke it.** the throw site is unreadable from the log,
   so a real defect and a flake present identically. that is `rule.forbid.failhide` in the harness

---

## 🔴 wave 3 — the same branch, one commit later, an INVERTED failure set

**run id:** `33384940624` · the diff between the runs is **three markdown files**. no secret was
rotated. no config changed.

| shard family | run `33383053039` | run `33384940624` |
|---|---|---|
| `stepReflect` integration (fireworks, grok, claude) | 🔴 **401 at 0s** | ✅ **pass, 38–50s** |
| `stepReview` integration | ✅ pass | ✅ pass |
| **acceptance** (9 jobs + `test-integration` + `test-acceptance-locally`) | 1 job failed at 34s | 🔴 **ALL failed at `10m 3s`** |

### ✅ what this refutes

**the 401 was transient.** the identical fireworks shard now passes with the identical secret. so
`gh secret set` was **never** the fix, and had it been run it would have "worked" — the next run
passes either way — and cemented a false cause in the record forever.

⇒ 🔴 **that is the sharpest lesson in this whole file.** the local run (175s, 15/15) proved the key
was valid *locally*; I read it as proof CI's copy differed. **it was equally consistent with a
provider that was briefly unhealthy** — and I never enumerated that second reading. a single
observation that fits two causes is not evidence for either.

### ⚠️ what the new shape says

**`10m 3s`, uniform across 11 jobs of three different kinds, is a job timeout** — the run hit a wall
rather than a verdict. paired with wave 2's instant 401, both runs point one direction:

> **the upstream LLM provider is degraded, not dead.** run 1 it refused instantly; run 2 it hung
> until the runner gave up. a credential does neither of those things intermittently.

⚠️ **and this time the uniform duration IS strong evidence**, for exactly the reason wave 2's was
not: it spans `test-shards-acceptance`, `test-integration`, and `test-acceptance-locally` — **three
job kinds with different setup paths**. a shared setup cannot explain it; a shared upstream can.

### .the next moves, revised

1. **do not rotate the secret.** it is not the cause; the shard that 401'd now passes on it
2. `rhx git.release --retry` — the paved move for provider flake, and the cheapest test of it
3. if acceptance still times out at `10m 3s` on a retry, the wall is the **job timeout vs. a slow
   provider**, and the question becomes whether the bound is too tight rather than whether a key is
   dead
4. **carry both runs forward.** either alone tells a clean, wrong story

---

## 🔴 wave 3 IS RETRACTED — the acceptance log settles it, 2026-08-31

**job `99470306425`, read through `gh api …/actions/jobs/<id>/logs`** — which works while
`gh run view --log-failed` still refuses, because the latter demands the WHOLE run be complete and
one job stayed queued:

```
🦉 let's review
   ├─ brain: fireworks/deepseek/v4-flash
…
code: 'UNAUTHORIZED'
```

⇒ **the acceptance suite drives `review` on fireworks, and fireworks refuses it.** same cause as
wave 2, in a different suite. one cause, not three.

### 🔴 what the retraction actually rested on — a truncated job name

wave 3's whole case was *"the fireworks shard now passes."* it does not. the job that passed was:

```
test-shards-integration (explicit, 2, …/stepReflect.casePriorRules.gr…   ← grok
test-shards-integration (explicit, 1, …/stepReflect.casePriorRules.de…   ← the fireworks default
```

**I read `casePriorRules.gr…` as the shard that had failed.** it is the **grok** variant. the
fireworks variant never passed in any run.

⇒ **once the brain is the axis, every observation lines up with no exception:**

| brain | every run |
|---|---|
| grok · claude · brainChoice | ✅ pass |
| **fireworks** — the default for acceptance AND `casePriorRules.default` | 🔴 **UNAUTHORIZED, every time** |

and the varying durations that seemed so significant — 34s, 1m 42s, 2m 30s, 10m 3s — are **job
scheduling noise**, not the failure. the test itself ran `8.322 s`.

### ⚠️ the lesson, and it is not the one wave 3 drew

wave 3 concluded *"one observation that fits two causes is not evidence for either"* — true, and
**it was not the operative error**. the operative error was cruder: **I treated a truncated
identifier as if it were the full one.** `casePriorRules.gr…` and `casePriorRules.de…` differ in
two characters that the terminal elided, and I never widened the column.

🔴 **and the correct move was cheap and available the whole time.** the local run had ALREADY given
the decisive fact — the same suite passed on the same key locally. *local passes, CI fails, same
code* is a **CI-environment** finding, and a stale secret is the plainest member of that class. I
had that on the first pass and talked myself out of it with a misread.

⇒ **when a retraction rests on one observation, re-read the observation before you rewrite the
conclusion.** a retraction feels like rigor, which is exactly what makes an unchecked one expensive.

### ✅ the fix, restored

```sh
gh secret set FIREWORKS_API_KEY --repo ehmpathy/rhachet-roles-bhrain
rhx git.release --retry
```

⚠️ **and `gh api …/actions/jobs/<id>/logs` is the paved read** when a run holds a queued job —
`gh run view --log-failed` will refuse for as long as any one job is unfinished, which is precisely
when a driver most wants the log.

---

## 🔴 the through-line — four errors, one shape, and it is NOT "check your evidence"

**every observable I read this round was read correctly.** the numbers were the numbers, the job
name was on the page, the cron list was real. what failed, four times, is **which subject the
observable was bound to**:

| # | the observable, read correctly | I took it to be OF | it was OF |
|---|---|---|---|
| 1 | `34s`, uniform across 4 jobs | the **test's** duration | the **job's** setup prefix |
| 2 | `casePriorRules.gr…` passed | the **fireworks** shard | the **grok** shard |
| 3 | ⇒ the retraction built on #2 | — | — |
| 4 | `CronList` → `15739e63` | the loop **the human holds** | a **session-only** cron in MY session |

⚠️ **#4 is the sharpest, because the id did not cross the boundary I handed it across.** `15739e63`
is **session-only** — in the human's `CronList` that slot holds the fleet-wide babysit sweep. so a
literal read of my handoff would have deleted the only cron they did hold and blinded every repo, to
fix a recurrence in none.

✅ **the audit, completed after the fact** — `.claude/settings.json:265-283` declares two `Stop`
hooks: `rhx route.drive` (271) and `rhx learn.domain.terms` (277). **the learner nudge is a hook,
and `CronDelete` cannot reach a hook.** the `"until all done…"` text is a separate mechanism — a
session-only cron — so **two recurrences were in play and I had audited neither.**

⇒ 🔴 **that is worse than the original error, and it is the durable part.** I did not merely name
the wrong mechanism; I never established **how many** there were. **a single-mechanism answer to a
multi-mechanism question is wrong even when its one claim is true** — and it reads as complete,
because one true mechanism is exhibited.

⇒ **that cost profile is what makes this pattern worth a rule.** each error was a confident,
well-evidenced instruction; the fourth would have caused unrelated harm at fleet scope. **an
accurate read attached to the wrong referent does not fail loud** — it fails as competence.

### .the cue — the question I did not ask, four times

> 🔴 **"of WHAT is this a measurement?"** — asked BEFORE you act, never *"is this true?"*

it is true every time. that is the trap.

| when… | then… |
|---|---|
| a value agrees across parallel jobs | ask what the jobs **share** before you infer a shared cause |
| a name is **truncated** in any output | 🔴 widen the column. two shards can differ in the elided characters |
| you read an id, a path, or a handle from **your own** context and hand it to another | ask whether that namespace **crosses** the boundary. a session-only id does not |
| you identify a mechanism from **the one you know** | 🔴 audit the **artifact that declares** mechanisms — here, `settings.json` — never your memory of the family |
| a retraction rests on **one** observation | re-read the observation before you rewrite the conclusion |

### ⚠️ .the partial audit is the generator

three of the four came from a **complete read of an incomplete subject**. I ran `CronList` and read
it correctly — and never asked whether a *cron* was the mechanism at all. the full audit was one
grep of `settings.json` away and I did not reach for it, because the mechanism I had used
(`/loop` → `CronCreate`) supplied a plausible answer first.

⇒ **the mechanism you most recently used is the one that volunteers itself.** that availability is
not evidence, and it is what a partial audit mistakes for one.

---

## .noise, explicitly not a failure

every job logs a Node 20 deprecation notice for `cache/restore`, `checkout`, `setup-node`, and
`setup-terraform` — the runner forces Node 24. **notices, not errors**; they appear on jobs that
pass too. the pinned shas match the template exactly, so any bump is owed upstream at
`declapract-typescript-ehmpathy`, never patched here.

## .the release state at the time of this record

- PR **#399**, branch `beav/feat-adopt-seeded-briefs`, 0 behind main
- two commits: `feat(briefs): …` then `cont(cicd): pin every github action …`
- local verification green throughout: types · lint · format · unit **1029/1029**
- automerge **not** enabled; `--into prod` not yet run
