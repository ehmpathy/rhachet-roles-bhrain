# domain.terms 🦉📜

this is the repo's **glossary** — one canonical word per concept, for the
**domain objects & operations declared in this repo**.

read it to learn what this repo calls things, and why.

## .what lives here

one folder-mate cluster per term (one word). each cluster has:

- `term=<x>._.choice._.md` — the chosen word, its kind (noun/verb/adj), its
  forbidden synonyms, and where it is used
- `term=<x>._.choice.reason.md` — why this word: etymology, any settled
  disputes, and the evidence behind the choice
- `term=<x>._.choice.example=<abc>.md` — a notable example of the term in use
  (optional, one file per example)

start with `._.choice._.md` for the quick answer; open `.reason.md` when you
want the full story.

## .the two rules

- `rule.require.domain-term-itemization` — every word that composes a declared
  domain object or operation gets a cluster here
- `rule.forbid.domain-term-synonyms` — contracts use the canonical term; if you
  believe a synonym is right, open a dispute rather than drift silently

## 🔴 .the open gaps — the census lives HERE, never inside a rule

a **gap** is a word the glossary owes and does not yet hold. it is recorded so the next traveler
finds it already named rather than re-derives it.

⚠️ **the census belongs to the glossary, never to a rule.** a rule that carries its own gap list
becomes a logbook, and its readers scroll past dated arrears to reach the mechanism
(`rule.require.catalog-is-an-index`, librarian).

| gap | state |
|---|---|
| the `en-` family's **boundary** | ✅ **closed 2026-08-31** — `externalize`, a ROOT. see `term=externalize._.choice.reason.md` |
| **`say`** and **`ref`** — the two `boot.yml` tiers | 🔴 **open.** declared keys in a contract this repo publishes, so `rule.require.domain-term-itemization` binds them. their boundary is `boot`, which is **also undeclared**, so the chain wants settlement from the root down rather than one term at a time |
| the five **document kinds** — `whento` · `howto` · `howdoes` · `hazard` · `rule` | 🔴 **open.** each is a declared filename prefix, and the set is stated to be open (`rule.require.classify-the-yields-document-kind`, researcher) |
| `bhrowser` · `dark` · `lane` · `judge` · `task` | 🔴 **open.** each is spoken in a booted brief with no cluster behind it |

⚠️ **`malfunction` is settled and under watch.** `term=route.guard.review.malfunction` declares it
*a process that rendered no verdict at all*, and `getExitCodeClass.ts` grades an overflowed lane
`constraint` — so the code and the glossary disagree today. the repair is caught at
`.dream/v2026_08_31.fix.overflowed-lane-grades-constraint-not-malfunction.md`. **the word is not a
gap; the implementation is a defect.**

## .who tends it

the learner keeps this glossary current — it captures a term the moment one is
coined or debated. see `im_an.obsessive_learner.for.domain.terms` in the learner
briefs for how.

> this glossary's canonical word for itself is **glossary**, never "dictionary" —
> one concept, one word, itself first (`term=glossary._.choice.reason.md`).

> the words we build with deserve a glossary. tend it, and raise the floor for all
> who come after. 🦉📜💎
