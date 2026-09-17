# fulcrum F8 — `group` is the word for the set

**recorded** — 2026-09-09 · **rework** — **clean** (a yaml key + a term cluster) · **status** —
**open** · **confidence** — **91%**

## .the fork

the wisher asked, verbatim: *"are there better terms than group? e.g., bottle or rates or
bottleneck ? or etc?"*

⚠️ **this fulcrum exists because the question is fair.** `concurrency group` was coined in seed S4
and adopted with **no enumeration run** — the exact defect F4, F1, and F2 each fell to. so the
option set is walked here before the word is kept.

## 🔴 .the enumeration — run FIRST, per `rule.require.enumerate-before-you-name`

the word must cover **every** row below. a candidate that breaks on one is **too narrow**; a
candidate that covers these *and* the adjacent concepts is **too wide**.

| # | the instance the word must cover |
|---|---|
| i1 | a set of reviewers that contend for **one provider's ratelimit** (anthropic) |
| i2 | a **second, disjoint** set on a different provider (openai) — both live at once |
| i3 | a set bounded by **host memory**, spanning every provider — a different KIND of resource |
| i4 | a set of **exactly one** reviewer — contends with nobody, still a set |
| i5 | a set whose bound is **never declared** — the default case, the common case |
| i6 | the **membership key on the reviewer** — `<word>: anthropic` |
| i7 | the **map key that holds the bound** — `<word>s: { anthropic: { concurrency: 10 } }` |
| i8 | what a **queued lane is waiting for** — *"waiting for a free slot in \<word\> anthropic"* |
| i9 | the **render label** on the status line, where a reader learns why a lane has not started |

## .the candidates, scored against the rows

| candidate | verdict | the row it breaks on |
|---|---|---|
| `bottleneck` | 🔴 **too narrow** | **i4 and i5.** a bottleneck is the **constraint**; a set with no constraint is still a set. an unbounded set of one is not a bottleneck, and it is exactly what the default case produces |
| `rates` / `rate` | 🔴 **too narrow** | **i3.** host memory is a **capacity**, never a rate. and `rate: anthropic` is a category error at i6 — it reads *"the rate IS anthropic"* |
| `bottle` | 🔴 **invented** | it points at no thing the domain holds. `def.domain-discovery`'s test — *"where did this already live in the domain?"* — has no answer |
| `pool` | 🔴 **inverts the referent** | a pool holds **resources you draw from**; our set holds **consumers that draw**. it names the slots, not the reviewers |
| `lane` | 🔴 **taken** | already spoken for **one reviewer's run**, and already on the glossary's open-gap list. to take it for a set of runs is `rule.forbid.domain-term-ambiguity` outright |
| `cohort` | 🔴 **wrong axis** | a cohort shares a **start time**. ours shares a **resource**, and its members start at different moments by construction |
| `tier` | 🔴 **forbidden** | declared a forbidden synonym of `level` in `term=route.guard.level._.choice._.md` |
| ✅ **`group`** | **covers all nine** | — but see the wideness charge below, which is real |

## ⚠️ .the wideness charge against `group` is REAL, and its repair is not a rename

bare `group` **is** the genus. *"a group of what?"* has no answer in the word itself — the identical
defect that `knowledge` (for a brief) and `tool` (for a skill) each fell to.

⇒ **but the repair for a genus is a differentia, never a substitute.** and the wisher already
supplied it in seed S4: the term is **`concurrency group`**, never `group`.

that is `rule.require.boundary-qualified-terms` exactly — *"$word, of WHAT?"* answered in **one
word**: `concurrency`. so the cluster's name is `term=route.guard.concurrency.group`, and the
boundary is a term this repo declares (fulcrum F5).

⚠️ **in the yaml the qualifier is supplied by POSITION, and that is legitimate.** `group: anthropic`
sits inside `reviews:` beside `concurrency:` — the identical mechanism by which `level: 1` is
unambiguous without reading `guard.level`. a key is qualified by its container; a term is qualified
by its filename.

## 🔴 .`bottleneck` has no slot left, and that is why it is refused

it is the wish's own informal word (*"we want it to have a bottleneck ability"*), so it deserves a
straight answer rather than a shrug:

| the concept | the settled word | so `bottleneck` would be |
|---|---|---|
| the **count** — how many at once | `concurrency` (fulcrum F5) | a **synonym** — forbidden |
| the **set** — who contends | `concurrency group` | **too narrow** — breaks i4, i5 |
| the **mechanism** — the semaphore | `with-bottleneck`'s own word | ✅ **already its home** |

⇒ **the third row is the honest one.** `bottleneck` is the *implementation's* word, and the
implementation primitive is an execution-stage call this vision does not make. so the word is
recorded as a **forbidden synonym with a reason**, not discarded as a bad idea.

⚠️ and there is a live hazard in adopting it: if `bottleneck` names the set **and**
`genBottleneck()` names the semaphore, one word carries two concepts on the same surface —
`rule.forbid.domain-term-ambiguity`, in the same file.

## .the extant use of `group` in this repo — checked, and it does not collide

`formatGuardTree.ts` and `formatGuardReviewLadderFooter.ts` both carry `remedyGroups` — a cluster of
remedy lines rendered together.

⇒ **that is a boundary-qualified peer, not a collision.** `remedy group` and `concurrency group` are
two qualified terms in a namespace that has one slot per *qualified* word — which is the whole
reason `rule.require.boundary-qualified-terms` exists. an unqualified `group` in a contract would
be the violation; neither site has one.

## .taken, and why

**keep `concurrency group`.** it is the only candidate that covers all nine rows, it is the wisher's
own coinage (so its etymology is dereferenceable), and its one genuine defect — genus-wideness — is
answered by a qualifier the term already carries.

**confidence 91%.** the 9% doubt is not about the candidates scored above; it is that **i8 and i9
were scored on paper.** the word has never been read in a rendered status line by a person who did
not write it, and *"waiting for a free slot in group anthropic"* is the one row where a shorter word
might still win on the surface.

## .the rework

**clean.** a rename touches one yaml key, one map key, one render string, and one term cluster —
before any of them is built. it ripples nowhere, because nothing is built yet.

## .landed

- `term=route.guard.concurrency.group` — the cluster this fulcrum's verdict owes (not yet written;
  it is owed the moment the word is confirmed)
- `.seeds/inventory.of=seeds.case=S7-are-there-better-terms-than-group.md` — the wisher's question,
  verbatim
- `inventory.of=fulcrums._.md` — the row
