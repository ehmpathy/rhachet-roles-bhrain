# domain.term: poke — the reason

## .etymology

from a cache-eviction probe, since retired. it needed three phase names — `arm`, `?`, `read` — for a
middle act that touches one arm and leaves the control alone. `poke` was picked for the phase
because it is small, physical, and carries no promise of a result.

the wisher then promoted the phase name to the domain term, unprompted:

> ok poke is a good word for it

the term was discovered in use, never designed. it had already survived a live
artifact before it was proposed as vocabulary.

## .why the word fits

a poke, in plain english, is a brief contact meant to get attention — not to move a thing, not
to take a thing. that maps to the act exactly:

| the plain sense | the domain act |
|---|---|
| brief | one call, `max_tokens: 1` |
| contact, no force | a READ; the provider exposes no write surface |
| to get attention | residency, never output |
| does not move the thing | the prefix is unchanged; only its recency is |

the metaphor survives every property of the act, which is the test a coinage must pass
(`howto.domain-discovery` — name from the motive, not the mechanism).

## .the rejected synonyms

| rejected | why |
|---|---|
| **warm / warmer** — as a name for ONE SEND | names a temperature, so it describes the cache's state rather than the act performed on it. and it fuses the act with its goal — you cannot say "three warms" the way you can say "three pokes". 🟡 the scheduler that once bore the name `warmer` was retired 2026-10-14; see `.disputes` below |
| **keep-alive** | forbidden in every sense — for the act AND for the schedule. it reads as a name for the whole strategy (`k` pokes on a schedule under a budget gate), and one word for both would leave the single act unnamed |
| **ping** | carries a reply. a ping measures liveness and expects an echo; a poke wants residency and discards its one token |
| **touch** — as a name for ONE SEND | claimed by unix for a file-mtime act, and the false friend is close enough to mislead — `touch` creates where absent, a poke never creates. 🟡 forbidden only in this sense: `touch` as the GENUS of any residency refresh is settled below (`term=prompt.cache.touch`) |
| **refresh** | assumes the answer to the open question. whether a read refreshes recency is precisely what an eviction measurement tests. a word that asserts lru cannot name the experiment that tests for it |

## .the collision that was surfaced, and the near-miss

the wisher first proposed **`cache head poke`**, then asked directly:

> what does the poke send , the largest prefix === the head
> head = prefix

the driver answered from `metrics.compiled.json` — head 102.7k against a shared run that
reaches past it — and offered **a rename of the shipped `head` field** as the more honest of
two options.

that offer was wrong, and a term file one directory away already said so.
`term=prompt.cache.shared-prefix._.choice._.md` had settled that `promptHeadStatic` and
`shared prefix` are two concepts — one declarative and per-prompt, one measured and per-pair —
and it listed `static head` as a forbidden synonym. the file was in the branch's own git
status as added.

the lesson is the one the repo already holds: glob for the term before you propose one
(`rule.always.reuse-pavement-before-improvise`). a rename of a shipped field was proposed
against evidence that was never read.

the near-miss is worth the record: had `cache head poke` been adopted, the name would have
asserted that a poke sends the static head — which is the ONE thing that makes a warmer
worthless. warming the head alone protects ~4% of the prompt. the wrong name would have
encoded the wrong design.

## .the settlement

> ok, prefix then

and, on the api surface:

> and it should be just `brain.cache.prefix`, not shared prefix

so `brain.cache({ prefix })`. the qualifier is dropped at the call site because the
`brain.cache` boundary already supplies it, and because the caller hands over one prompt's
bytes — a shared prefix is what two rounds turn out to have had, which no caller can pass.

the domain term `shared prefix` is untouched by this. it names the measured pair-property;
`prefix` names the argument. they compose: a poke sends a `prefix` in the hope it becomes a
`shared prefix`.

## .disputes

### dispute: warmer — raised 2026-09-24 — status: RESOLVED (`warmer` prevails, as a NEW term)

- raised.by = driver, at the sixth thoroughness audit of the warmer objective
- claim = the rejection above forbids `warm / warmer` outright, and the shipped scheduler is
  named `warmer` throughout — `--warmer` as a published cli flag, plus `runReviewWarmer`,
  `genReviewWarmer`, `asReviewWarmerPlan`, `isReviewWarmerAlive`, `WarmerPokeRow`, and a
  `warmers/reviewer=$xyz/` cache dir. that is `rule.forbid.domain-term-synonyms` on its face,
  and at the most expensive surface it names: *"above all the external interfaces we publish"*
- counter = **the rejection does not reach the sense that shipped.** its argument is
  *"you cannot say 'three warms' the way you can say 'three pokes'"* — a claim about the
  **act**, and a correct one. *"three warmers"* is perfectly sayable and names three agents.
  ⇒ the word was rejected for the act and adopted for the **agent**, which is a different
  concept and the second trigger `howto.domain-term-disputes` names
- resolution = **`warmer` prevails as a new term of its own**, itemized at
  `term=prompt.cache.warmer._.choice._.md`. `warm` stays forbidden as a synonym of `poke`;
  `warmer` is canonical for the scheduler, and `keep-alive` becomes its forbidden synonym

the evidence that the word was already in use: this cluster's own say file. it read
"a warmer owes a prediction clamp" and "a production warmer has no such guarantee" — so the
term was load-bearing prose in the very file whose front matter forbade it. a forbid list and
its own body disagreed, and nobody read them together.

what the keep-alive row got right, and what it got wrong: it correctly identified that the
strategy is a distinct concept and must not share a word with the act — that argument stands and
is why `warmer` earns a cluster rather than a mention. what it got wrong was the word: it reached
for `keep-alive`, which is

- not an agent noun, so it cannot take the sentences the domain needs — "one keep-alive per
  reviewer", "kill the keep-alive", "a keep-alive spawned" all read as category errors
- a borrowed http term (`Connection: keep-alive`) whose false friend is close and wrong: an
  http keep-alive holds a socket open, where this holds no connection at all
- worse at a cli — `--keep-alive 3x,15m` against `--warmer 3x,15m`

so the split the row argued for is upheld and the word it proposed is superseded: the act is
a `poke`; the agent that schedules pokes is a `warmer`.

### dispute: warmer — raised 2026-10-14 — status: RESOLVED (the term is retired)

- raised.by = wisher, after the meter measured the warmer on real guard rounds
- claim = the warmer cost more than the most the cache could have saved (net -$2.28, a loss on
  18 of 22 lanes; `research.review-cost-and-cache`), so it should not ship
- resolution = **the warmer and its verdict are retired**, code and clusters alike, into
  `.behavior/v2026_09_20.review-cost-meter/archive/warmer/`. `poke` survives: a prime sends one
  before a pour, and that is the act this cluster names

### dispute: touch — raised 2026-09-24 — status: RESOLVED (`touch` prevails, as a NEW term)

- raised.by = driver, at the same audit, one row below the `warmer` find
- claim = `touch` is on the forbidden list above, and `getOneWarmerWakeVerdict` declares
  `sinceTouchMinutes` as an input field — an **internal contract**, which
  `rule.forbid.domain-term-synonyms` binds as surely as a dobj name
- counter = the rejection reads *"`touch` creates where absent, a poke never creates"* — an
  argument against `touch` as a name for **one send**. what shipped is the **GENUS**: any act
  that refreshes a prefix's residency, of which a poke and a nominal review are the two species.
  a genus and one of its species are not synonyms
- resolution = **`touch` prevails as a new term**, itemized at
  `term=prompt.cache.touch._.choice._.md`. it stays forbidden as a synonym of `poke`

this is the same defect as the `warmer` row above, found in the same read — a word
forbidden for a narrow sense, then adopted for a wider one that had no word at all. two
instances in one cluster is a pattern rather than a slip:

> a forbid list that does not say which sense it binds will be read as total, and then
> violated by the first author who needs the other sense.

both rows are repaired the same way: the forbid stays, qualified, and the freed sense earns a
cluster. the alternative — a rename — would have renamed correct code to satisfy a list that was
itself imprecise.

and the unix false friend cuts the other way here: `touch(1)` updates an mtime, which is
precisely "refresh recency without a change of content." that is the genus's exact sense, so
the borrowed word helps where it hurt for the act.

## .see also

- `rule.require.prime-the-shared-prefix-before-a-pour` — the one sender of a poke
- `term=prompt.cache.touch._.choice._.md` — the genus a poke is one species of
- `term=prompt.cache.shared-prefix._.choice._.md` — the measured run a poke aims to become
- `rule.require.name-the-shared-prefix-as-the-cache-anchor` — the three obligations a prefix owes
- `.behavior/v2026_09_20.review-cost-meter/.seeds/inventory.of=seeds.case=S10-the-warm-act-is-a-poke-and-it-sends-the-prefix.md`
