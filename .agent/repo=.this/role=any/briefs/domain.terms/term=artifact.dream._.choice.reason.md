# domain.term.choice.reason: dream

## .etymology

**dream** — what a mind holds while it rests, and returns to when it wakes. the word already sat in
this repo's nocturnal register (`🌙`, `🌑`, stillness, the quiet hours).

the sense that earns it the contract is narrower than the vibe: **a dream is real work, seen
clearly, and set down rather than lost.** it is not a wish and not a maybe. every dream names a gap
a traveler actually hit.

## .why not the rejected synonyms

- **todo** — carries no provenance. a todo is a line; a dream is a document with the cue that
  fired, the gap, the shape of the fix, and the reason it was deferred. `todo` names none of them
- **backlog** — names the *pile*, not the *item*, and it implies the pile is optional. the queue's
  own census says otherwise (see `.evidence`)
- **ticket** — belongs to an external tracker, which is what a dream is not. the radio is the
  tracker; `.dream/` is the local catch
- **tech-debt** — a financial metaphor for code that works and is shaped badly. most dreams are
  neither: an absent brief is not debt, it is an unpaved path

## 🔴 .why it is NOT a `seed` — the direction is opposite

the collision worth the most care, because both words name a small markdown file a later round
reads.

| | `seed` | `dream` |
|---|---|---|
| direction | **input** — words that came IN | **output** — work that goes OUT |
| authored by | the wisher, verbatim | the traveler who hit the gap |
| tells you | what was asked | what is owed |
| read when | a distillate is questioned | the next round picks up work |
| may be edited | 🔴 never — verbatim is the contract | yes — a dream is amended as it is understood |

⇒ **a seed is unrefined source; a dream is deferred work.** to merge them would forbid the one
property each has that the other must not: a seed may never be edited, and a dream must be.

🟡 **they meet at exactly one point.** a `reseed` dream is a dream *whose eventual form is a seed
in another repo* — caught here as work, transmitted there as input. the kind marker names that
move, which is why `reseed` is a kind of dream rather than a kind of seed.

## 🟡 .caught vs dispatched — two states, and the split is decisive

| state | what holds |
|---|---|
| **caught** | the file exists in `.dream/`, symlinked at its route |
| **dispatched** | it has been pushed to the repo that owns it |

a `reseed` dream that reads as dispatched, when it was only caught, asserts a delivery no peer repo
has received. that is the same defect class as a close with no claim behind it.

🟡 **a blocked push is a `constraint`, never a malfunction** — a legitimate hold with a named fix,
per `term=route.guard.review.malfunction` and `rule.require.exit-code-semantics`. read the error's
class before you diagnose a broken tool, and read the policy (`rhx radio.uses get`) before you
read the error at all.

## ✅ .the boundary — SETTLED 2026-08-31 as `artifact`

*"a dream of WHAT?"* had no one-word answer that reached a declared term, so the gap was recorded
here per `rule.require.boundary-qualified-terms`, and closed once `term=artifact` was paved.

| candidate | for | against | verdict |
|---|---|---|---|
| `route.` | a dream is caught mid-route and symlinked at the route that found it | the original lives in `.dream/`, outside every route — the route is where it was seen, not where it sits | 🔴 rejected |
| `work.` | a dream is a unit of deferred work | `work` is not a declared term, so the chain reaches no root | 🔴 rejected |
| root (dropped) | `dream` is a repo-wide primitive, like `seed` | reads as an evasion unless argued | 🔴 rejected |
| `artifact.` | a dream is a durable file the repo keeps, exactly as a brief or a fulcrum is | it was not a declared term | ✅ **taken — the term was paved** |

⇒ the `route.` candidate reads best at first and is the weakest: it names where the dream was
noticed, and a boundary must name where the word means what it means. a dream outlives its
route by design — which is precisely why the ancestor had to be wider than a route.

🟡 **the settlement was not this cluster's alone.** `term=artifact.withdraw` carried the identical
gap and named the identical candidate. two clusters blocked on one absent ancestor is what
made `artifact` a term the glossary owed rather than a guess
(`term=artifact._.choice.reason.md`).

## .disputes

none open.

## .evidence

- **the queue that motivated the rule** — 2026-08-30: 41 radio seeds open, 0 claimed. each a
  followup someone saw and did not record where it would be read
- **the first dogfood** — `.dream/v2026_08_30.amend.research-stones-use-forbidden-brackets.md`,
  caught the same round the rule was written, for a fix that was SAFE and not CLEAN (~130 lines
  across two stones in a namespace the round had not opened)
- **the retro sweep** — 9 dreams caught before the symlink convention were linked into their
  route's `dreams/` when the rule landed
- **invariant:** a dream's original is in `.dream/`; the route holds a symlink. **caught** is not
  **dispatched**
