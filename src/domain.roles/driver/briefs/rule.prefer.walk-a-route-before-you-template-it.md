# rule.prefer.walk-a-route-before-you-template-it

## .what

> **you cannot template a route whose shape you have not yet walked.**

a new route is paved **offroad** — hand-authored stones, discovered by a walk through one real
case. the skill-stamped template comes later, once the shape has held across cases.

| the way | how it is born | when |
|---|---|---|
| **offroad** | stones hand-authored, revealed by a walk through one concrete case | the shape is unknown |
| **paved** | a skill stamps the stones from a template | the shape has proven itself |

## .why — this is `rule.prefer.wet-over-dry` at the ROUTE grain

**the parent claim is not this rule's.** `rule.prefer.wet-over-dry` (ehmpathy/architect) already
states it: *duplication is cheaper than the wrong abstraction*, and *patterns are discovered, not
predicted*.

⇒ this rule earns its own file for one reason: **that rule's every example is code**, so a driver
about to stamp a route template reads it, agrees with it, and does not recognize that it applies
(`rule.require.specialize-a-rule-its-readers-look-past`, learner).

and the route grain makes the stakes worse, not merely different:

| a premature **code** abstraction | a premature **route** template |
|---|---|
| binds the callers who reach for it | binds **every traveler the route drives**, at every stone |
| a wrong shape shows up as an awkward call site | a wrong shape shows up as a stone nobody can satisfy, **after** they have walked to it |
| refactorable by one author | each stamped instance is a route someone is mid-drive on |

⚠️ **a route stamps JUDGMENT, not execution.** a linear skill that is shaped wrong wastes a call;
a route that is shaped wrong sends a brain down an order of stones that does not match the work.

## .the third argument — the demonstration IS the design doc

a hand-walked route is not a rough draft of the template. it is the **spec**:

- each stone earns its place by the artifact it hands the next one. a stone that hands **naught**
  on is visible in a walk and invisible in a template
- the guards land where the walk showed they were needed, never where symmetry suggested
- a loop, a rewind, a substone split — these **surface under a real case** and are near-impossible
  to predict

⇒ so the walk is not a cost paid before the template. **it is the work the template later
encodes**, and a template written without one encodes a guess.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to **stamp a template** for a route kind that has run **once** | 🔴 stop. one case is a demonstration, not a pattern. hand-author the second |
| you find yourself with a template **parameter** for a stone that varies per case | that variance is the shape still in discovery. walk another case first |
| a stone in your stamped route is one **nobody can satisfy** | the template hardened a shape the walk would have refuted |
| you hand-author a route and move on | 🔴 **record the intent to formalize** — see below. an unrecorded offroad route is drift |
| a route kind has run **twice** with the same stones and guards | the shape is confirmed. the template pays off from the third |
| you copy a stone list from another route by hand, a second time | that copy IS the template, unnamed. name it |

## 🔴 .record the intent, or offroad becomes drift

an offroad route that nobody marked as offroad is indistinguishable from one somebody decided to
leave un-entooled. so the walk owes one artifact beside it:

```
$route/todos.offroad-route-templatize.md
```

it names the route kind, the cases walked so far, and what a template would have to carry — the
stones, the guards, and the number/name contract.

⚠️ **no bracket marker on that name, and the reason is mechanical.** `[` and `]` are glob
metacharacters, so a marker like `[todo]` reads to every path tool as *"one character from
`t,o,d`"*, and the file comes back unmatched by the very tools built to find it
(`rule.forbid.brackets-in-filenames`, librarian). the lead segment `todos.` already declares the
kind, so a marker here is redundant as well as harmful — **drop it, never convert it.**

⇒ **that record is what makes the offroad state deliberate.** without it, the second traveler
hand-copies the stones and neither of them notices that two cases have now confirmed the shape.

⚠️ this is the same discipline `rule.always.enskill-the-tactics-you-discover` (learner) states for
a tactic: *an offroad brain is at its best when it leaves a route behind.* one rung up, the same
claim holds — **an offroad route is at its best when it leaves a template behind.**

## .what the demonstration must carry forward

when the template is finally extracted, it inherits what the walk proved:

| the walk produced | the template must carry |
|---|---|
| the stones, in the order they earned | the stone sequence and its numeric prefixes |
| the guards that fired on real work | the guards, on the same stones |
| the artifact each stone hands on | the number/name contract between them |
| the loops and rewinds a real case forced | the substone structure that holds them |

## .the worked case

`rhachet-roles-mhedic` paved a causal-diagnosis route by a walk through one real case
(`src/domain.roles/diagnostician/briefs/.demo/case=miki-vet-2026-08-07/`):

```
0.seed → 1.intake → 2.1.differential.enumerate → 2.2.{1..5} disentangle → 3.assay → 4.triage → 5.diagnosis
```

⚠️ **the `2.2.*` substones revealed a loop** — craft → gather → itemize → compute, with a rewind
when the sample is thin, then attribute — that would not have surfaced without a real case to
stress it. peer-review guards were landed by hand on the highest-consequence stones, and the intent
to templatize was recorded in a `todos` brief.

⇒ **the loop is the whole argument in one artifact.** no template author predicts a rewind
condition; a walk hits it.

## .provenance

⚠️ **one route, one walk.** the demonstration above is a single case, and this rule generalizes
from it. it earns its place because the **parent** claim is well-established — the rule of three is
not this rule's invention — and this file only carries it to a grain where its examples had stopped
to fire. a second offroad route that finds the walk wasteful would sharpen the threshold, not
overturn the claim.

## .enforcement

- a route template stamped from a shape walked **once** = **nitpick** — hand-author the second case
- an offroad route with no `$route/todos.offroad-route-templatize.md` record = **nitpick** — the
  state must be deliberate, not drift
- a stone list hand-copied between routes a **second** time, with no template extracted =
  **nitpick** — that copy is the template
- a route walked offroad on purpose, recorded, with the shape still in discovery = **not a
  violation** — that is the rule at work

## .see also

- `rule.prefer.wet-over-dry` (ehmpathy/architect) — 🔴 **the parent claim.** this file is that rule
  at the route grain; the stakes table above is what it adds
- `howto.create-routes.[ref]` — the route/stone/guard/bind mechanics a walk uses
- `define.routes-are-gardened.[philosophy]` — why a route is grown rather than designed
- `rule.always.enskill-the-tactics-you-discover` (learner) — the same claim one rung down: an
  offroad walk owes a route behind it
- `rule.require.specialize-a-rule-its-readers-look-past` (learner) — why the parent needed this
  specialization rather than a louder `.what`
