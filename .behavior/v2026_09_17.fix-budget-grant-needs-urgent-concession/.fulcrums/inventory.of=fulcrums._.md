# inventory.of=fulcrums

the design calls best-guessed on this route, itemized at the moment each was made
(`rule.always.itemize-the-fulcrums-you-best-guess`). **the council reads this board at the end of the
route and rules.**

🔴 **the wish RESERVED one fulcrum explicitly** — *"what counts as an 'urgent concession', and who
makes it, is the wisher's call and is NOT yet made."* that is `F01`, and it is best-guessed rather
than halted on, per `rule.always.defer-fulcrums-to-last`. its rework is clean.

## .the axes

| axis | positions |
|---|---|
| `rework` | `clean` — a rename, a swapped predicate, a re-scoped boundary that does not ripple · `dirty` — callers hardened against it, or later work built upon it |
| `status` | `best-guessed` · `ruled` |
| 🔴 `triage` | `answered` — a source line or a ruled precedent settles it · `wisher` — only the wisher, or the council it convenes, can · `research` — owed to a later phase |
| `confidence` | a percentage, with a reason. below 93% earns a row even where no alternative was weighed |

🔴 **the `triage` axis was added at `r4`, and its absence was a real defect rather than a tidiness
gap.** `status` has two positions and **both are about the COUNCIL** — whether it has ruled yet.
neither is about the **OWNER** — who is even able to rule. ⇒ so `F11`, which a source line settles
outright, and `F13`, which no source can settle, presented **identically** to a reader: both
`best-guessed`, both *"not yet ruled."*

⚠️ **the cost lands on the scarcest resource in the loop.** a council handed 14 rows with no owner
column must re-derive, per row, whether the question is even its own — and
`rule.always.get-a-second-opinion-before-foreman` exists precisely because a human's attention is
what this repo spends most carefully.

## .the board

| case | the call | rework | triage | confidence | status |
|---|---|---|---|---|---|
| `F01` | 🔴 **the "urgent concession" is the extant `--as conceded --severity urgent`** — no new signal coined | clean | 🔴 wisher | 92% | best-guessed |
| `F02` | ~~`#458`'s meter is **implemented as the second lift**~~ | clean | — | — | 🔴 **RULED — REVERSED.** the meter does **not** ship here; `#458` stays open |
| `F03` | **the urgent lift goes to the BOT; the human is WARNED, never asked** — the newest shipped copy states this verbatim | clean | wisher | 88% | best-guessed |
| `F04` | 🔴 a `better` concession **no longer buys a confirm round** — the predecessor's `case=6` is reversed | clean | wisher | — | ✅ **RULED — option A**, both halves (`S03` + `S01`) |
| `F05` | the gate lands **inside `routeGuardBudget`**, with the meter beside it — not at the guard layer | clean | 🟡 split — the LINE answered by data flow, the LAYER wisher | 88% | best-guessed |
| `F06` | req 4 ("nitpick-only never lifts it") is read as **severity-based**, never concern-kind-based | clean | — | — | ✅ **RULED — option A** (`S04`). reqs 3 and 4 move to served |
| `F07` | 🔴 a **severity upgrade** (`better` → `urgent`) is **PERMITTED** — a re-thought, not a purchase | clean | — | — | ✅ **RULED — permitted.** the gate is one command wide, by verdict |
| `F08` | the **auto-grant dream** is a successor, not folded in here | clean | ✅ answered | 90% | best-guessed |
| `F09` | the gate is **scope-blind** — bare, `--peer`, and `--level` verdict identically | clean | 🟡 split — the scope FACT answered, the blindness CALL wisher | 🔴 70% ⬇ | best-guessed |
| `F10` | 🔴 ~~the predicate reads **B alone**~~ — the gate reads **B ∧ C**: a grant needs an **exhausted** lane | clean | — | — | 🔴 **RULED — option B, REVERSED.** the preemptive pad is refused |
| `F11` | a stance lapses when the **reviewer speaks again**, never when the driver edits — so `S11` stands | clean | ✅ **answered by source** — `getLiveReviewAbsorptions.ts:50-52` | 90% | best-guessed |
| `F12` | 🔴 a **multi-match `--stone` prefix is REFUSED outright** — the gate cannot tell which stone earned the round | clean | — | 85% ⬆ | ✅ **RULED — option B, RATIFIED.** the one row whose reasons survived intact |
| `F13` | 🔴 **the requirements name a COMMAND; the invariant is about a QUANTITY.** ~~the two other doors are caught as a dream~~ | clean | — | — | 🔴 **RULED — REVERSED.** the actor check lands HERE; option C is dropped |
| `F14` | 🔴 ~~the wish's CUE has a one-line remedy this design does not take~~ — **the row's own premise is STRUCK** | clean | — | — | 🔴 **RULED — option A**, and **not for any reason this row gave** (`S03`) |
| 🔴 `F15` | 🔴 ~~the label becomes conditional by a boolean passed IN, since the renderer cannot reach the predicate~~ — **the row's PREMISE is struck: the severity already travels in `input.reason`** | 🟢 **naught** — no signature moved | — | — | 🔴 **DISSOLVED at 5.1.execution, no council owed.** the fork priced three options for a capability the operation already had |
| 🔴 `F17` | 🔴 **the round-capacity compare stays INLINE at a fifth site** — `rounds >= budget` is inline at 5 places and this behavior added the last one, past `rule.prefer.wet-over-dry`'s rule of three. taken as **leave and catch it**, on a CLEAN failure: the extraction opens three files this diff never touched | 🟢 clean | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **68%** | best-guessed |
| 🔴 `F16` | 🔴 **the concurrency axis is RECORDED and its defect is not closed** — the guard write is an unlocked read-modify-write (`route.ts:2117`,`:2127`), so two overlapped grants lose one and print both as made. **the bound is provably safe under every overlap**; what is lost is a warrant | 🟢 **clean, and outside this behavior's surface** — one operation's write strategy | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **72%** | best-guessed |
| 🔴 `F18` | 🔴 **the brain-registry re-snap rides the branch that bumped the dependency** — `review.conversation-help`'s snapshot moves or the suite is red, and the bump shares this diff. ⇒ the reviewer's remedy (*carry it on the bump's change*) presumes a separate change that does not exist | 🟢 clean — one file | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **74%** | best-guessed |
| 🔴 `F19` | 🔴 **the live granted wire stays pty-unclamped** — `process.stdin.isTTY` is read at one cli line a spawn cannot vary. **two of the three regressions a reviewer could name go RED** (a pipe reads `undefined`, so both open-failure forms GRANT and trip two extant assertions); the third — a constant `false` — ships green and fails **closed**. the close needs `node-pty` or a bare host dep | 🟢 clean — a pty case is purely additive | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **76%** | best-guessed |
| 🔴 `F21` | 🔴 **the `grant` term forbids two words the halt renderer PINS as canonical** — `increase` and `topup` are on this route's own forbidden list and both ship in contract-tier cli bytes, while `formatRouteDriveHalts.test.ts:118` asserts *"the term is `increase budget`, never a second word for it"*. taken as **dream it, and leave it to a dated `.disputes` entry**; best guess is the two-concept split | 🔴 **dirty** — ~90 sites, 8 of them briefs that publish to other repos, plus 3 test clamps | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **70%** | best-guessed |
| 🔴 `F22` | 🔴 **a SAFE ∧ CLEAN fix is deferred because it arrived AFTER passage** — `route.guard.budget` renders two tree dialects for one command; the fix is one `│` row and two reviewers named it independently. 🔴 **the only row on this board whose deferral its own rule grades a blocker** — the rework is clean in CODE and dirty in PROCESS, since an edit re-opens a sealed route for a 12-reviewer re-walk | 🟢 **clean** — one line + a mechanical resnap | 🔴 wisher — a **process** call, and the board's sharpest | 🔴 **60%** — 🟡 was the lowest here until `F20` fell to 40% | best-guessed |
| 🔴 `F23` | 🔴 **the tallier's over-count is corrected BY HAND and its fix is dreamed** — `i004` tallied 6 nitpicks where **3 distinct concerns** stand: `r012` was credited 2 for its CITATION of a peer's findings, against its own *"no test-intent violations found. No blocker."* ⇒ the defect **inverts with convergence** — the more conversation depth a lane holds, the more peer counts it recites | 🔴 **dirty** — the shared verdict path, its snapshots, and the parse contract | 🔴 wisher — a scope call, `F13`'s shape | 🟡 **82%** | best-guessed |
| 🔴 `F20` | 🔴 **the repeatable-retry defect stays in its dream** — `when.repeatably` × `useThen` × `toMatchSnapshot` fails in BOTH directions: the drive is memoized (39480ms → 128ms → 13ms), so no attempt sees a second outcome; and only attempt 1 holds a snapshot baseline, so attempts 2+ report green with naught asserted. the **permanent** flake beside it (a brain-count magnitude) WAS fixed; this residual's fix lives in `test-fns`. 🔴 **AMENDED 2026-09-19 — the row's own escalation trigger FIRED.** a post-passage re-run measured the acceptance gate RED in **2 of 2** full runs, so the *"surfaced once in 3"* rarity premise is refuted and `option C` is owed. the drift is a **verdict flip** (`approved`→`rejected`), which no magnitude mask can absorb ⇒ **the stone reads passed and its gate is red**. 🔴 **AMENDED AGAIN 2026-09-20, and it re-shapes the fork: `option C` does NOT close the red.** the flip is a probabilistic brain that grades clean fixture code dirty, so a hoist makes the retry honest and leaves the flake at its present rate — **only `option B` (`test-fns`) rescues it.** ⇒ the refusal of `option C` is no longer a SCOPE call a council may simply overrule: to take it costs an **18-baseline / 5-file** re-snap and the gate stays red. ✅ **RULED 2026-09-20 — and the verdict fell OUTSIDE the option set.** the wisher answered *"fix the flake; make it retryable"* + *"seed it to `test-fns` now"*, which **dissolved** the fork: a **fourth** option existed — move the retry to the **DRIVE** layer, suite-local, no `test-fns` edit. it shipped; the suite measures **25 passed / 0 failed / 0 skipped**, and the clamp is proven to bite (1 drive honest → 3 drives forced). the harness defect is dispatched as **`ehmpathy/test-fns#71`** with six falsifiable bars. 🟡 **the lesson: options A–C all varied one axis — which of three NOUNS to touch — and the live axis was LAYER** (assertion · drive · harness), so a whole position was never a row | 🟢 clean — additive to a suite this behavior does not own | ✅ **ruled — wisher, 2026-09-20** | ✅ **100%** (was 40%) | ✅ **RULED — fork dissolved; fix shipped, upstream seeded** |

🔴 **`F16` is the first row this board owes to a PEER reviewer rather than to a self-review**, and
that provenance is the point. it was found by `rule.require.dimensional-decomposition`'s own list of
usual omissions — an instrument that reads the **rule**, never the author's model of the artifact. ⇒
the four self-review rounds could not have produced it, and § *the three absent axes* in
`case=_.md` carries the argument.

🔴 **five rows read `split`, and that is the `r4` triage sweep's sharpest result.** each fuses a
**fact** with a **call**, and the two halves have different owners — so no single marker fits, and
the row reads as wholly open while half of it is already closed by a source line.

🟡 **a fused row is invisible to both earlier detectors on this board.** `r2`/`r3`'s cross-check needs
two artifacts that **disagree**, and a fused row agrees with itself. `r4`'s source read needs a claim
to **check**, and a fused row's factual half is usually **correct**. ⇒ the triage sweep is a third
instrument, cheaper than either: it reads this board alone and asks one question per row — **who can
answer this?**

## 🔴 .the council — four rows ruled, 2026-09-18

the board was handed up and four rows came back. **the wisher's own words are archived at
`$route/.seeds/`** (`rule.always.archive-the-wishers-words-verbatim`); this table is the distillate.

| row | the verdict | what it cost the board |
|---|---|---|
| 🔴 `F13` | **REVERSED.** the actor check on `route.mutate grant allow` lands in this behavior | req 1 moves from *narrowed* to **discharged**; the dream is consumed into the change surface; the yield's largest stated hole is withdrawn |
| 🔴 `F14` | **option A — and its PREMISE is struck.** the budget IS the allowance for `better` churn | the whole *"leaves the loop intact"* argument is withdrawn. there is no loop; there is a **window**, and a bound at its end |
| `F06` | **option A.** the severity is the gate's input, and it is the driver's own rank | reqs 3 and 4 move from *intent only* to **served**. req 2 alone survives as a gap, and it is `F10`'s |
| `F04` | **option A, both halves.** `better` buys no round past the meter; the ack's copy is in scope | three surfaces this row counted as counter-evidence become change-surface rows |

### 🔴 the verdicts do not merely close rows — they move the board's PREMISES

| what moved | the row that inherits it |
|---|---|
| req 7 has a mechanism that is not the meter | `F02` — **re-opened.** its call stands; its reason is hollow |
| the severity is the driver's rank, by design | `F07` — **narrowed.** no longer *may a driver self-grade?*; now *may a driver re-grade under refusal?* |
| the meter's end is the boundary, never the nitpick allowance | `F10`, `F12` — unchanged, and now clearly scoped to the region **past** the window |

🔴 **and that is the sharpest result of the council: two rows were altered with no verdict on
either.** a verdict on `F13` hollowed `F02`'s reason and left its words intact; a verdict on `F06`
shrank `F07`'s question and left its number intact. ⇒ **this board has no mechanism that flags a row
whose ground moved beneath it**, and a council that rules in sequence will pass rows that are no
longer the rows it read.

### 🟡 what the four verdicts say about how this board was BUILT

**three of the four went against the argument rather than the call**, and in different directions:

| row | the call | the argument |
|---|---|---|
| `F14` | ✅ upheld | 🔴 **struck entirely** — right answer, every reason wrong |
| `F06` | ✅ upheld | 🔴 the `r5` strike was correct and its **conclusion** (a confidence cut) was not |
| `F04` | ✅ upheld | 🔴 its counter-evidence was **scope**, mis-read as opposition |
| `F13` | 🔴 **reversed** | its one live argument was named as the one to rule, and it did not hold |

⇒ **a fulcrum's confidence graded the CALL, and three of four calls were right.** what was wrong were
the reasons — and a reader who trusted the reasons would have built the wrong artifact three times
over while the headline stayed correct.

🟡 **the one row the grade predicted was `F13`**, the board's lowest at 35%, which the read-first
table already headed. ⇒ the heuristic works where a row has fallen to a single argument, and says
naught at all about rows that are right for wrong reasons.

## 🔴 .the council, second session — four more ruled, 2026-09-18

the four that change what the criteria stone builds. **all four arrived as SELECTIONS from options
this route authored**, so none earns a seed (`rule.forbid.verbatim-quotes-outside-seeds`) — their
record is each row's verdict field.

| row | the verdict | the direction |
|---|---|---|
| 🔴 `F10` | **option B.** a grant needs an **exhausted** lane; the preemptive pad is refused | **REVERSED** |
| 🔴 `F02` | the meter does **not** ship; the actor check alone answers req 7 | **REVERSED** |
| ✅ `F07` | a `better → urgent` re-grade is **permitted** — a re-thought, not a purchase | upheld |
| ✅ `F12` | a multi-match `--stone` prefix is **refused outright** | upheld, **ratified** |

### 🔴 the width of the gate is now fully ruled, and it is the number to carry forward

```
F07  ✅ permitted   one nitpick re-graded urgent   →  a warrant the driver minted itself
F10  🔴 NARROWED    × every EXHAUSTED lane         →  live lanes are out of reach
F12  ✅ refused     × one stone only               →  the prefix sweep is closed
```

⇒ **two of three factors closed or narrowed; the first stands open by verdict.** the residual reads:
*one self-minted warrant pays for every exhausted lane at the scoped level, on one stone.*

⚠️ **and the size residual is untouched by all three** — `--add N` takes any `N`, and `F10`'s
§ *the obvious cap, weighed and REFUSED* shows why `.length` cannot bound it. that cost still belongs
to `F03`'s auto-grant successor.

### 🟡 what the eight verdicts say, together

| session | reversed | upheld |
|---|---|---|
| first | `F13` | `F14`, `F06`, `F04` — 🔴 **all three against their ARGUMENTS** |
| second | `F10`, `F02` | `F07`, `F12` — `F12` is the only row on this board with reasons intact |

🔴 **three of eight reversed, and the two second-session reversals share a shape the first did not:
each row's own body named the cell it lost on.** `F10` § *the hole it leaves — `urgent × live`* is
precisely the cell option B closes; `F02`'s § *the amendment* declined to set a confidence and said
the question had changed. ⇒ **a row that argues its own residual honestly hands a council the
grounds to reverse it**, and both did.

🟡 **`F12` is the counterexample that explains the rest.** it is the one row graded against a
**measurement** and a **ruled precedent** rather than an inference — and it is the one row a council
could only ratify. ⇒ **the rows built on arguments were the rows that moved.**

## .the gaps — what this board does NOT yet hold

- **no `dirty` rework on the board.** every call above is one predicate, one copy block, or one issue
  comment. ⇒ **that is itself a claim worth a council's glance**: if any of these is dirtier than
  graded, the grade is the defect, not the call.
- 🔴 ~~**no ruled verdicts.**~~ **EIGHT ruled on 2026-09-18**, across two sessions — `F13`, `F14`,
  `F06`, `F04`, then `F10`, `F02`, `F07`, `F12`. 🔴 **a NINTH, `F15`, was DISSOLVED at
  5.1.execution** — no council was owed, because its premise was false. 🔴 **and a TENTH, `F20`, was
  RULED on 2026-09-20**, by a fifth option the board never listed. **ten stand open**: `F01`, `F03`,
  `F05`, `F08`, `F09`, `F11`, `F16`, `F17`, `F18`, `F19`.
- 🔴 **`F19` is the board's first row opened by a PEER REVIEW of the VERIFICATION**, and `F20` is its
  first opened by the VERIFICATION RUN itself — a red suite, never a reviewer. so the five
  provenances are now vision-peer (`F16`), execution-self (`F17`), execution-peer (`F18`),
  verification-peer (`F19`), and verification-run (`F20`) — **and all five are the same scope-call
  shape `F13` set.** ⇒ five independent instruments, at three stones, converged on one question:
  *does this repair belong to this behavior?* **a board whose open rows converge on one question
  shape suggests the question is the ROUTE's, never each row's.**
  - 🔴 **and the first of the five to be ruled answered YES.** `F20` asked whether a harness flake
    belongs to a behavior that barely touches the suite; the wisher said **fix it here**. ⇒ that is
    one data point, never a rule — but it is the only evidence the board has on the shared question,
    and it points at the *repair it* answer rather than the *defer it* one.
- 🔴 **`F20` is the only row a MEASUREMENT split rather than a judgment — and the only row a
  MEASUREMENT has since REFUTED.** it met two defects in one file and parted them on how often each
  fires: the **permanent** one (a brain-count magnitude, every run) was fixed; the **latent** one
  (the retry pair, *"once in three runs"*) was dreamed. ⇒ every other deferral here is graded on
  RIPPLE alone; this one was graded on ripple **and** rate.
  🔴 **and the rate half was wrong.** a post-passage re-run measured the suite RED in **2 of 2** full
  acceptance runs, so the row's own escalation trigger — *"a second red on this suite"* — fired. the
  grade fell **80% → 40%**, the board's lowest.
  🔴 **the board-level lesson is sharper than the row:** a deferral graded on a RATE is a deferral
  whose premise **expires**, where one graded on RIPPLE does not. ripple is a property of the diff
  and holds while the diff does; a rate is an estimate from a sample, and this one's sample was
  three runs. ⇒ **a rate-graded deferral owes a re-measurement before the stone seals**, and this
  board had no such duty until the trigger fired on its own.
  🔴 **and a SECOND lesson landed 2026-09-20, from the same row, and it cuts the other way.** once
  the red run's diff was read line by line, `option C` — the local fix the fired trigger said was
  *"owed"* — turned out **not to close the red at all**: the flip is a probabilistic brain, so one
  honest drive flips at the same rate as three dishonest ones. ⇒ **a fork priced only by RIPPLE
  records how much a fix costs and never whether it works.** every option on this board carries a
  *what it costs* column; `F20` is the first to have earned a *does it close the defect?* column
  beside it, and it needed one because a council that read the cost column alone would have ruled
  for an 18-baseline re-snap that leaves the gate exactly as red.
  🟡 **the cheap guard, for the next board: before a fork is handed up, state per option whether it
  CLOSES the defect or merely repairs its HYGIENE.** it is one column, and here it inverted the
  rank of two options that read as equivalent routes to one destination.
  🔴 **and a THIRD lesson landed the same day, from the same row — it subsumes both above.** the
  wisher's verdict on `F20` picked **none** of A–D. it named a fifth option — move the retry to the
  **DRIVE** layer — and that option closed the red with no `test-fns` edit at all. ⇒ **both columns
  were right and the option SET was wrong**, so neither column could have caught it. the four
  options varied exactly one axis, *which of three nouns do we touch*, and every noun came from the
  defect report; the live axis was **LAYER** — assertion · drive · harness.
  🟡 **so the guard above gains a prior one, and it is `rule.require.enumerate-before-you-name` at
  board scope: state the AXIS the options vary on, in the fork table's own header.** a fork that
  walks every combination of the wrong dimension reads as exhaustive and is not — and no
  consistency sweep can see it, because every artifact on the route inherits the same vocabulary.
  ⇒ only a party outside it can surface the absent position, which is what a council is FOR.
- 🔴 **`F18` was the board's first row opened by a PEER REVIEW of the execution**, where `F16` was
  opened by a peer review of the vision and `F17` by the execution itself. ⇒ the recurrence noted
  here at three rows has now reached four, and the note above carries it.
- 🔴 **`F17` is the board's first row opened by the EXECUTION rather than by the vision**, and it is a
  deferral of WORK rather than a design fork — every other row weighs two designs; this one weighs
  *now* against *later* on one design. ⇒ its decisive evidence is **a diff nobody has drafted**, which
  is why it sits at 68% and not higher.
- 🔴 **a row can be retired by a SOURCE READ rather than by a verdict, and `F15` is this board's
  first.** it priced three options against *"the renderer cannot reach the predicate"*, and the
  severity had travelled in its own input all along. ⇒ **a fulcrum states a fork, and a fork rests on
  a premise no one re-checks once the row is written** — which is the same shape that moved `F09`
  (95% → 70%) and `F06` (80% → 62%). the confidence grade caught none of the three.
- 🟡 **`F05`'s fork SHRANK with no verdict of its own** — `F02`'s reversal deleted its second clause
  (*"with the meter beside it"*), so what remains is the layer question alone. ⇒ the same
  ground-moved-beneath-a-row hazard the first session named, and this board still has no mechanism
  that flags it.
- ✅ ~~**`F13`, `F07`, and `F10` are the three below 70%**~~ — **all three are now ruled.** the gate's
  width is settled: `F07` permitted, `F10` narrowed, `F12` closed.
- 🔴 **no row bounds a grant's SIZE.** `F10`'s verdict bounds *when* a grant lands and not *how many
  rounds* it buys; its § *the obvious cap, weighed and REFUSED* shows why `.length` cannot serve. the
  auto-grant successor (`F08`) is the only candidate on this board that would.
- 🟡 **`F12` is the only row whose HAZARD is certain and whose REMEDY was open.** every other row
  weighs two defensible designs; this one weighs two repairs for a defect read straight from source.
  ⇒ it named the evidence that would settle it (a census of extant `--stone` invocations), **ran it,
  and moved 50% → 78% → 85%** — the one row on this board graded against a measurement and then
  against a ruled precedent, never against an argument.
- 🔴 **no row is above 92% after `r3`.** `F09` sat at 95% for two rounds and fell to 70% the first
  time its argument was re-read. ⇒ see the note on confidence-versus-verification below; it is a
  property of how this board was graded, never of `F09` alone.

## 🔴 .the rows a reviewer should read first — AFTER the council

**all five of the rows this section names are now RULED.** they stay below because the arguments are
what a reviewer of the criteria stone must carry, and a verdict does not make an argument stale.

⇒ **the live read-first set is now the seven open rows**, and two of them changed character:

| row | why it heads the open set |
|---|---|
| 🔴 `F05` | its fork **shrank with no verdict** — `F02` deleted the meter clause. what is left is the layer question, and it should be re-graded before a council rules it |
| 🔴 `F03` | it reverses **two shipped renders** and the newest copy states its opposite verbatim. the largest un-ruled surface change on the board |
| 🟡 `F16` | **72%**, a scope call of `F13`'s shape — *does this repair belong to this behavior?* ⚠️ and its hazard is a **failhide**, never a bypass: `case=12` `[t5]` proves no overlap can loosen the bound |

🔴 **`F15` left this set at 5.1.execution, and no council ruled it.** it sat here at 58% as a scope
call of `F13`'s shape; the execution read the source and found the fork had no premise. ⇒ **a row
that heads a read-first table on LOW confidence is exactly the row a source read should be aimed at
first**, and this board now has one worked case where that paid off.

### the original read-first argument, kept for the criteria stone

| row | why |
|---|---|
| 🔴 `F13` | **read this one first.** the other three bound how wide the gate is; this asks whether the gate is **on the path at all**. `rhx route.mutate grant allow` says *"human only"* in its help and checks no actor, and the flag it writes lifts the hook wholesale — so the budget is raisable without the command the wish governs. demoed at `case=11` |
| `F07` | 🔴 if a severity upgrade is permitted, **the whole gate is one command wide** — a driver refused at `better` re-absorbs at `urgent` and proceeds. demoed at `case=3` `[t3]` |
| `F10` | 🔴 **one warrant funds every DRY lane on the stone**, and outlives the lapse of every lane that ran. `F07` bounds how easily the key is minted; this bounds how far one key reaches |
| `F12` | 🔴 `--stone` is a **PREFIX**, so `--stone 5` writes three stones' guards on one stone's warrant — and **the engine's own halt prints the prefix form**, so the driver who obeys it is the one exposed. demoed at `case=10` |
| `F04` | 🔴 it takes the **larger** of the two severity reversals: today `case1b` renders *"yours to run, no human needed"*, and this design refuses that path outright, for the life of the stone |

🔴 **`F07`, `F10`, and `F12` COMPOSE, and the product is the design's true width:**

```
F07  one nitpick re-graded urgent   →  a warrant the driver minted itself
F10  ×  every DRY lane on the stone →  one warrant, N lanes
F12  ×  every stone the prefix hits →  one warrant, N lanes, M stones
```

⇒ **no single row states this, because each names only its own factor.** `case=9` `[b5x]` `[b6x]`
walks the first product; `case=10` walks the second. **a council that reads the rows one at a time
will under-read the risk**, which is the strongest argument this route has for its dense demos.

🔴 **and `F13` does not multiply into that product — it sits beside it.** the three rows above all
ask *how far does one grant reach?*, and each presumes the grant went through
`route.guard.budget`. `F13` asks the prior question:

```
F07 × F10 × F12  →  how wide is the gate, for a caller that walks through it
F13              →  🔴 whether the caller has to walk through it at all
```

⇒ **a council that rules the first three and leaves `F13` open has bounded the sanctioned path and
not the quantity** — which is the wish's stated outcome. that is why it heads the read-first table
despite its newness on this board.

## .the amendments

| at | row | what changed |
|---|---|---|
| `r1` self-review | `F03` | 70% → 60% → 78% → **88%**. argument 2 **withdrawn as a misread**; the docblock found against; the pinned **render** found FOR; then `setStoneAsConcernAbsorbed.ts:109` found, which states it verbatim — *"earns budget, warns the human"*, dated 2026-09-15 |
| `r1` self-review | `F06` | 90% → **80%**, reconciled to its entry's own reasoned grade |
| `r2` self-review | `F11` | 🔴 72% → **90%**, and the CLAIM INVERTED. its premise — *"a driver's own artifact edit mints a new generation"* — is refuted by `getLiveReviewAbsorptions.ts:50-52`, which keys on a `.given` FILE PATH. ⇒ `S11` is not reversed, and the rendered-copy requirement the row imposed is **withdrawn**. the row was renamed to its true claim |
| `r2` self-review | `F10` | 🔴 65% → **55%**. the call is unchanged; the **hole it leaves was measured at one lane and is stone-wide.** `case=9`'s probes found that one warrant funds every dry lane, and survives the lapse of every lane that ran — a direct consequence of `F11`'s own correction, since a skipped lane mints no given and so lapses naught |
| `r2` self-review | `F09` | **bounded, not re-graded.** it precedes the **LANE** scope (`--peer`/`--level`, parsed `:2196-2224`) and **follows** the **STONE** scope (resolved `:2264`). the unbounded claim read as though one gate sat before every scope, which `F12` refutes |
| `r2` self-review | 🔴 `F12` | **new row, opened at 50% — the lowest on the board.** `--stone` matches by `startsWith`, so one grant may write N stones' guards while the gate reads one stone's ledger. found by `howto.experience.enumerate` move 3's **seam** locator — the one place the A×B×C walk could not look, since all three axes treat the stone as a singleton |
| `r2` self-review | 🔴 `F13` | **new row, opened at 45% — the lowest on the board.** found by the requirements guide's own *"is the scope too large, too small, or misdirected?"*. `route.ts:1875-1889` writes the privilege flag with **no actor check**, and `route.mutate.guard.sh:94-98` lifts the hook **wholesale** — so two doors reach the budget without `route.guard.budget`. taken as **option C** (catch, do not close), which owes a dream and this row |
| `r2` self-review | `F02` | **re-framed, not re-graded.** `F13` found that a human lever for this already ships — `rhx route.mutate grant allow`, documented human-only. ⇒ the simpler answer to req 7 may be **an actor check on the extant command** rather than a new meter, and `F02` never weighed that option |
| `r2` self-review | 🔴 `F12` | **50% → 78%, on a census it named and then RAN.** ~35 extant `--stone` invocations, **every one a full stone name** ⇒ option B's ergonomic cost is ~0. and the sweep found the hazard is engine-generated: `stepRouteDrive…snap:148` prints `--stone 1`, the stone's own name, so **a name that is a prefix of a peer's makes the halt's own remedy a multi-match** |
| 🔴 `r3` self-review | `F04` | **75% → 70% ⬇ — the one row on this board that moved DOWN.** a repo-wide snapshot sweep found a **third** shipped surface that teaches the sequence option A refuses: `formatRouteGuardReviewPeerAbsorptionAck` `[case2]` renders *"fix the blocker, **buy the round**, then re-arrive"* with the command beneath it, and `[t1]` pins that render for a **NITPICK** concede on a spent lane. its suppress branch is meter-driven and ignores the `severity` input it already takes |
| 🔴 `r3` self-review | `F04`, again | **the surface is also the seam.** the ack's branch must become meter AND severity driven, so the change is one branch rather than a new parameter. ⇒ the cost of option A fell while its confidence did too — a rare split, and the reason both are recorded |
| 🔴 `r3` self-review | 🔴 `F14` | **new row, opened at 65%.** found by the guide's *"could we achieve the goal in a simpler way?"*, turned on the wish's **cue** rather than its outcome. `allowNitpicks` defaults to **0** (`route.ts:1244`, `genContextCliEmit.ts:281`), so a single cosmetic nitpick rejects a lane — *"taste has no floor"* because the floor is set at zero. ⇒ **this design bounds the lever and leaves the loop intact**, and the rounds spent before exhaustion are unrecovered |
| 🔴 `r3` self-review | `F10` | **the residual's obvious repair was weighed and REFUSED.** `getStoneLiveUrgentConcessionSlugs` returns an array, so `--add N` could cap at its `.length` — but its last line dedupes by **reviewer** (*"names the human once"*), so `.length` counts lanes rather than harm. a cap on it would grant 5 rounds for one concern spread across 5 lanes and 1 for five concerns in one lane. ⇒ the residual stands, and the gate's **boolean** read is now stated explicitly as the only safe one |

| 🔴 `r3` self-review | 🔴 `F09` | **95% → 70% ⬇, and its FORK STATEMENT was factually wrong.** it read *"`--stone <s>` alone (every lane on the stone)"*; the source says a bare `--add` lands on the **LATEST level alone** (`route.ts:2179-2181`, `computeBudgetTargetSlugs.ts:56-65`). ⇒ the correction **cuts** exposure — a lower level is already bounded by `F022` fork E |
| 🔴 `r3` self-review | 🔴 `F09`, again | **argument 1 STRUCK.** it claimed option A *"leaks the bound … the driver grants each of them in turn"* — but option A refuses a `--peer` grant to a lane that conceded naught, by its own definition. **the argument assumed option A permits what option A forbids.** ⇒ a two-argument row became a one-argument row; argument 2 stands and is sufficient |
| 🔴 `r3` self-review | `F12` | **78% → 85% ⬆, on RULED prior art.** `F022` fork E already forbade a blanket top-up across **levels** — *"a level stays exhausted unless it is EXPLICITLY named"* (`computeBudgetTargetSlugs.ts:5-8`, cited at `route.ts:2176`, `:2290`). ⇒ option B is that same verdict applied to the **stone** field, never a new posture — and this route improvised it, which `rule.always.reuse-pavement-before-improvise` names outright |
| 🔴 `r3` self-review | `F10` | **the stone-wide residual is LEVEL-bounded at its default.** a bare grant funds every dry lane at the latest level alone; `--level M` re-opens the width by one deliberate word, and the gate reads no scope (`F09`). ⇒ narrower than stated, and not closed |

| 🔴 `r4` self-review | 🔴 `case=4` (no row) | **its resolution named ONE of TWO human gates.** it said the bot's copy is *"denied by permissions"*; the paved pattern **also** probes `[[ ! -t 0 ]]` inside the skill (`require_human()`, 4 files, 2 role trees) — 🔴 **the reach `case=4` itself calls brittle.** ⇒ the reification does not escape the weak detector, it relocates it one hop back. **the call stands on a better argument: two gates in series** |
| 🔴 `r4` self-review | `F13` | **45% → 35% ⬇. one of option C's two arguments STRUCK.** its CLEAN half priced the actor check as novel work across *"two role trees"*; the mechanism is a **shipped idiom** (`require_human()`) plus a **deny entry** (`case=4:47`). ⇒ the req 7 argument now stands alone, and it is what a council must rule on |
| 🔴 `r4` self-review | `F02` | **the meter's inherited hatch priced, grade unchanged.** every probe carries `__I_AM_HUMAN=true` — *"a bot that passes its own human flag"*, which `case=4` row 1 forbids outright. 🟡 **the grade did not move, deliberately**: the hatch is a cost **every** option shares, and a cost with no alternative moves no arithmetic |

🔴 **the board-level note `r3` earned — a confidence grades the CONCLUSION, never the ARGUMENT.**

| the row | its grade | what a source read found |
|---|---|---|
| `F11` (at `r2`) | 72% | the **claim** was false |
| 🔴 `F09` (at `r3`) | **95%** | the claim held; its **first argument** was false, and its **fork statement** was factually wrong |

⇒ **the highest number on a fourteen-row board marked its least-examined row**, and that is no
coincidence — 95% is exactly the grade that says *"no need to re-read this one."*

🔴 **and the sharper corrective is NOT a confidence heuristic — it is a CROSS-CHECK, because this
vision twice held its own refutation.**

| the round | the disagreement | who was right | how it surfaced |
|---|---|---|---|
| `r2` — `F11` | `case=2` rendered `concede → fix → budget`; `case=7` rendered its reverse | the source, and `case=2` | accident |
| 🔴 `r3` — `F09` | `F09` said a bare `--add` reaches *"every lane on the stone"*; `dimensions.md:175` said it *"lands on the latest level alone"* | `dimensions.md`, and the row that was **wrong cited the one that was right** | accident |
| 🔴 `r4` — `case=4` | `case=4` rejects TTY detection as *brittle*, then adopts a pattern whose human gate **is** a TTY probe | the source | 🔴 **deliberate — the instrument, aimed** |

⇒ **two artifacts of one vision that state one fact two ways is the highest-yield signal this route
has produced**, and it beat the confidence grade every time: at `r2` the wrong row read 72%, at `r3`
it read 95%. **the grade predicted neither; the disagreement predicted all three** — and the third
was aimed rather than stumbled upon, which is what lifts it from an observation to a procedure.

🟡 **so the check a reviewer should run first is a consistency sweep, never a low-confidence sweep.**
it is cheap, it needs no source access, and it found the three defects that a re-read of the board
could not.

🔴 **the BOUND `r4` earned, and it is what makes the procedure safe to run:** when a cross-check
fires between a **summary** and a source, **open the artifact the summary points to before you write
the result.**

⚠️ at `r4` I first concluded *"the design never examined the TTY reach"* — from the yield's one-line
compression of `case=4`. **false.** `case=4:22` examines it by name and rejects it with a reason. ⇒
the summary was wrong by **compression**, never by error, and the real defect in the full artifact was
**different and sharper**: not a missed option, but an option rejected and then built upon.

⇒ **an unbounded consistency sweep manufactures overclaims at exactly the rate it finds real
defects.** the bound costs one file open.

🟡 **the confidence heuristic is still worth a pass, second:** a row above 90% whose `.where` cites no
**source line** was graded from memory. `F09`'s cited three artifacts and not one line for the scope
claim it opened with, while its neighbours cite lines freely.

🔴 **`F11`'s inversion is the sharpest result on this board.** a row was authored at 72% on a premise
the very operation it cited refutes, and it imposed a **rendered-copy requirement** on the design
from that premise. ⇒ **a fulcrum's confidence measures the author's certainty, never the claim's
truth**, and 72% did not mark this as a row to check against source. **two artifacts of this vision
disagreed about the sequence** (`case=2` rendered it one way, `case=7` the other) and that
disagreement — not the confidence grade — is what made the question askable.

🔴 **the `F03` swerve is worth a council's glance on its own.** the shipped surfaces that speak to
who tops up **do not agree with each other** — `case1c` contradicts itself twelve lines apart. ⇒
`F03` does not reverse a settled rule; it **picks a side in a live disagreement**, and a surface is
corrected either way it is ruled.

the set, as measured at `r3` — `getStoneLiveUrgentConcessionSlugs.ts:6-14` (human) · the halt's
reason line `case1c:125` (human) · the halt's remedy block `case1c:137` (driver) ·
`setStoneAsConcernAbsorbed.ts:109` (driver) · 🔴 `getBudgetClobberWarnings.ts:10` (human) · 🔴 the
absorption ack's *"buy the round"* (driver) · 🔴 `route.guard.budget.sh:6` — *"allows **humans** to
add more budget rounds"* (human).

🟡 **and that last surface is stale on a SECOND field.** `route.guard.budget.sh:10` documents
`--add 2 --stone 1.vision` as *"extend **all peer budgets** by 2"*, where the command's own help at
`route.ts:2166` says *"extend the **LATEST level**"*. ⇒ **the `F022` verdict landed in `route.ts` and
not in the skill header beside it**, so the skill a driver invokes documents a scope the command
stopped to have.

🟡 **the set is named rather than counted, deliberately.** an earlier line here said *"four shipped
surfaces"* and went stale the moment two more were found — then a seventh arrived at `r3`, from a
directory no earlier sweep had touched. ⇒ **a count a reader can derive from the list beside it
should not be typed**, and this line has now been vindicated twice.

## .see also

`1.vision.yield.md` — the vision these calls shape · `1.vision.experience.dimensions.md` — the walk
that surfaced `F09`, `F10` · `1.vision.experience.case=_.md` — the cells each call verdicts ·
`rule.always.defer-fulcrums-to-last` — why none of these halted the drive
