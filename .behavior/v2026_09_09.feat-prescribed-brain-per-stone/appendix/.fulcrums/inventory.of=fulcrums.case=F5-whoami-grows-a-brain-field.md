# F5 — `clone whoami` grows a `brain` field

**rework** = 🔴 **dirty** · **status** = ✅ **ruled 2026-09-13** — accept the silent corner; the ask
stands upstream, and this route does not wait on it · **confidence** = n/a, the call is made

## ✅ .the verdict — silent failure is accepted, and the ask is dispatched rather than depended on

> *"silent failure is fine for now. lets leave a todo to fix that once rhx whoami includes brain. it
> totally should."* — the wisher, 2026-09-13

⇒ **the fork is cut in two, and each half goes somewhere different:**

| the half | where it lands |
|---|---|
| does **this route** wait on a live-brain field? | 🔴 **no.** the silent corner is accepted as-is |
| **should rhachet have one?** | ✅ **yes** — dispatched as an upstream ask, never held as a dependency |

🟡 **that split is what makes the dirty rework stop to matter.** `F5` was dirty because it reached
another repo on another cadence. a **dependency** on another cadence blocks; an **ask** on another
cadence does not. the verdict converts one into the other and the blast radius goes to zero.

### 🔴 why the accepted cost is the status quo, never a regression

an undetected silent refusal leaves the stone on the **inherited** brain — which is precisely what
every drive does today, before this feature exists.

⇒ **so the accepted failure mode is a non-improvement in one corner, never a corruption.** that is
the property that makes the verdict cheap, and the reason the corner was affordable to accept: a
defect that degrades to the pre-feature behavior costs nobody what they had.

⚠️ **and it has never been observed.** no first-party run has produced a silent refusal — the
`clone get` transcript read that would confirm or refute one is still open research. ⇒ **the ask is
dispatched on a failure mode we infer rather than one we measured**, and the upstream issue must say
so plainly rather than overstate the need.

## ✅ .the todo is dispatched — `ehmpathy/rhachet#528`, 2026-09-13

the ask now lives where it can be acted on, rather than only where it was noticed.

🟡 **it was caught 2026-09-09 and dispatched 2026-09-13** — four days local, and invisible as a gap
because the dream existed, was symlinked, and was cited from this file. ⇒ **a catch is not a
dispatch**, and the cited-ness is what made the omission hard to see.

## 🟡 .what the todo is, and where it lives

- the dream — `.dream/v2026_09_09.reseed.clone-whoami-cannot-report-the-live-brain.md`
  - it carries the shape of the fix and the one design question that must precede it
  - 🔴 **launch-time or live?** a launch-time field is strictly worse than the shipped `clone get`
    for this caller — it goes stale the moment a `/model` is typed, and it answers a different
    question while it looks like the right one
- the follow-up here — once `whoami` reports the **live** brain, the verify step upgrades from a
  transcript read to a state read, and the silent corner closes

⇒ **no code in this route is written against the absent field**, so the upgrade is an addition rather
than a rework. that is what keeps the todo cheap to leave open.

## .the prior grades, kept for the record

**confidence** ran 70% → 45% (the `clone get` candidate, 2026-09-10) → **40%** (`F14` removed the
apply-side caller, 2026-09-11). the verdict supersedes the number rather than continues it — a
confidence grades a guess, and this is no longer a guess.

## 🔴 .`F14` narrowed the ask a second time — amended 2026-09-11

this fulcrum was raised when the **applier** needed a live-brain read. it no longer does:

| the act | does it need a live-brain read? |
|---|---|
| **apply** the declared brain | 🔴 **no** — `F14` resolved to a convergent applier; it holds no belief and compares naught |
| **verify** the brain took it | yes, or a read of its reply (`clone get`) |

⇒ **so `F5` serves exactly one act now, and only one corner of it: a SILENT refusal at verify.**
a spoken refusal is caught by `clone get`; a drifted refusal text defeats `clone get` and not this.

🟡 **that is the second cut in two days, and both came from the wisher.** the ask began as *"case 3's
critipath cannot be closed without it"* and is now *"it catches the corner where the brain declines
with no word."* ⇒ **an ask should be re-priced every time a design decision removes one of its
callers**, and this one had two callers removed before anyone re-priced it.

## .the fork, stated fairly

case 3 requires the driver to compare its **live** brain against the **declared** brain, because
`clone say` proves submit and never accept.

**there is no surface that reports a clone's live brain.** `clone whoami` returns serial, slug,
reach-state, and actor hash (`invokeCloneWhoami.js:74-80`) — no model.

⚠️ **that sentence is true and it framed this whole fulcrum too broadly.** *no read of the brain's
STATE* is not *no read at all* — `rhx clone get` reads the brain's **reply**, and that is what
`case=3`'s check needs to fire. ⇒ the correction is the fifth candidate below.

the candidates:

| candidate | cost |
|---|---|
| **`clone whoami` grows a `brain` field** | a cross-repo ask on `rhachet` |
| the driver self-reports its own brain | a probabilistic self-report of the very fact under question |
| ~~parse the brain-cli's answer from the transcript~~ | ~~brittle — a prose format nobody promised to keep~~ 🔴 **struck 2026-09-10 — see below. it graded a scrape, and the surface is shipped** |

## .taken, and why at the time

**`clone whoami` grows a `brain` field.**

it is rhachet's own record to keep — rhachet spawned the clone and knows the `--model` it passed. it
serves every caller, not only this one. and it is the only candidate whose answer is a **fact**
rather than an inference.

## .the counter-case, stated fairly

it is an ask on another repo, on another release cadence, and this route cannot land it. that is a
real sequencing cost, and the issue already flags a related one (`enroll-with-interface` in flight).

⚠️ and the field would report the brain rhachet **launched** the clone with — which drifts the moment
a human types `/model` by hand. so the field answers "what did enroll set" rather than "what is the
brain right now", and those diverge exactly in the case that matters.

⇒ that gap is not resolved here. it may mean the honest surface is the brain-cli's, not rhachet's.

## .rework, and why 🔴 dirty

another repo, another release, and this route's critipath would be built against its contract. to
reverse it is to redesign case 3's verification, not to flip a flag.

## 🔴 .the fourth candidate, added at self-review r2 — DECLARE rather than detect

the three candidates above are all **detection** mechanisms, and the comparison silently assumed
detection is required. it is not:

> **do not verify the switch. label it.** the record says *"switch requested — unconfirmed"* rather
> than *"brain switched"*, and case 3's halt becomes a stated uncertainty instead of a check.

| | detect (the three above) | declare |
|---|---|---|
| cross-repo ask | 🔴 yes, on `rhachet`'s cadence | ✅ **none.** it ships entirely within this route |
| what a reader gets | *"5.3 ran on opus"* — a fact | *"5.3 requested opus; not confirmed"* — an honest bound |
| the cost claim of `case=8` | ✅ checkable | 🔴 **weakened to a request log.** a bill still cannot attribute spend to a stone |
| what happens on a refused slug | a halt, at the moment it matters | the stone runs on the prior brain, labelled, and nobody is stopped |

⇒ it is a **weaker guarantee that costs no dependency**, and it was never weighed.

## ⚠️ .so the "dependency, not a preference" claim is narrower than it was written

it read: *"case 3's critipath cannot be closed without it."* **corrected at r2** — case 3's critipath
can be closed two ways, and they differ in strength rather than in feasibility:

| the ask | what it buys |
|---|---|
| grant `F5` | `case=8`'s cost claim becomes **verifiable**, which is that case's whole argument |
| ~~refuse `F5`~~ | ~~the feature still ships. `case=3` becomes a label, `case=8` becomes a request log~~ 🔴 **struck 2026-09-10 — see the fifth candidate.** a refusal leaves a `clone get` check in place, so `case=3` keeps its halt and `case=8` keeps a claim two grades above a request log |

⇒ **it is still the highest-consequence item here**, and the consequence is a *downgrade* rather
than a *stall*. that distinction matters to a council: a stall must be answered before the blueprint
stone; a downgrade can be answered after it, at the price of a rework in `case=8`.

🔴 **and the downgrade is one grade rather than two.** the r2 correction had the shape right and the
magnitude wrong, because its candidate list held one free option where two exist.

## .confidence, and why 70% — unmoved, and now for a stated reason

the direction is right — a fact beats an inference. the 30% is the drift gap above: a launch-time
record may not be the right source, and the alternative (ask the brain-cli directly) was not
explored, because no such surface was found in one pass.

⚠️ **the number does not move on the fourth candidate**, because `declare` does not compete with
`whoami --brain` on the same axis — it competes with the *requirement*, not with the mechanism. the
fork this fulcrum grades is unchanged; what changed is the price of a rejection.

## .where

`1.vision.experience.case=3.the-slug-the-brain-rejects.md` — `[t2]`, and its open-question section.

## 🔴 .a THIRD cost, added 2026-09-10 by the `F10` ruling — the vocabulary bridge

the council put the declared value in the brain-cli's own `/model` vocabulary. rhachet records brains
as **brainslugs**. so a live-brain compare now spans two vocabularies rather than two spellings of
one:

| what the compare bridges | the instrument |
|---|---|
| before the ruling — `opus` ↔ `anthropic/claude/opus` | ✅ `getBrainSlugFull`, already shipped |
| 🔴 after the ruling — a `/model` argument ↔ a brainslug | 🔴 **no shipped surface bridges them** |

⇒ 🔴 **the bridge is a cost only the DETECT build pays.** `declare` compares no vocabularies at all —
it records the string it dispatched and labels it unconfirmed.

⚠️ **and this is precisely the map `F10`'s own counter-case doubted could be written**: *"the `/model`
argument set is the brain-cli's, it is undocumented here, and it changes without our release."* the
ruling did not answer that doubt — **it moved the doubt from the dispatch onto this fulcrum.**

⇒ so the fork's price changed even though the fork did not. **grant `F5`** now buys a verifiable cost
claim **and** owes a bridge whose feasibility is unverified. **refuse `F5`** and the bridge is never
needed.

🟡 **the confidence stays at 70% and its composition changed.** the 30% was one doubt — whether a
launch-time record is the right source. it is now two, and the second is the bridge.

## 🔴 .confidence, re-graded to 45% on the fifth candidate

**the direction is no longer clearly right.** a fact still beats an inference — but a fact that costs
a cross-repo ask **plus** a bridge of unverified feasibility, against an inference that costs naught
and is already shipped, is a trade rather than an improvement.

| the 55% | the 45% |
|---|---|
| a silent refusal defeats `clone get` and cannot defeat a state read | the state read is a **launch-time** record, so a hand-typed `/model` defeats it too |
| a refusal whose text changes defeats `clone get` | 🔴 **and the bridge that `whoami --brain` owes has no shipped instrument, so its own feasibility is unverified** |

⇒ 🔴 **both mechanisms are defeated by a drift the other is not.** `clone get` misses a silent
refusal; `whoami --brain` misses a hand-typed switch. **neither is a clean superset**, and this file
argued for eight rounds as though one were.

### 🔴 45% → 40% on `F14`, 2026-09-11

the `F14` verdict removed the **apply** caller outright — a convergent applier reads no live brain —
so the ask now serves the **verify** act alone, and only its silent-refusal corner.

🟡 **and row 1 of the 55% column above just got weaker on its own terms.** it reads *"a silent
refusal defeats `clone get` and cannot defeat a state read"* — true, and under a convergent applier a
hand-typed `/model` is **repaired at the next stone with no read at all**. ⇒ so the drift
`whoami --brain` was uniquely placed to catch is now the drift the design self-heals, and what the
ask buys narrows to one corner of one act.

⚠️ **every re-grade so far has moved DOWN, and each was triggered by a wisher's question rather than
by a review round.** that pattern is itself the lesson: **this file's author re-read its own argument
eight times and moved the number zero times.**

## 🔴 .the FIFTH candidate, raised 2026-09-10 by the wisher — `clone get` reads the reply

> **we ourselves can verify it was accepted via clone get followup, no?**

⇒ yes. **`rhx clone get @:<slug> --tail N --output json` ships today**, and the third row above graded
it as though it did not:

```
invokeCloneGet.js:51-61  —  "get observes a clone's recent CONVERSATION without a terminal
                             takeover. it reads the brain-cli's own transcripts, so it works
                             on a DEAD clone that has output — no reach probe, no cred gate"
                            "each turn a `← say` / `→ reply` header over its body, so a reader
                             tells an inbound dispatch from an outbound reply"
asCloneMessage.d.ts      —  { direction: 'in' | 'out'; text: string; at: string | null }
```

**the third row said *"a prose format nobody promised to keep."*** that is the correct grade for an
**ad-hoc scrape** of a terminal. it is the wrong grade for a **contracted, directioned, JSON-emitting
surface** that rhachet ships and versions. ⇒ the row was struck rather than amended, because the
candidate it named is not the candidate that exists.

### 🔴 the compare it runs — and why the `F10` ruling made THIS candidate cheaper

`case=3`'s whole seam is that the refusal comes back *"in band, in prose, in the transcript — not
through the socket the hook holds."* **that transcript is what `clone get` reads.**

| the compare bridges | the instrument |
|---|---|
| `whoami --brain` — a `/model` argument ↔ a rhachet **brainslug** | 🔴 two vocabularies. **no shipped surface** |
| 🔴 **`clone get` — a `/model` argument ↔ the brain-cli's OWN reply** | ✅ **one vocabulary. no bridge owed** |

⇒ 🔴 **the third cost this file recorded above cuts BOTH ways, and only one half was written down.**
the `F10` ruling put the declared value in the brain-cli's vocabulary — which made a
cross-vocabulary compare dearer **and a within-vocabulary compare free**. this file filed the first
and missed the second.

### what it buys, and what it does not

| | `whoami --brain` | 🔴 `clone get` | `declare` |
|---|---|---|---|
| cross-repo ask | 🔴 yes | ✅ **none — shipped** | ✅ none |
| what it observes | the **live brain** | the brain's **own reply** | naught |
| the claim it supports | a **fact** | a strong **inference** | an honest **label** |
| vocabulary bridge | 🔴 owed, feasibility unverified | ✅ none | ✅ none |
| a **silent** refusal | ✅ caught — the state is read | 🔴 **missed** — no reply, no evidence | 🟡 labelled unconfirmed |
| a refusal whose text changes | ✅ caught | 🔴 **missed** | 🟡 labelled unconfirmed |
| `case=8`'s cost claim | ✅ verifiable | 🟡 **verifiable to the reply's honesty** | 🔴 a request log |

⚠️ **the two 🔴 rows are the whole residue, and they are the same defect**: a read of a **reply** is
only as good as the reply. a brain-cli that refuses silently, or that alters its refusal text, defeats
it — and defeats it **quietly**, which is the failure mode `case=3` exists to prevent.

⇒ so it does not retire `F5`. it **demotes** it: from *"the only mechanism"* to *"the strongest of
three, and the only one that survives a silent refusal."*

### the timeline it slots into — already cut

it cannot run at dispatch: the reply does not exist yet. that is `case=5`'s re-entrancy, and
`case=5` `[t4]` already places the confirmation *"on the NEXT turn."* ⇒ **no new sequencing cost.**

### 🔴 the trial RAN, 2026-09-16 — and the fifth candidate does not work on this host

this section closed with *"unverified by trial. `rhx clone whoami` from here returns `not run inside
an enrolled clone`."* **both clauses are now false, and the second was the false one that mattered.**

| the probe | what it returned |
|---|---|
| `rhx clone whoami --output json` | ✅ `{ serial: afb89825…, slug: null, reachState: "LIVE" }`, exit 0 |
| `rhx clone get @:afb89825… --tail all --output json` | 🔴 **`{ total: 0, exidsUnreadable: 0, exidsAmbiguous: 0 }`** |
| `rhx clone list --output json` | 🔴 **`exid: null` on all 29 clones of both actors** |

⇒ 🔴 **`clone get` keys its read on `exid`, and no clone here carries one.** so it returns an empty
transcript for the LIVE clone and for all 28 dead ones — **for this host it observes naught at all.**

**the comparison table above is amended rather than struck**, because its columns are right about the
*contract* and wrong about the *deployment*:

| the row | as graded | as measured here |
|---|---|---|
| `clone get` — cross-repo ask | ✅ none, shipped | ✅ **unchanged** — it is shipped |
| `clone get` — what it observes | the brain's **own reply** | 🔴 **naught**, absent an `exid` |
| `clone get` — the claim it supports | a strong **inference** | 🔴 **no claim at all** on this host |

⚠️ **this does NOT reopen the ruled verdict.** the wisher's *"silent failure is fine for now"* accepts
the corner regardless of which read surface is the strongest, and the amendment moves an argument
rather than a decision. ⇒ what it changes is the **upstream ask**: `ehmpathy/rhachet#528` was filed on
the premise that `clone get` covers the spoken half and `whoami --brain` is owed for the silent half.
**that premise is wrong here — neither half is covered** — and the issue should say so.

🔴 **and the durable lesson is the one `rule.require.trust-but-verify` names.** this file argued the
fifth candidate through six rounds from a read of `invokeCloneGet.js` and `asCloneMessage.d.ts`, and
one invocation refuted it. **a contract read tells you what a surface promises; only a run tells you
what it returns.**

## .the verdict

open — for the fulcrum council. ⚠️ still the highest-consequence item here, and 🔴 **the last of the
four unanswered** — but the question it puts has changed:

| it was | it is now |
|---|---|
| *"grant a cross-repo ask, or accept a label?"* | *"is a read of the brain's own **reply** enough, or is a read of its **state** owed?"* |

⇒ **the price of a refusal fell.** a refused `F5` now costs the two 🔴 rows above rather than the whole
detection, and `case=8`'s claim degrades to *verifiable-to-the-reply* rather than to a request log.
