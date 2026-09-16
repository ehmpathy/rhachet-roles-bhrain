# yield — the stones walked, as walked

> the honest outline of an offroad journey to cut `npm run test:acceptance` from 30+
> minutes. it is written to be **enrouted**, so the wrong turns are kept, not tidied.

⚠️ **read the wrong turns before the stones.** three of the four cost more than any fix
in here, and every one was an error of inference, never an error of code.

---

## the measured record

| run | config | wall | verdicts |
|---|---|---|---|
| `probe-orig` (1 file) | cache off, in-band — **original** | **1m04s** | 79/79 |
| `probe-cacheonly` (1 file) | cache on, in-band | **43.7s** | 79/79 |
| `smoke-off` (2 files) | cache off, in-band — **original** | **28.7s** | 21/21 |
| `smoke` (2 files) | cache on, parallel | **13.5s** | 21/21 |
| `after4` (full, 117 suites) | cache on, 4 workers | **11m14s** | 3241/3252 ⚠️ polluted |
| **`after8` (full, 117 suites)** | **cache on, 8 workers — clean** | **12m06s** | **3252/3252, 117/117 suites** |

⇒ the `after8` run is the one clean full-suite measurement in this route: build 16.3s +
jest 11m50s, **every case green, zero skipped**.

### 🔴 the headline, measured on both sides

| | wall | cases passed |
|---|---|---|
| **before** — `maxWorkers: 1`, `--runInBand`, no cache | **43m19s** | 3250 / 3252 |
| **after** — cache on, 8 workers | **12m06s** | **3252 / 3252** |

```
🦉 bench.acceptance compare --before before --after after8
   └─ delta   31m13s faster  (3.58x)
   ✅ no regression — all 3248 cases that passed before still pass
```

⇒ **3.58x, with zero coverage loss.** the after run passes MORE than the before: two
LLM-dependent cases that flaked serially came back green.

🟡 two honest caveats on that block. the `before` row took **three attempts** — the first
two were destroyed (wrong turns 1 and 3), so this number arrived last, not first, which
is the opposite of the order stone 2 demands. and `compare` counts 3248 distinct
passed-case KEYS against a 3250 total, because its key is `file :: fullName` and a
handful of repeat-attempt cases share a name. the set difference is still sound (lost =
0, weakened = 0); the count in that line is a lower bound, not a census.

---

## the stones

### 1. instrument — build what measures it, before you change it

**why it exists.** a speedup with no before/after is a guess dressed as a tune. and a
stopwatch alone licenses a test deletion to win, so the instrument must answer two
questions at once: *where does the wall clock go?* and *did every case that passed
before pass now?*

**the guard.** `bench.acceptance` prints a measured wall clock, a per-file cost, and a
per-case verdict map — and its `compare` exits 2 on any case that passed before and does
not now.

**hardwon.** a case COUNT cannot clear the no-loss bar. a swap of one case for another
holds the count steady and loses the coverage. match on full case name.

⇒ `.agent/repo=.this/role=any/skills/bench.acceptance.{sh,js}`

### 2. baseline — measure the clean tree, and FREEZE it

**why it exists.** every later stone is judged against this number. a baseline taken
after a change is not a baseline.

**the guard.** a saved run that holds `wallMs`, per-file cost, and a case map.

**hardwon.** this stone failed twice. see wrong turns 1 and 3.

### 3. attribute — name each cost with a number

**why it exists.** the fix is chosen by the attribution. reversed, you tune what is easy
rather than what is costly.

**the guard.** each named cause carries a measured number.

**hardwon — read CICD, not just the laptop.** the shard timings settled it:

| shard | wall |
|---|---|
| the 8 files CI isolates as "longest poles" (real LLM calls) | **50–75s each** |
| the 3 dynamic shards of "fast validation" files | **5m36s – 9m52s** |

⇒ **the slow half was the fast-labelled half.** a label written once and never
re-measured is a rut. I would have tuned the LLM tests.

### 4. cut the fixture cost — one seam, not 322 call sites

**why it exists.** parallelism multiplies whatever per-file cost is left. cut the cost
first so the multiplier lands on a smaller number.

**the guard.** per-file wall clock falls AND `compare` reports zero lost cases.

**what it was.** fixtures call `npx rhachet roles link` **322 times** for byte-identical
output. rhachet's `bin/run` routes `roles link` to `run.jit` — a full node boot of the
CLI — while only `roles boot|cost` get the compiled bun binary. measured at **~2.2s per
call**; across 322 calls, **~11.8 minutes**.

it is safe to cache because the link writes **relative** symlinks (rhachet's
`symlinkFile` stores `relative(targetDir, source)`) and every fixture temp dir sits at
the same depth with the same `node_modules` symlinks. the linked tree is **5 symlinks**.

**hardwon.** intercept at the **one shared `execAsync`** in the harness, never at 322
call sites — 322 edits is 322 chances to change what a test proves. the cache is
populated by a REAL cli call, so the CLI is still exercised once per role; what is
dropped is the 321 redundant re-proofs.

**hardwon.** keep the original path reachable (`ACCEPTANCE_LINK_CACHE=off`). a
before/after measured on a tree that no longer exists is a claim nobody can re-check.

⇒ `blackbox/.test/linkRole.ts`, `blackbox/.test/execAsync.ts`

### 5. restore parallelism — and distrust your own diagnosis

**why it exists.** the suite ran serial via `maxWorkers: 1` **and** `--runInBand`.

**the guard.** the full suite green at the raised worker count, with zero lost cases.

**hardwon.** `--runInBand` in the npm command **overrides** `maxWorkers` in the config.
both must change or the config edit is silently inert.

**hardwon.** `git log -S maxWorkers` put the constraint in the repo's **first import
commit**, with a note that names a mechanism ("symlink race conditions") the current
test-fns explicitly denies — it documents its temp infra as *"idempotent — safe to call
from parallel workers"*. that is real evidence the note was never checked. **it is not
evidence the note is false.** see wrong turn 2.

### 6. verify — the bar, and the no-loss proof

**the guard.** `bench.acceptance gate` on the paved `npm run test:acceptance` under
5m00s, AND `compare` exit 0.

**status: NOT CLEARED.** see *where this actually landed*.

---

## the wrong turns

### 🔴 1. I edited the harness while the baseline was in flight

jest **lazy-loads each test file as it reaches it**. a harness edit mid-run is picked up
by every file not yet loaded, so the run became a blend of old and new code — and the
untested new code could have failed suites and polluted the verdict set too.

**what reversed it.** I noticed the mechanism, killed a ~25-minute run, and redid it.

**the lesson.** the measurement is an experiment. freeze the tree for its duration. this
is not a tidiness rule — a corrupted baseline silently understates the very number the
whole task is graded on.

### 🔴 2. I let a CONFOUNDED experiment overturn a correct conclusion

I traced `maxWorkers: 1` to the first commit, found the current library contradicted its
stated reason, and concluded it was a rut. I raised it to 8. **595 cases failed**, so I
recanted and wrote down that the constraint had been real all along.

**then the clean re-run came back 3252/3252, 117/117 suites, at 8 workers.**

⇒ **the original call was right.** the constraint WAS inherited lore. the 595 failures
came from an external `npm run build` mid-run, and I let that confound talk me out of a
conclusion the evidence actually supported.

**what reversed it.** one clean re-run — which I should have demanded before the recant.

**the lesson, sharper than a plain mistake.** I flipped a correct conclusion because a
polluted experiment contradicted it. a failed run is evidence about the RUN first, and
about the hypothesis only once the run is known clean. ⇒ before any recant, ask: *was
this experiment valid?*

🟡 the useful half survives: provenance told me the note was never checked, and that was
worth a move — but the move it licensed was **a test**, never a conclusion.

### 🔴 3. I diagnosed those 595 failures wrong — twice — and nearly shipped the second

401 of them read `symlink target not found: <gitroot>/dist`.

- first call: a logic race in my cache. wrong.
- second call, argued confidently from library source: `fs.existsSync` returns **false
  on any error**, EMFILE included; 8 workers on 4 cores exhausts fds. a clean story that
  fit every symptom. **also wrong.**
- actual cause: the human ran `npm run build` mid-run. `build:clean:tsc` does
  `rm -rf dist/`. `dist` really was absent, by an external hand, for seconds.

**what reversed it.** the human said so.

**the lesson — the sharpest one here.** a story that accounts for every symptom is not
evidence. I inferred where I could have measured, and the cheap test (re-run clean, see
if it reproduces) sat there the entire time. ⇒ the `after4` run with 11 failures is
**also** suspect for the same reason, and is marked polluted above.

### 🟡 4. small ones, kept because they cost real minutes

- a `.js` skill invoked via `rhx` fails on the exec bit — this repo's `.js` skills are
  invoked via `node <path>` (per `census.word.js`), or need a `.sh` wrapper
- jest 30 renamed `--testPathPattern` → `--testPathPatterns`; the old flag errors out
- `git stash` is denied here, which is **correct** — the better answer was an env switch
  that lets one tree measure both sides, and that is reproducible where a stash is not
- a role with `briefs.dirs` MUST declare `hooks.onBrain.onBoot`, and `skills` is a
  required field — use an empty registry, never a `.gitkeep` dir (the linker counts it
  as "1 skill(s)")
- an init must be registered in `inits.exec`, or it is authored and never runs

---

## where this actually landed

**cleared:**

- **zero loss of coverage.** the clean full run is **3252/3252 cases, 117/117 suites,
  0 skipped**. no test deleted, skipped, weakened, or made to failhide
- the fixture-cost cut is measured, on identical case sets, on two independent scopes:
  **1m04s → 43.7s** (1 file, serial) and **28.7s → 13.5s** (2 files)
- parallelism is safe at 8 workers — proven by a clean green full run
- both changes are switchable, so either side is reproducible from this tree

- **the before/after is measured on both sides**: 43m19s → 12m06s, **3.58x**

**not cleared:**

- 🔴 **the under-5min bar.** the clean full-suite number is **12m06s** — **2.4x over the
  bar**, and one file alone (5m32s) already exceeds it

**dispatched upstream:** the dead cicd slow-test report is a declapract-managed template
defect that affects every consumer repo on jest 30 ⇒
`ehmpathy/declapract-typescript-ehmpathy#602`.

**what the gap looks like — measured, and it refuted my first read.**

I first wrote that the box was CPU-saturated, on the strength of `after4` (11m14s)
ahead of `after8` (11m50s). **that comparison was invalid** — `after4` was the polluted
run, and a failed case exits FAST, so 11 failures made it look quicker than it was.

the per-file data settles it:

| quantity | value |
|---|---|
| summed file time, 117 files | **93m55s** |
| wall clock at 8 workers | **11m50s** |
| ⇒ effective parallelism | **7.9x on 8 workers** |

⇒ **the suite is WAIT-bound, not cpu-bound.** parallelism is near-linear, so more workers
should still pay. that is the opposite of what I concluded an hour ago.

### 🔴 the hard floor — one file already exceeds the bar

jest parallelizes across files, never within one. so the wall clock can never fall below
the longest single file:

| file | wall |
|---|---|
| `review.join-intersect.acceptance.test.ts` | **5m32s** |
| `review.by.acceptance.test.ts` | 2m30s |
| `driver.route.overrule.acceptance.test.ts` | 2m25s |

**5m32s > the 5m00s bar.** with infinite workers and a zero-cost build, this suite still
misses, because one file misses on its own. ⇒ **no amount of parallelism can clear this
bar. the long files must be split.**

### the levers left, in the order the data ranks them

1. **split the long-pole files by case.** `review.join-intersect` runs `case3` at
   attempts 1/2/3 against a real brain; each attempt is an independent wait. split into
   per-case files and jest spreads them across workers. **this changes no assertion and
   drops no case** — it only lets the same work overlap
2. **raise the worker count.** 7.9x at 8 workers says 16 is worth a measurement
3. **`genTempDir`'s git cost** — 457 calls × (`git init` + 2 commits) ≈ 1,400 git spawns.
   most fixtures never read the history they pay for; `git: true` could be opt-in

🔴 **the lever I refuse.** `when.repeatably` uses `criteria: CI ? 'SOME' : 'EVERY'`, so
locally every LLM case runs all 3 attempts and all 3 must pass. an export of `CI=true`
would collapse that to "any one attempt passes" and would cut minutes instantly. **that
weakens what the suite proves, and the bar forbids it.** it is recorded here so the next
traveler recognizes the temptation rather than rediscovers it as a clever idea.

---

## for the next traveler

1. **freeze the tree, by agreement.** a suite that resolves through `dist/` is destroyed
   by any `npm run build`. say so out loud before a long measurement.
2. **measure before you infer, every time.** three of four wrong turns here were
   confident inference that a two-minute scoped run would have refuted.
3. **read CI timings before you trust a label.** "fast validation" was the slow half.
4. **the count is not the coverage.** match cases by name.
5. **cut cost before you add workers.** the multiplier should land on a small number.
