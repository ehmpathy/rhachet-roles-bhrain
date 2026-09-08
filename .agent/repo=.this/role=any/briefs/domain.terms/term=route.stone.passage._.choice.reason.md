# domain.term.choice.reason: passage

## .why it was owed

`setStoneAsPassed` is a dop this repo declares, so `rule.require.domain-term-itemization` binds its
constituent terms. `passage` is also a **rendered contract field** (`passage = allowed`), a
**persisted path** (`.route/passage.jsonl`), and the subject of an extant brief
(`define.passage-statuses.md`).

## .why it was deferred once, and what settled it

it sat on the deferral list on **2026-09-06, round 1**, with a stated reason:

> *"`define.passage-statuses.md` already carries the concept as a brief, and `term=route.stone`
> neighbours it. whether `passage` wants its own cluster or is a facet of `stone` is a real boundary
> question, unsettled this round."*

that was the honest call at the time: with only `passage` and `approval` in view, a reader could
argue `passage` is merely *"the state a stone reaches"* — a facet of `stone`, which would want no
cluster of its own.

🔴 **round 4 of the same day produced the discriminator, and it is a measurement rather than an
argument.** the entrance gate (P1) created a **third** admission that had never been separable
before, and a blackbox journey caught two of them come apart on one artifact, in one run:

| step | the driver did | what was admitted |
|---|---|---|
| `[t1]` | edited, then `--as passed` | ⛔ **neither** — refused at the door, no reviewer ran |
| `[t2]` | answered the carried debt, then `--as passed` | ✅ **entry** — the reviewers ran · ⛔ **not passage** |
| `[t3]` | answered the fresh critique, then `--as passed` | ✅ **entry** and ✅ **passage** |

⇒ `[t2]` is the row that settles it. **the same command, admitted at one gate and refused at the
next** — so `entry` and `passage` are not two words for one transition, and `passage` cannot be a
facet of the stone's state alone. it names a specific transition with its own gate to rule on it.

**source:** `blackbox/driver.route.peer-contemplation.acceptance.test.ts [case2]`, snapshotted at all
four steps. `5.3.verification` i026.

## .etymology

**passage** — the act to pass, and by extension the right to pass. it carries both senses the domain
needs at once: a stone *passes* (the act) and a guard *allows passage* (the right).

the driver-facing metaphor is already the repo's: a route is a path of stones, a guard stands at
one, and what the driver seeks is leave to go on. `passage` is the word that trail already implies.

## .the rejected synonyms

| rejected | why |
|---|---|
| `advance` | a verb in a noun's clothes, and it names motion with no gate in view. the whole point is that a guard **ruled** on it |
| `promotion` | imports a rank metaphor the domain does not hold — a stone is not raised above its peers, it is walked past |
| `completion` | 🔴 the sharpest rejection. it names the **work**, and the two genuinely come apart: a driver can complete the work and be refused passage (that is `[t1]` above), or hold passage over work a reviewer still disputes (an overrule) |
| `clearance` | reads as the permission rather than the act — which is exactly what `define.passage-statuses.md` says `approval` is, so it would collide with a settled neighbour |

## .the invariant it inherits

from `define.passage-statuses.md`, unchanged and restated here only by pointer:

> **only `'passed'` constitutes valid passage.** `approved` is permission, not action. `blocked` and
> `rewound` are not passage. *"passage requires intent."*

⚠️ this cluster does **not** restate that table. the brief owns it; a second copy would drift —
which is the failure `5.3.verification` caught in the experience tally the same round.

## .the boundary

`route.stone`, per `rule.require.boundary-qualified-terms`: *"passage, of WHAT?"* → **of a stone**.

⚠️ **not `route.guard`,** though a guard is what rules on it. the guard is the judge; the stone is
the subject. to file it under the guard would name the judge rather than what passes.

## .the open neighbour — `entry` is NOT yet a term

the table in `._.choice._.md` names **entry** as the first of three admissions, and **entry has no
cluster.** that is deliberate:

- it is spoken in prose (*"the entrance gate"*, *"buys entry"*) and appears in **no contract** — no
  operation, field, flag, or path carries it
- `rule.require.enumerate-before-you-name` wants more than one round's instances before a coinage

⇒ recorded here rather than in the census, because `entry`'s sense is only legible **against**
`passage`. should a contract ever carry it — an `entry` field, an `isEntryAllowed` — it is owed a
cluster that day, and this section is where its evidence already sits.
