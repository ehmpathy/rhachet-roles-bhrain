# fulcrum F30 — a liveness probe answers a question narrower than the lock asks

- rework = **clean by shape, 🔴 dirty by seam** — refute-only, ~15 lines, in a file a peer holds
- status = ✅ **RULED + BUILT 2026-09-24 — option B**, after the deferral's ground EXPIRED
- confidence = 🔴 **60% at the deferral** — and the doubt was correct. see the closure below
- raised.by = self, at the bar-by-bar audit (`i015`)

## .the question, and the answer it actually gets

the lock asks: **"is OUR warmer alive for this reviewer?"**
`isReviewWarmerAlive` answers: **"does SOME process hold this pid?"**

those are the same answer until the os recycles the pid. then they part, and the lock trusts the
wrong one.

| bar 15 | verdict |
|---|---|
| the NAME — *"a stale pid never latches the lock shut"* | ✅ |
| the TEST — *"the check probes LIVENESS"* | ✅ and it is well built — `EPERM` is correctly parted from `ESRCH` |
| 🔴 the PURPOSE — *"so a lane cannot be left cold forever"* | 🔴 defeated by reuse |

⇒ **the third bar on this branch whose name and test are met and whose purpose clause is not**
(`F27` bar 9, `F29` bar 13). the read is now 3-for-3, which makes it the most productive instrument
this round produced.

## 🔴 .the harm, and the half this round AUTHORED

| | |
|---|---|
| a bystander inherits the pid | the lane reads covered — **no warmer ever spawns again** |
| 🔴 both emits print `kill <pid>` | a **destructive command aimed at a process we misidentified** |

🔴 **`F29` made the second harm materially worse, hours before this was found.** it added
`emitReviewWarmerDisowned`, whose entire purpose is to hand a cost-conscious driver
`stop it: kill <pid>` — so the hint is followed *by construction*. the failure is not a stale lock;
it is **"we told a human to kill their editor."**

🟡 that is worth a plain statement rather than a burial: a fix that closes one failhide can open a
sharper hazard one layer down, and the round that ships it is the round least likely to look.

## 🟡 .it is already in the suite, green

`emitReviewWarmerDisowned.integration.test.ts [case1]` writes **the jest runner's own pid** into a
warmer pid file and the probe grades it a live warmer. the fixture was written for another purpose
and works precisely BECAUSE any live pid passes.

⇒ **a non-warmer, graded as a warmer, asserted green, in the repo today.** no reuse is needed to
observe the defect — only to suffer it.

## .the fork

### A — defer, with the fix shaped and the ground evidenced (taken)

`isReviewWarmerAlive.ts` is under active peer write, and that is **observed rather than assumed**:
it gained an `isErrorOfAbsence` import and a 14-line race comment between two reads 25 minutes
apart; its caller was rewritten around an atomic `wx` claim in the same window; and
`getOnePokeMeasured` gained a timeout whose stated motive is *this same latch*.

⇒ the peer is mid-thought on exactly this seam.

### B — build it now

refute-only, ~15 lines, and it can free a latched lane while it can never latch one. 🔴 and it lands
in the one file a peer has edited twice within the hour, on the invariant they actively harden.

### C — hedge the `kill` hint at the two emits instead

🔴 **refused.** it treats the symptom at two leaves and leaves the cold-lane half entirely open
(`rule.require.solve-at-cause`). and a hedge on every hint trains a driver to distrust the hint,
which costs more than the rare case it guards.

## 🔴 .why the confidence is low, and it is the deferral I doubt

**three deferrals on this branch have now been overturned, and all three failed the same way — a
ground that was plausible and unverified:**

| | the ground | what held |
|---|---|---|
| `F14` | *"below the rule-of-three, wait for a third"* | the third already existed |
| `F27` | *"a peer is mid-flight in these files"* | true for 1 of 3 surfaces |
| `F29` residual | *"a contract asserted across two suites"* | asserted in **zero** suites |

⇒ so this ground is written as **dated observations** rather than a claim, which is the repair those
three teach. **it is still a schedule ground, and a schedule ground is the weakest kind** — it
expires rather than resolves.

🟡 **and it guards a SAFETY defect, not a tidiness one.** a deferral is cheap where the residual is
a missed caveat; here the residual is a destructive hint. ⇒ **this is the first row on this board
that should be re-read the moment the peer's `warmer/` work lands**, ahead of `F27`'s grove residual
and ahead of `case=6 [t3]`.

## .the verdict

✅ **B — BUILT, hours after A was taken.** the deferral's ground was a schedule, the schedule ran
out, and the trigger it wrote for itself (*"re-read the moment the peer's `warmer/` work lands"*)
fired. the barrier was a peer's cursor, and the cursor moved.

## ✅ .what shipped

`isPidOurWarmer` reads `<procRoot>/<pid>/cmdline`, splits the NUL-separated argv, finds
`--reviewer`, and compares the next token to the lane's slug. **the argv pair is the identity**: a
bystander that inherits the pid would have to carry this repo's own flag AND this lane's slug.

🔴 **it REFUTES on identity and never CONFIRMS on it**, and that asymmetry is the whole design. an
unreadable cmdline reads as OURS, so it can free a latched lane and can **never** latch one. the
alternative — unreadable reads as *not ours* — would stack a second warmer beside a healthy one on
every box where `/proc` is absent or restricted: **bar 15's cold lane traded for bar 14's duplicate
SPEND**, which is the worse of the two.

🟡 `/proc` is linux-only, so elsewhere this degrades to the liveness probe alone — the behavior
before it existed. stated in the code rather than left for a reader to assume it is universal.

### 🔴 the clamps BITE in BOTH directions, and each direction has its own red

`rule.require.clamp-edge-cases` asks for a red under the un-fixed defect. the check has two
opposite failure modes, so it was dogfooded twice:

| the neuter | the red | what stayed green |
|---|---|---|
| identity always CONFIRMS (the pre-fix behavior) | **2 of 72** — `isReviewWarmerAlive [case2][t1]` · `emitReviewWarmerDisowned [case4]` | every liveness case, every silence case, and both asymmetry rows |
| an unreadable cmdline REFUTES | **2 of 7** — `[case4]` EPERM · `[case5]` no-procfs | the two identity rows above |

⇒ **no row is red under both**, which is what proves the four clamps grade four claims rather than
one code path twice.

### 🔴 the fixtures were the real cost, and `~15 lines` did not price them

the estimate above was for the production change, and it held — the operation grew ~30 lines
including its notes. **what it missed is that three suites faked a live warmer with
`process.pid`**, and not one of them could ever produce a matching cmdline:

| suite | what it wrote | what it had to become |
|---|---|---|
| `isReviewWarmerAlive.integration` | the jest runner's pid | a REAL spawned process whose argv carries `--reviewer <slug>` |
| `emitReviewWarmerDisowned.integration` | the jest runner's pid | the same |
| `genReviewWarmer.integration` | the jest runner's pid | the same |

🔴 **a fake `/proc` was weighed and refused.** these are integration suites, and a hand-written
cmdline file is a mock of the very boundary under test — it would clamp the fixture writer rather
than the read (`rule.forbid.integration.mocks`, `philosophy.verification-strictness`). the argv in
each lookalike is copied from `genReviewWarmer`'s own `spawn`, so a drift in that spawn surfaces
here as a red.

🟡 the one place a `procRoot` option IS used is the state it names honestly: **a box with no procfs
at all**, which is every macos box. an empty dir reproduces that exactly, so it is configuration
rather than a mock — and it rides `options`, never `context`, because it is a pure value
(`rule.require.input-options-pattern`). no production caller passes it, and no caller signature
changed.

⇒ **the lesson for a later estimate: price the fixtures, not the operation.** an operation that
reads a new source of truth invalidates every fixture that faked the old one, and those fixtures
were written by somebody who had no reason to anticipate it.

## 🔴 .the fourth deferral to EXPIRE rather than settle — and it said so itself

this fulcrum opened with a table of three deferrals whose grounds did not survive a check, then
graded its own ground as the weakest kind there is — one that runs out rather than gets answered.

⇒ it ran out. **4-for-4.** the instrument that predicts this is now well enough evidenced to state
as a rule rather than an observation: **a deferral whose ground is a CLOCK owes a re-read, and the
re-read is scheduled at the moment of deferral rather than left to whoever notices.**

🟡 the honest credit: this row named itself *"the board's most impatient"* and put its own trigger
in writing. that is what made the closure mechanical rather than lucky.

## 🟡 .the residual it left, and a peer picked it up from the code alone

`/proc` is linux-only, so off linux the identity read finds no cmdline, refutes naught, and the lock
reduces to the pre-`F30` liveness probe. that limit is stated in `isReviewWarmerAlive`'s own notes
rather than left for a reader to assume the guarantee is universal.

⇒ **`F31` was raised from that note, by a peer, with no handoff** — the third time on this board a
written report was acted on by whoever arrived next. 🟡 and its ground is a **dependency approval**
rather than a schedule, which makes it the first deferral here that a clock cannot expire.

## .see also

- `F31` — the platform residual this fix leaves, raised from its code note
- ✅ `.dream/v2026_09_24.fix.a-recycled-pid-reads-as-a-live-warmer-and-we-tell-you-to-kill-it.md` —
  **retired**, its fix shipped here
- `F29` — which authored the sharper half of this harm, hours earlier
- `F27` · `F14` — the two prior deferrals whose grounds did not survive a check
- `0.wish` bar 15 (the clause) · bar 14 (the duplicate spend the fix must not trade for)
