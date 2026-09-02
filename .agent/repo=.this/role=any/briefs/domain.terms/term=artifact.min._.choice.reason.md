# domain.term.choice.reason: min

## .etymology

from `minify` / `minified` — the web's word for a source file rewritten to its smallest
functionally-equivalent form. the suffix `.min.js` is the precedent every reader already carries,
and `.md.min` inverts the segment order only so the file still reads as markdown to a tool that
sorts on extension.

⚠️ **the borrowed word carries one thing it should not.** a minified bundle is *mechanically*
derived and reversible-in-spirit; a min is **hand-written and lossy by design**. we keep the word
because the shape it names — *"the same artifact, small enough to carry everywhere"* — is exactly
right, and we forbid `compressed` (below) to fence off the reversibility the analogy invites.

## .the rejected synonyms

| word | why it loses |
|---|---|
| **summary** | 🔴 **already claimed.** `rule.require.summary-at-the-cluster-root` declares a summary to be an itemization's `._.` root, whose whole job is to **index its members**. a min indexes no member — it restates one artifact. one word, two concepts, which `rule.forbid.domain-term-ambiguity` grades a blocker |
| **condensed** | an adjective, and it names the **act** rather than the artifact. the act already has a word (`condense`), so this would be a second word for a settled concept |
| **digest** | implies a lossy roll-up of **many** sources. a min has exactly one, and the one-to-one relation is the property that makes the sidecar addressable |
| **tldr** | a section **header** inside a rule (`rules101.content` prescribes it), never a file. to reuse it here overloads a declared structural marker |
| **abridged** | names what was **removed**. `min` names what the file **is**, which is the noun a filename wants |
| **compressed** | implies reversibility. a min drops argument permanently; no operation restores the source from it |

## .the evidence

**the word predates this round.** nine `.md.min` sidecars already sit under
`.agent/repo=.this/role=any/briefs/` and one under `src/domain.roles/driver/briefs/`, in use and
undeclared. that is precisely the gap `rule.require.domain-term-itemization` exists to catch: a
word composing real artifacts, with no cluster behind it.

**the ratio, measured on the extant pairs before this round:**

| pair | min | source | ratio |
|---|---|---|---|
| `define.passage-statuses` | 516 | 2,965 | 17% |
| `rule.forbid.duplicate-format-tree-operations` | 653 | 2,615 | 25% |
| `rule.require.explicit-stdin-flags` | 529 | 1,404 | 38% |

**paved 2026-08-31:** 17 further mins across the driver and learner roles, at a measured ~4x cut on
the driver set (18,900 chars of source rendered in ~4,600 tokens of min).

### 🔴 the ratio is not one number — it varies by ARCHETYPE, and the invariant is why

five philosophy mins were paved the same day, and they compress far worse than every rule above:

| archetype | measured ratio |
|---|---|
| a **rule** — `define.passage-statuses`, `rule.forbid.*`, `rule.require.*` | 17–38% |
| a **research brief** — `research.importance-of-focus` | 30% |
| a **philosophy** — `pavement-saves-nature`, `entoolment-is-the-pinnacle.*` | **43–60%** |

⚠️ **that spread is not a defect in the philosophy mins. it is the invariant at work.** *a min may
drop an ARGUMENT; it may never drop a CLAIM* — and the two archetypes hold argument and claim in
opposite proportions:

- a **rule** is mostly claim. its bulk is worked examples, enforcement rows, and see-alsos, each an
  argument for a claim stated in one line. so a min keeps the line and drops the bulk
- a **philosophy** is mostly argument **by construction** — its whole subject is *why*, and its
  claim is one sentence that means naught without the reasoning under it. drop the argument and
  what remains is a slogan

⇒ **a philosophy that mins to 20% has been gutted, not condensed.** the ratio a min achieves is
evidence of its **source's shape**, never of the author's discipline — so a target ratio must not
be applied across archetypes.

⚠️ **the sources section is the one part a philosophy min always drops whole.**
`research.importance-of-focus` reaches 30% chiefly because 40 lines of citation URLs go. a citation
is already a **dereference**, so its removal from a sidecar costs a reader naught: they open the
source, which is the arrangement the sidecar exists to create.

**the boot preference, verified.** `role=any/boot.yml:10` names
`briefs/define.passage-statuses.md`, and this session's boot loaded
`briefs/define.passage-statuses.md.min`. so the sidecar is not an alternate a reader may choose —
it **supersedes** its source wherever it exists, which is what makes the invariant in
`._.choice._.md` load-bearing rather than stylistic.

## 🔴 .a recorded gap — `say` and `ref` are undeclared

this term's whole `.what` leans on two words the glossary does not hold: **`say`** and **`ref`**,
the two tiers of every `boot.yml`. they are declared **keys in a contract this repo publishes**,
and `rule.require.domain-term-itemization` binds every word that composes a declared contract.

⚠️ **they are not this round's arrears.** both predate it by many months, and neither was coined,
disputed, or drifted here. recorded so the next sweep finds the gap already named rather than
re-derives it — per `rule.require.boundary-qualified-terms`, which grades an unrecorded gap a
blocker and a recorded one a legitimate close.

their boundary, when they are paved, is `boot` — which is itself undeclared, so the chain needs
settlement from the root down rather than one term at a time.

## .disputes

none. the word was in use and uncontested before it was declared.
