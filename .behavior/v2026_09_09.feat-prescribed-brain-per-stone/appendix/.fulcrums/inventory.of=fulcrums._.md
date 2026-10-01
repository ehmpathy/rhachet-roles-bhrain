# inventory.of=fulcrums

the forks best-guessed on the way through the vision stone, and the calls made below 93% confidence.

per `rule.always.defer-fulcrums-to-last`: each was best-guessed and flagged rather than raised as a
halt. per `rule.always.itemize-the-fulcrums-you-best-guess`: each is itemized here at the moment it
was taken.

## .the summary

| case | title | rework | status | confidence |
|---|---|---|---|---|
| [F1](./inventory.of=fulcrums.case=F1-unenrolled-driver-halts-vs-warns.md) | an unenrolled driver **halts** rather than warns | clean | ✅ **ruled 2026-09-15 — HALT, upheld** ("always halt") | — |
| [F2](./inventory.of=fulcrums.case=F2-field-is-brain-with-model-as-alias.md) | the field is `brain:`; `model:` is **matched and warned**, its VALUE **dropped** (see `F18`) | clean | open | 90% · 🔴 **now the sole defense for `case=4`** |
| [F3](./inventory.of=fulcrums.case=F3-author-time-is-blind-to-reach.md) | author time stays blind to reach — no warn when a driver can never apply | clean | open | 75% |
| [F4](./inventory.of=fulcrums.case=F4-parser-rejects-unknown-keys.md) | ~~the guard parser **rejects** unknown top-level keys~~ → 🔴 **the parser stays PERMISSIVE** | 🔴 dirty | ✅ **ruled** — overturned | — |
| [F5](./inventory.of=fulcrums.case=F5-whoami-grows-a-brain-field.md) | `clone whoami` grows a `brain` field — a cross-repo ask on `rhachet` | 🔴 dirty | ✅ **ruled 2026-09-13** — accept the silent corner; **dispatch the ask, never depend on it** | — |
| [F6](./inventory.of=fulcrums.case=F6-brain-is-sticky-not-leased.md) | a switched brain is **sticky**, never restored on stone exit | clean | open | 80% |
| [F7](./inventory.of=fulcrums.case=F7-stone-entry-has-no-event.md) | stone entry has no event — which surface detects it | clean | open | **85%** ⬆️ |
| [F8](./inventory.of=fulcrums.case=F8-the-four-axis-decomposition.md) | the experience space is factored on four axes, plus a fifth argued to collapse | clean | open | 75% ⬇️ |
| [F9](./inventory.of=fulcrums.case=F9-visibility-is-a-line-not-a-ledger.md) | switch visibility is one output line, never a per-stone ledger | clean | open | 85% |
| [F10](./inventory.of=fulcrums.case=F10-the-declared-value-is-a-brainslug.md) | ~~the value is a rhachet **brainslug**~~ → 🔴 **the value is the brain-cli's own `/model` argument** | clean | ✅ **ruled** — overturned | — |
| [F11](./inventory.of=fulcrums.case=F11-the-brain-line-carries-no-marker.md) | the brain line carries **no glyph** at the vision; the claim defers to execution | clean | open | 80% |
| [F12](./inventory.of=fulcrums.case=F12-brain-bounds-the-driver-not-the-reviewers.md) | `brain:` bounds the **driver clone**, never the reviewers the same guard declares | clean | ✅ **ruled** — upheld | — |
| [F13](./inventory.of=fulcrums.case=F13-the-learner-amendment-is-deferred.md) | a gap found in a **published booted** brief is deferred to a dream rather than ridden along | clean | open | 90% |
| [F14](./inventory.of=fulcrums.case=F14-the-applier-converges-rather-than-compares.md) | 🔴 the applier **CONVERGES** — it sets the declared brain every boundary and holds no belief | clean | ✅ **resolved** — by research, 2026-09-11 | — |
| [F15](./inventory.of=fulcrums.case=F15-a-parser-warn-writes-to-the-process.md) | ~~🔴 the `model:` warn writes to the **process**~~ → ✅ **it flows through `emit.stdout`** | 🔴 dirty | ✅ **resolved 2026-09-14** — the rejected mechanism was BUILT, so no verdict is owed | — |
| [F16](./inventory.of=fulcrums.case=F16-an-inherited-brain-ships-unattributed.md) | ~~🔴 an **inherited** brain ships unattributed~~ → ✅ **the attribution is BUILT** | 🔴 dirty | ✅ **settled 2026-09-17** — a peer reviewer overturned the deferral (i033 r008 blocker.1), and its `dirty` grade was **wrong**: a narrow of `delDriveBlockerState`, never a new artifact | — |
| [F17](./inventory.of=fulcrums.case=F17-the-guard-object-carries-optional-attributes.md) | 🔴 `brain?: string` is **optional**, where `rule.forbid.undefined-attributes` asks for `string \| null` | 🔴 dirty | open | 75% |
| [F18](./inventory.of=fulcrums.case=F18-the-model-alias-drops-rather-than-parses.md) | 🔴 `model:` **DROPS** its value — and `F2` + the yield read as though it parses | clean | open | 80% · ⚠️ **the vision contradicts itself** |
| [F19](./inventory.of=fulcrums.case=F19-get-carries-no-cardinality.md) | 🔴 `getNearMissGuardKey` carries **no `One`/`All`**, where a booted BLOCKER rule demands one | clean | open | 85% · ⚠️ **the rule is 20% adopted repo-wide** |
| [F20](./inventory.of=fulcrums.case=F20-the-advisory-re-reads-the-guard-per-tick.md) | the advisory re-reads the guard per tick — `case=10`'s bound is pinned on **bytes**, never on I/O | 🔴 dirty | open | **75%** ⬇️ · measured **+7%** marginal, against a baseline of N. 🔴 **a SECOND lane reached for the same fold** (`r011`) — a fact about the call, never about the lane |
| [F21](./inventory.of=fulcrums.case=F21-the-failed-apply-retries-with-no-dwell.md) | a failed apply retries on **every** tick — the dwell needs a timestamp on `DriveBlockerState` | 🔴 dirty | open | 75% · ⚠️ **the same gap as `F20`** — a cost deferral whose fulcrum was skipped |
| [F22](./inventory.of=fulcrums.case=F22-the-entry-marker-shares-the-block-attribution-field.md) | 🔴 the brain entry marker **shares** `DriveBlockerState.stone` with push-block attribution | 🔴 dirty | open | **70%** · ⚠️ **the third instance of `F20`/`F21`'s class** — a deferral noted in code, unrecorded for a council |
| [F23](./inventory.of=fulcrums.case=F23-a-captured-transport-failure-is-never-read-back.md) | 🔴 a **captured** transport failure is never read back — the render still says `⟨requested — unconfirmed⟩` | 🔴 dirty | open | 75% · ⚠️ **the FOURTH instance of that class**, and the **third claimant** on `DriveBlockerState` |
| [F24](./inventory.of=fulcrums.case=F24-the-drive-render-operations-stay-inline.md) | 🔴 the ten `formatRouteDrive*` render ops **stay inline** — an out-of-scope 20-file extraction | 🔴 dirty | open | 85% · ⚠️ **it will be re-raised every round** — a correct nitpick that a deferral does not silence |
| [F25](./inventory.of=fulcrums.case=F25-the-conversation-bind-is-narrowed-by-targets-not-depth.md) | 🔴 three lanes overflowed the context gate — narrow the **targets**, never the **conversation** | 🔴 dirty | open | **55%** ⬇️ · 🔴 **its own ~7–10 round projection was refuted at i036 — the overflow recurred in ONE round and took FOUR lanes.** the diff grew 79 → 214 files, so the convergence loop is a growth term the entry never priced. ⇒ the lever is spent, and the wisher's call is live rather than distant |
| [F26](./inventory.of=fulcrums.case=F26-a-spaced-guard-value-offers-no-derived-paste.md) | a **spaced** guard value offers no derived paste, though a strip would yield a valid literal | clean | open | 80% · ⚠️ **the one arm that breaks the derive rule the other two teach** |
| [F27](./inventory.of=fulcrums.case=F27-a-kill-mid-await-leaves-a-live-claim-and-no-dispatch.md) | 🔴 a kill MID-AWAIT leaves a live claim and no dispatch — a brain stone then renders as `case=10` for 15s | 🔴 dirty | open | **70%** · 🔴 **the only row here a REVIEWER demanded** (`r010` blocker.1) — the build accepted a tradeoff that is the wisher's alone to accept |
| [F29](./inventory.of=fulcrums.case=F29-two-says-race-for-order.md) | 🔴 `/model` and `/effort` are two says that RACE for order — an effort that arrives first is applied to the brain the stone is about to leave | clean | open | 80% · ⚠️ the bytes are safe by rhachet's single-writer queue; the ORDER is safe by neither |
| [F30](./inventory.of=fulcrums.case=F30-an-inherited-effort-is-unrecorded.md) | an inherited EFFORT is unrecorded — `DriveBrainInheritance` persists a slug and a stone and no level | clean | open | 85% · ⚠️ a silence, never a false claim — and `case=8` holds that the RECORD is the deliverable |

🟡 **`F28` is absent, and the gap is deliberate rather than a lost file.** it was drafted as *"an
effort declared alone dispatches naught"* and was **overturned before it was written**, by what the
wisher settled about the exploded form: *"if they want to change effort but not choice, then they
still explode it but omit the choice."* ⇒ an effort-only prescription dispatches one `/effort` say,
so the call it reserved does not exist. the ordinal is left unfilled because a re-use would make two
different records share one coordinate.

## 🔴 .the council ruled 2026-09-10 — three settled, `F5` asked after

three calls were put to the wisher and answered. the words are archived verbatim at
`.seeds/inventory.of=seeds.case=S2-the-fulcrum-council-settles-three.md`.

| call | best-guess | the verdict | upheld? |
|---|---|---|---|
| `F4` | reject unknown keys | 🔴 **keep the drop — the parser stays permissive** | ❌ **overturned** |
| `F10` | the value is a rhachet brainslug | 🔴 **the value is the brain-cli's own `/model` argument** | ❌ **overturned** |
| `F12` | driver-only | driver-only | ✅ upheld |
| `F5` | ask `rhachet` for a live-brain field | ✅ **ruled 2026-09-13** — *"silent failure is fine for now… it totally should [have the field]."* ⇒ **accept the corner, dispatch the ask** | ❌ **converted** — a dependency became a todo |
| 🔴 `F14` | *(raised after the council)* compare, then set | ✅ **converge — set unconditionally.** resolved 2026-09-11 by a **research answer**, never a preference | ❌ **overturned** |

## 🔴 .three of four wisher touches OVERTURNED a best-guess, and each by a different mechanism

| the call | what overturned it |
|---|---|
| `F4` | a **stated preference** — forward compat over a loud typo |
| `F10` | a **stated preference** — the hand at the keyboard |
| 🔴 `F14` | **a FACT.** *"it preserves the conversation"* — no preference entered into it |

⇒ 🟡 **the third is the one to learn from.** `F4` and `F10` needed a wisher's judgment and could not
have been settled here. **`F14` needed a live session and one turn** — it was answerable all along,
and it sat five review rounds on a `[research]` list graded *nice to know* while the design was
built around its unknown answer.

⚠️ **the triage tags had no way to say so.** `[research]` marks *"an observation settles it"* and says
naught about **what the observation decides**. a question that gates a design belongs above every
preference in the queue, and this inventory could not express that rank.

⇒ 🔴 **two of three best-guesses were overturned, and both on the ground their own counter-case
named.** `F4`'s counter argued forward compatibility; `F10`'s argued the hand at the keyboard. **each
file had the winning argument written down and ranked second.**

🟡 **that is what the practice is for, and it is worth stating plainly rather than passing over.** a
fulcrum that records only its taken answer would have shipped two wrong calls silently. a fulcrum
that states its counter-case fairly lets a wisher rule in one word — which is exactly what happened,
twice, in one message.

### the two consequences that propagate

- **`F2` is now load-carrying.** with the key set open, the warned `model:` alias is the **entire**
  defense against `case=4`. it was a courtesy while a closed set backed it up
- **`F5` grew a new argument against it.** with the declared value in the `/model` vocabulary, a
  live-brain compare needs a `#2 → #3` map that the *declare rather than detect* build needs not at
  all

### 🔴 the third consequence, found 2026-09-10 when the wisher asked after `clone get`

> **we ourselves can verify it was accepted via clone get followup, no?**

⇒ **yes, and the two consequences above were HALF a record.** `rhx clone get` ships today, reads the
brain-cli's **own transcript**, and emits directioned JSON — so the brain's reply is machine-readable
without any ask on `rhachet`. and its compare stays **inside** the `/model` vocabulary the ruling just
adopted.

| the `F10` ruling | its effect |
|---|---|
| on `whoami --brain` | 🔴 **dearer** — it must bridge `/model` ↔ brainslug. *recorded* |
| on a **transcript read** | ✅ **cheaper** — argument and reply share one vocabulary. 🔴 **not recorded** |

🔴 **the durable lesson: a ruling that changes a value's VOCABULARY re-prices every candidate that
compares it — in both directions.** this inventory recorded the cost and missed the credit, so `F5`
went to council with a candidate list one option short. ⇒ `.seeds/…case=S3-clone-get-reads-the-reply.md`

## 🔴 .the EXECUTION stone raises fulcrums too — `F15`–`F19`, all 2026-09-14

the section below was true when it was written and is **stale as of `F15`**. it read *"the route
carries NO open dirty fulcrum"*, and that was a claim about the vision stone's set.

⇒ 🟡 **an execution stone raises fulcrums too, and this inventory was shaped as though it would not.**
every row above `F15` was raised at the vision; these five are the first raised by a self-review on
code, and each subject is a call the vision could not have made because the code did not exist yet.

⚠️ **and it is the third instance of the stale-citation class this inventory already names** — the
`F8` section calls it out, the r1 review called it out, and a prose summary of a table drifted from
the table again. **a count beside a list is a copy, and copies drift** (`declare-once`).

🔴 **and this header was ITSELF an instance, one round after it said so.** it read *"`F15`, `F16`, and
`F17` re-open the dirty column"* while the table beneath it listed four rows — `F18`, which is
**clean**. ⇒ **a header that enumerates is a copy of the table under it**, and the repair is the one
the `F8` section already prescribes: **the header names the class, and the `rework` column names the
dirt.**

🔴 **the five fail in five directions, and each needed a different lens to find it.**

| the call | rework | what it is | the lens that caught it |
|---|---|---|---|
| `F15` ✅ | 🔴 dirty | a mechanism this round **built** that bypasses a convention — ⇒ **resolved in the same round: the rejected mechanism was built instead** | `has-consistent-mechanisms` — a read of the diff |
| `F16` ✅ | 🔴 dirty | a demoed path this round **did not build** at all — ⇒ **settled at i033: a peer reviewer raised it as a blocker and it was built** | 🔴 `behavior-declaration-coverage` — a read of the **vision**, which is the only lens an absence is visible from |
| 🔴 `F17` | 🔴 dirty | a shape this round built that is **locally consistent and rule-divergent** | `behavior-declaration-adherance` — and only once the rule was consulted rather than the neighbours |
| 🔴 `F18` | clean | a behavior this round built **from the vision's own SUMMARY** where its TIMELINE says the opposite | `behavior-declaration-adherance` — and only once the timeline was read line by line rather than recalled |
| 🔴 `F19` | clean | a name this round chose that conforms to **97 neighbours** and diverges from a booted BLOCKER rule | `role-standards-adherance` — and only once the neighbours were **counted** rather than glanced at |

🔴 **`F17` and `F19` are one class seen from opposite sides, and that pair is the durable find.**
both are *"the local pattern says X, the booted rule says Y"* — and they resolved **opposite ways**:

| | the local pattern | the call taken |
|---|---|---|
| `F17` | 5 optional peers on one object | 🔴 **defer the conform** — 54 type errors, 52 in suites this feature never opened |
| `F19` | 97 divergent peers across the repo | 🔴 **conform to the local pattern** — 2-of-122 cannot reach the rule's network-effect benefit |

⇒ **so the answer is not *"follow the rule"* nor *"follow the neighbours"* — it is the COST of the
conform against the BENEFIT the rule sells.** a rule whose value is uniformity is worth naught at 2%
adoption; a rule whose value is per-site (`forbid.undefined-attributes` prevents one specific hazard
at each field) retains that value at any adoption — which is why `F17` is a debt and `F19` is a
question.

⇒ **`F17` is the one a careful reviewer is least likely to catch, and its reason is instructive.**
the r4 conventions review DID grade this field against its five peers and DID find it consistent —
on the axis it happened to check. **a consistency check picks its own axis, and the axis it picks is
usually the one already on the author's mind.**

🔴 **`F18` is the sharpest of the four, because the build was FAITHFUL — to the wrong artifact.**
`F2`'s title says *"`model:` parses as a warned alias"* and the yield repeats it, so a build that
reads the summaries is adherent by its own lights. only `case=4`'s `[t4]`–`[t6]` says otherwise, and
it says so three times.

⇒ **the durable form: when a vision's summary and its timeline disagree, the TIMELINE is the
specification and the summary is a copy that drifted.** a summary is written once and restated; a
timeline is walked timestep by timestep and graded. ⚠️ **and an adherance review that reads the
summaries cannot detect this class at all** — it will agree with itself.

## 🔴 .three open calls turn on ONE persisted object — rule them together, or pay twice

`F21`, `F22`, and `F23` each carry a 🔴 dirty grade, and each earned it from the **same** record:
`DriveBlockerState { count, stone }`.

| the call | what it wants from that record |
|---|---|
| `F21` | a **timestamp**, so a failed apply can dwell rather than retry every tick |
| `F22` | a **separate field**, so the brain entry marker stops to share `stone` with push-block attribution |
| `F23` | a **timestamp**, so a tick knows which log write it just read |

⇒ 🔴 **`F21` and `F23` want the identical field, and `F22` disputes the record's shape outright.** so
the order a council rules in decides the price: rule `F22` first and the other two land inside a
contract change already paid for; rule them apart and the same resnap is bought three times.

⚠️ **no one file could have said this.** each fulcrum grades its own rework honestly and in isolation,
and three honest *"this is dirty"* grades sum to one *"this is dirty once"*. ⇒ **a convergence across
members is the summary's to find, and it is the argument for a root that is more than a link list.**

### 🔴 .and `F16` was a FOURTH claimant on that record, which nobody noticed until it was built

`F16`'s file argued that `DriveBlockerState` **could not** carry the attribution, because the del
erases it on passage. ⇒ so it read as a call **about a different artifact** and sat outside this
convergence — while its real subject was the same record as `F21`, `F22`, and `F23`.

| | what the file said | what the build did |
|---|---|---|
| the record | *"a field on it is not the fix"* | 🔴 **a field on it was exactly the fix** |
| the del | an invariant that forbids the field | a **defect** that was narrowed |

⇒ **so a convergence is invisible where one member has mis-diagnosed which artifact it touches.** the
summary can only cross-reference what the members declare, and `F16` declared the wrong subject.

🟡 **the practical consequence is unchanged and now sharper: whoever rules `F22` must read `F16`'s
shipped field too.** `DriveBlockerState` now carries `{ count, stone, brain }`, so a shape dispute
has one more field in it than `F22`'s own table lists.

## .both VISION-stage dirty calls are ruled — and none of `F15`, `F16`, `F17` is one of them

| the call | ruled | how it stopped to be dirty |
|---|---|---|
| `F4` | 2026-09-10 | the wisher chose the **permissive** parser, so no downstream guard changes behavior |
| `F5` | **2026-09-13** | 🔴 **re-graded, never merely answered.** it was dirty as a *dependency*; as a *todo* it reaches no local code at all |

🔴 **`F5`'s re-grade is the durable part, and it exposes a mis-grade this inventory carried for four
days.** dirt is a property of the **rework if the call is reversed** — and an ask that no local code
is written against has no rework to speak of. ⇒ **the reach and the dependency were read as one
question**, and only the second of them was ever dirty.

⚠️ **so a `dirty` grade earned solely by *"it reaches another repo"* is suspect on its face.** the
test is not *where does it reach* but *what would we tear down if it were reversed*.

## 🟡 .the record of why the pair was graded dirty

**`F4` and `F5` were the dirty pair**, and they were dirty for the same stated reason: each reaches
past this route's diff.

- `F4` changes parse behavior for **every guard file in every repo** that consumes bhrain. its
  reversal is a teardown, not a rename
- `F5` is an ask on **another repo** (`rhachet`), on another release cadence

⚠️ **`F5` is a DOWNGRADE, not a stall — corrected at self-review r2.** it read *"a hard dependency,
not a preference… case 3's critipath cannot be closed without it."* that overstated it: the three
candidates weighed were all **detection** mechanisms, and a fourth was never considered — **declare
rather than detect**, which costs no cross-repo ask at all.

⇒ so a refusal does not stop the feature. ~~`case=3`'s halt becomes a labelled uncertainty, and
`case=8`'s cost claim becomes a request log~~ — 🔴 **struck 2026-09-10.** the r2 correction found
**one** free option where **two** exist:

| | needs `F5` | free |
|---|---|---|
| **detect** | `whoami --brain` — a fact about **state** | 🔴 **`clone get` — the brain's own REPLY** |
| **declare** | — | the honest label |

⇒ **so a refusal keeps `case=3`'s halt** (it fires on the refusal in the transcript) and leaves
`case=8`'s claim at *verifiable-to-the-reply* rather than at a request log. **the loss is one grade,
and it is the SILENT refusal** — a brain that declines with no word.

**still a rework rather than a redesign**, which is why it can be answered after the blueprint stone.

## .what a council read owes

the rest are best-guesses with clean reversals — a rename, a flag, a default flip. they are recorded
so the wisher can overturn any of them cheaply, and so no later reader re-derives an argument that
was already had.

## 🔴 .`F7` moved 60% → 85% at self-review r3, and it de-coupled `F5`

`F7` read *"the one most likely to move once the blueprint stone reads the route engine closely."*
**that read happened at r3, and it raised the call rather than moved it:**

> `onStop` already persists the stone it last saw — `DriveBlockerState { count, stone }`, written at
> `stepRouteDrive.ts:295`, read at `getDriveBlockerState.ts:22-25`. **`stateBefore.stone !== stone.name`
> IS the stone-entry edge**, with no new persistence and **no live-brain read**.

⇒ 🔴 **so `F7` no longer depends on `F5`.** the vision had the two chained — `F7`'s counter-case read
*"it depends entirely on `F5`"* — which made a refusal of the dirtiest item read as a collapse of the
entry mechanism too. **it is not.** the live compare is now for `case=3`'s verification only.

⚠️ **the field is written and never read**, so a grep for its use returns no hit. it was found only by
a read of its **writer** — which is why a summary-grain pass missed it twice.

⇒ **`F10` at 65% is now the lowest, and it is a different KIND of low.** `F7` was a judgment a closer
read sharpened; `F10` rests on a premise nobody has checked — whether a brainslug can be mapped to a
`/model` argument at all. **a research question, not a preference**, and one read of the brain-cli's
`/model` surface settles it.

## 🟡 .what self-review r1 changed here

four entries moved on measured evidence rather than on further thought:

| | what moved | why | found by |
|---|---|---|---|
| `F2` | 85% → **90%** | the issue's premise was wrong. `rhx enroll` ships no `--model`; `rhx review --brain <slug>` is the live per-review lever, so `brain:` **conforms** to precedent rather than argues against a convention | `rhx enroll --help` |
| `F10` | **new** | three vocabularies meet at this field and the vision named one | `rhx review --help` |
| `F11` | **new** | `🧠` is claimed for rung 0. the renders took it for a second concept, and a glyph claim is not a vision act | `catalog.of=glyph._.md` |
| `F12` | **new** | a guard **already** declares brains — one per reviewer. the new key's scope against them was never stated | a read of an extant `.guard` |

⇒ not one was found by a re-read of the vision. **four artifacts i had not opened, and each held a
fact that moved a call.**

🔴 **`F12` is the sharpest of the four, and the cheapest to have found.** it needed one read of a
guard file — the very artifact this feature adds a key to — and it was the only fulcrum here raised
by the **experience** review rather than the groundwork one, because it surfaces only when you ask
*"what does the author FEEL when they open that file?"*

## 🔴 .`F8` moved 80% → 75% at self-review r4, and the reason is a STALE CITATION

`F8` titled itself *"four axes, not three or five"* and restated the rejected-axes list inline. r3
admitted a **fifth** axis in `1.vision.experience.dimensions.md`, and `F8` still read *"four"* a full
round later.

⇒ **the defect is not the count; it is the copy.** a fulcrum that restates a peer artifact's content
must be re-read whenever that artifact is amended, and nobody re-reads a citation they wrote
themselves. the inline list is now a pointer.

⚠️ **and it is the second instance of one class in this stone** — the r1 review named the same shape:
an amendment lands in one artifact and its citations are not re-read. **two occurrences make it a
pattern, and the pattern's fix is structural**: a fulcrum cites, it does not copy.

## .see also

- `1.vision.yield.md` — the open questions these fulcrums feed
- `1.vision.experience.case=_.md` — the walked space several of these calls decide
