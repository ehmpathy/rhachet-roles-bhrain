# rule.require.classify-the-yields-document-kind

## .what

> **pick the yield's document kind while the research is still open — never after the draft is
> written.**

the prefix is what tells a future reader what they hold. five kinds, and the question each answers:

| prefix | the question it answers | the reader is about to… |
|---|---|---|
| `whento` | under which conditions does this apply? | **judge fit** |
| `howto` | what should I do, and how? — includes SELECTION | **act** |
| `howdoes` | how does the machine actually work? | **reason** |
| `hazard` | what trap will bite me, and what is its fingerprint? | **recognize** a failure they are inside |
| `rule` | what is enforceable here, and at what severity? | **obey** |

## .why the choice belongs to the RESEARCH, not to the draft

**a kind picked at authorship classifies what you wrote. a kind picked mid-research reveals what
you did not.**

⇒ measured: `rule.require.classify-the-yields-document-kind.example=howdoes-gap.md` — six briefs
whose most valuable member was written last, with the least evidence, because the kind it belonged
to surfaced only after the probes had closed.

## 🔴 .the `howto` / `howdoes` split is the decisive one

it is the pair most easily collapsed, and the collapse is what produced the case above:

- **howto** = *what should I do* → the reader is about to **act**
- **howdoes** = *how does it work* → the reader is about to **reason**

a howto says *"reach for X"*. only a howdoes says **why X works and what it does NOT do.**

⇒ **a repo with howtos and no howdoes teaches people to follow steps they cannot reason about.**
outside the decision tree they have no ground. no tree enumerates every case.

## ⚠️ .`hazard` vs `rule` — each can wear the other's prefix

| kind | carries | the tell it is mis-prefixed |
|---|---|---|
| **rule** | a severity, and a claim that is enforceable | a `hazard` whose real content is *"do not do X"* is a **rule** in the wrong coat |
| **hazard** | a **diagnostic fingerprint** — how to recognize a failure you are already inside | a `rule` with **no severity** is a **hazard** in the wrong coat |

⇒ the discriminator is **tense**. a rule fires *before*; a hazard is read *after*, by someone who
already has the symptom and needs to name it.

## .the cues — when → then

| when… | then… |
|---|---|
| you finish `3.3.probes.absorb.gaps` | 🔴 classify **there**, one kind per planned brief — the gap list is the last moment a missed kind is still cheap |
| you plan a `howto` for a mechanism the reader must reason about | 🔴 the `howdoes` is owed too, and it is probably the more valuable of the two |
| you write an **anti-pattern table** inside a howto | those rows do hazard work without hazard structure. split them out |
| a doc's real content is *"do not do X"* | that is a `rule`. give it a severity |
| a doc names a failure with no severity and no fix-forward | that is a `hazard`. give it a fingerprint |
| you reach for a kind that **does not exist in the repo yet** | 🔴 the strongest signal there is — you found a gap the set does not cover. name the prefix |
| you classify **after** the draft is finished | you classified the writeup, not the research. the gap it would have surfaced is already lost |

## .the test — forced articulation, at the gap list

for each brief the blueprint plans, answer on the page:

> **"what is the reader about to DO — judge fit, act, reason, recognize, or obey?"**

- one answer → that is the kind
- **two answers** → it is two briefs. split it
- **an answer with no brief planned for it** → 🔴 that is the gap. **probe for it while the
  research is still open**

## .why this is TAUGHT, not guarded

a guard fires **at yield time**, after the probes have closed. so it can catch an unclassified
brief and it can never catch the **missed** one — which is the whole value.

⇒ so the rule is taught at `3.3.probes.absorb.gaps`, where the gap list forms. a guard would grade
the classification's presence, never its correctness.

## ⚠️ .the set is open

`define` and `ref` are live prefixes elsewhere in this org and are not among the five. a sixth kind
may be owed.

⇒ *"the kind I need is absent"* is a **legitimate discovery**. name the prefix, say what question
it answers, and add it here.

## .enforcement

- a research yield with no kind chosen = **blocker**
- a kind chosen after the draft was finished = **blocker** — it classifies the writeup, not the
  research
- a `howto` for a mechanism, with no `howdoes` planned and no reason it is not owed = **blocker**
- an anti-pattern table inside a `howto`, which does hazard work with no hazard structure =
  **nitpick**
- a `hazard` whose content is *"do not do X"*, or a `rule` with no severity = **blocker**
- a brief that answers **two** of the five questions = **blocker** — split it
- a new prefix proposed, with the question it answers stated = **not a violation** — the set is
  open

## .see also

- `rule.always.reach-for-bhrowser` — the peer: the yield's **depth** is decided too
- `rule.forbid.websearch-and-webfetch` — the third peer: its **fidelity**. depth, fidelity, shape —
  and each is settled while the research is open, never after the draft
- `readme.md` — the five-phase route; this fires at `3.3.probes.absorb.gaps`
- `kno201.documents._.[catalog]` (librarian) — the archetype set a curated brief lands in
- `rule.require.enumerate-before-you-name` (learner) — the same move for a term: list the
  instances before you pick the word
