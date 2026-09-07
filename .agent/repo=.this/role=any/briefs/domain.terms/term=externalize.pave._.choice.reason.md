# domain.term.choice.reason: pave

## .etymology

**pave** — from latin *pavire*, "to beat down, to ram, to tread firm." a road is not laid by an
act of addition; it is laid by **compaction** of a route people already walked.

that is exactly the discipline the word names here. a term is not invented and then imposed — a
concept is walked, argued, and re-derived by several travelers, and **pave** is the act that
compacts that worn line into something permanent.

chosen over four alternatives, each of which drops one property the domain needs:

| rejected | what it loses |
|---|---|
| `crystallize` | names the outcome (a hard, finished form), not the act that produces it — and it implies a state that cannot be reworked, where a paved road can always be re-paved |
| `externalize` | the generic act — to move any thought out of a head. `pave` is the specific form: lay it as a durable path **for a future traveler** |
| `coin` / `mint` | both imply novelty — a new word struck for the first time. `pave` is neutral on novelty, so it covers a repave of an extant term, which is the common case |
| `document` | records what is; it drops the whole malleable-hardens gradient, and it is silent on who walks after |

## .the malleable-hardens gradient — why the road metaphor is apt

this is the property that earned the word, and it is the reason to record it rather than merely
use it:

| stage | the road | the term |
|---|---|---|
| **fresh** | wet, re-gradable, cheap to move | one brief uses it; a rename costs one edit |
| **trafficked** | hardened under use; a re-grade closes the road for everyone | contracts, briefs, and downstream refs lean on it; every consumer inherits the change |

⇒ **the cost of a repave is a function of traffic, over age.** it is the same cost gradient
`rule.forbid.domain-term-synonyms` names when it says a published interface is the most expensive
place to drift — a synonym in a cli or sdk is inherited by every consumer, forever.

so the discipline the metaphor prescribes is: pave early, while the concrete is wet.

- a term itemized at the moment it is coined costs one file
- the same term itemized after ten contracts lean on it costs ten renames and a deprecation

🟡 and a repave is always available:

- the metaphor must not be read as *"settled forever"* — that would be `crystallize`, which is
  precisely why `crystallize` was rejected
- a dispute reopens any term (`howto.domain-term-disputes.[guide]`)
- ⇒ what changes with traffic is the cost, never the possibility

## .disputes

### dispute: learn  —  raised 2026-08-12  —  status: RESOLVED (both stand; distinct concepts)

- raised.by  = driver, mid-vision for `feat-adopt-seeded-briefs`
- claim      = the learner's own briefs and its onStop hook both say `pave` beside `learn`
               ("pave the path for the next traveler", "pave the path for any new ones"). two
               words for one act would be synonym drift, so one of them should be forbidden
- counter    = they are not one act. they differ in beneficiary and direction:
               `learn` = durably retain a lesson so it is not re-derived — the beneficiary is
               the retainer. `pave` = lay a reusable path — the beneficiary is a future
               traveler who never had the lesson at all
- the decisive case = a lesson can be **learned and never paved**: retained by one clone,
               unavailable to the next. that gap is precisely the arrears the seeded-briefs
               behavior exists to pay, so the distinction carries real weight, not academic
- resolution = both words stand; neither becomes a forbidden synonym of the other. the full
               entry lives in `term=externalize.learn._.choice.reason.md`, which is where the dispute was
               first recorded. dispute closed

### dispute: whether `pave` earns a cluster at all  —  raised 2026-08-12  —  status: RESOLVED (pave it)

- raised.by  = the `learn` dispute above, which closed with *"`pave` does NOT get its own cluster
               yet: it composes no domain object or operation this repo declares, so
               `rule.require.domain-term-itemization`'s own test puts it out of scope"*
- claim      = that test is the right one, and `pave` failed it. no `pave*` operation is declared;
               the word appeared only in prose
- counter    = the ground moved inside the same round. `pave` now names a say-level rule
               (`rule.always.reuse-pavement-before-improvise`), a philosophy brief
               (`philosophy.pavement-saves-nature`), the learner's mantra, and the cli's own
               emitted instruction text in `src/contract/cli/learn.ts`. that is traffic — and by
               this term's own gradient, traffic is exactly when a repave stops being cheap
- and       = `rule.require.domain-term-itemization` states what **must** be itemized (a blocker
               when absent). it does not forbid a cluster for a word below that bar. the itemize
               test is a floor, never a ceiling
- resolution = pave it. the cluster is authored here; the `learn` entry's *"should a `pave*`
               operation ever be declared, this entry is the etymology it starts from"* is
               superseded by this file, which is that etymology. dispute closed

## .evidence

- **discovery** — the word was coined by a human in `ahbode` (`repo=.this`) while they paved
  growth-strategy terms (`dealpath`, `motion`, `retain`, `sustain`). it is hoisted here because
  the itemization discipline it names lives in the bhrain learner role, so the canonical home is
  org-wide rather than one repo's
- **the extant discipline it names** — `im_an.obsessive_learner.for.domain.terms`,
  `rule.require.domain-term-itemization`, `template.domain-term`, and the `learn.domain.terms`
  sweep all describe the same act in longhand. `pave` is the one word for it
- **invariant** — `pave` and `learn` are **not** interchangeable in any of the refs above.
  substitute one for the other in `philosophy.pavement-saves-nature` and the claim about a future
  traveler collapses; substitute in `learn.domain.terms` and the retention claim collapses. a
  substitution test that fails both directions is what separates two concepts from one
