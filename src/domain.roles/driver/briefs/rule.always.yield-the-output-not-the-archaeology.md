# rule.always.yield-the-output-not-the-archaeology

## .what

> **a yield is the output, never the archaeology.**

state the answer. if the path to the answer is worth preservation, it goes in a **peer dir** — not
in the yield.

| dir | holds |
|---|---|
| `$route/appendix/` | elaboration on a decision that IS in the yield — the evidence, the probe, the full reason |
| `$route/archive/` | ideas considered and **rejected** — drafts, dissolved forks, reversals |

the yield **cites them by path.** it does not inline them.

🟡 note `$route/.route/.archive/` is a different, machine-written directory — it holds yields
moved aside on a `--yield drop` rewind. `$route/archive/` is yours; `.route/.archive/` is the
tool's.

## .the parent claim — this is chronological accretion, in a route

**this rule coins no new claim.** `rule.forbid.chronological-accretion` (ehmpathy/mechanic,
`lang.prose/`) already states it for prose in general:

> *prose states current truth, not the time-order of how it got there. do not append a log of
> iterations, attempts, or "then we" steps to a doc. revise it to state what IS, and let git
> history hold the how.*

it names the same four smells — the iteration log, the attempt trail, the step-time narration, the
append-over-revise — and grades each a **blocker**.

**this rule is that rule, specialized to a route yield**, and the specialization earns its own file
for one reason: the general rule offers nowhere to put the history it removes, so a driver who
obeys it deletes evidence a council will want. **the `appendix/` and `archive/` peer dirs above are
what this rule adds.** the rest is the parent's, cited rather than re-derived
(`rule.always.reuse-pavement-before-improvise`).

🟡 it lives in a **separate package**, so it cannot be symlinked or extended from here — only
adapted and cited, exactly as `rule.require.timeless-lessons` adapts `rule.require.timeless-comments`.

## .why — measured, on one stone

`ehmpathy/sdk-aws-lambda`, route `v2026_08_03.feat-apigateway-wire-response`, stone `1.vision`.

the yield reached **1909 lines.** the cause is specific and mechanical: **each correction's history
was re-told inline, at every site the correction touched.**

one fulcrum (a type re-bound after a wrong prune) is narrated **six times** in that document — in
a grid table, a dedicated section, the awkwardness list, the cons list, its own fulcrum row, and a
rules table. each retell was locally justified. together they are ~200 lines that say one claim.

| content | lines | belongs in |
|---|---|---|
| the outcome, the contract, the acceptance map | ~600 | **the yield** |
| draft histories + reversal narratives | ~430 | `archive/` |
| repeated retells of one lesson | ~320 | **delete — say it once** |
| verification evidence, probe output, greps | ~330 | `appendix/` |
| self-review meta-commentary | ~220 | `archive/` |

⇒ **roughly two thirds of the yield was not yield.**

## .the cost is not length

length is the symptom. three real costs:

1. **a reader cannot find the answer.** the contract a consumer needs sits on line 300 and again on
   line 1300, phrased differently, and a reader cannot tell which is current
2. **repetition breeds contradiction.** on that stone the same member was declared as two different
   types in two sections, and **four self-review passes read past it** — precisely because each
   section read coherently on its own. a terse yield declares each claim once, so it *cannot*
   disagree with itself
3. **the archaeology is what grows.** each correction adds a story; the answer does not get longer.
   so a yield that carries history **grows without bound** over a long route

## .the rule

**a yield declares what IS. it does not narrate how it came to be.**

| in the yield | not in the yield |
|---|---|
| the contract / the outcome | the drafts that preceded it |
| the decision | the reversals en route to it |
| a one-line reason per decision | the full argument (→ `appendix/`) |
| a fulcrum row: what was settled, by whom | the blow-by-blow (→ `archive/`) |
| a caveat a reader must act on | commentary on the review process |

**declare each claim exactly once.** if a claim belongs in two sections, one of the two is
redundant.

## 🔴 .the cue — an APPEND that answered a correction is the moment

> **after any round where you answered a correction by an APPEND rather than a revision, sweep the
> yield for accretion. a re-read will not catch it.**

this is the one cue with measured evidence, and it names the exact mechanism a self-read misses:

> a re-read re-reads the author's **intent**, and the intent fills the seam. a reader with no
> intent to consult has only the seam.

**measured, 2026-08-30, this repo:** seven review passes over ~60 briefs cut blockers 3 → 0 on two
surfaces, at 50–120s and under five cents total. against that, **six prior rounds in which the
author re-read their own work caught none of it**, and the human caught three by hand.

🟡 **one result settles why the author cannot be the checker.** a pass flagged text the author was
certain they had already fixed — the fix had been applied through a `.agent/` symlink into `dist/`
and silently reverted by the next build. **only a reader with no memory of the edit could surface
it.**

⇒ so the discipline below is necessary and not sufficient. the enforcement half is a
**reviewer**, never a hook: a hook holds one edit, and every append that accretes is locally correct —
the violation is the relation *between* paragraphs. that reviewer is dispatched as seed **#394**,
against the telepath role that owns the generic prose rules (#386).

## .the test — for the driver

before you write a paragraph, ask:

> **"is this the answer, or the story of the answer?"**

- the answer → **the yield**
- the story → `archive/`, cited by path
- the proof → `appendix/`, cited by path

and after you write, run the **repetition grep**: take the load-bearing term of each decision and
count its occurrences.

```sh
rhx grepsafe --pattern '<the-fulcrum-id-or-term>' --path "$route" --glob '*.yield.md'
```

more than two or three hits and you retell rather than declare.

🔴 🟡 **scope with `--path`, never with a slash in `--glob`.** `grepsafe --glob` matches the
BASENAME, so `'$route/*.yield.md'` matches no file and returns a clean `0 matches`, exit 0.

**a false zero is uniquely dangerous for THIS check**, because zero is the shape of a pass here:
a count of 0 reads as *"each claim is declared exactly once"* — the very verdict the check exists
to earn — when in truth it ran over no file at all.

⇒ so **confirm the check saw a file before you trust that it saw few hits.** a repetition count
you cannot part from an unrun check is not evidence
(`rule.always.reuse-pavement-before-improvise`, learner).

## .the test — for the reviewer

**read only the yield's headers and tables.** can you state the outcome? if the answer emerges
only from the prose between them, the yield is a narrative where it should be a contract.

the tells:

- a table whose rows are **drafts** or **attempts** rather than options
- the phrases *"an earlier draft"*, *"a prior pass"*, *"this vision first proposed"*
- a section that explains why a **previous version of the same document** was wrong
- the same fulcrum id cited in four or more places
- commentary on the review process, inside the deliverable
- **a yield that grew on a round where no decision changed** 🔴

## .the caveats

- **a reversal that changes what a reader must DO stays.** if the current contract only makes sense
  against what it replaced (a break, a rename, a retracted acceptance line), one line of history is
  the answer, not archaeology
- **terse is not thin.** the mandate is one declaration per claim, never fewer claims. a yield that
  drops a caveat to save lines has failed worse
- **`archive/` is not `/dev/null`.** rejected ideas are cheap to keep and expensive to
  re-litigate. the dirs exist so brevity costs no memory
- **an appendix must be cited.** an uncited appendix is a file nobody opens; the yield names the
  path at the decision it supports

## .provenance

🟡 **one route, one stone.** the measurement above is a single case, and this rule generalizes from
it. it earns its say-level place because the mechanism it names — history accretes, answers do not
— is structural rather than incidental. a second counter-case should sharpen it, not surprise it.

## .see also

- 🔴 `rule.forbid.chronological-accretion` (ehmpathy/mechanic, `lang.prose/`) — **the parent
  claim.** this rule is that one specialized to a route yield; what it adds is the `appendix/` and
  `archive/` peer dirs the general rule has no place for
- `rule.require.timeless-lessons` (learner) — the peer specialization of the same parent, for a
  distilled lesson rather than a yield
- `rule.always.defer-fulcrums-to-last` — the adjacent grain: the fulcrum list is reviewed at the
  end, never narrated en route. this rule is where that list *lands*
- `rule.require.timeless-comments` (ehmpathy) — the same discipline for comments: a record must
  stand without its conversation
- `rule.always.archive-the-wishers-words-verbatim` — the one archive that belongs in `.seeds/`,
  never `archive/`: a wisher's words are input, never a rejected draft
