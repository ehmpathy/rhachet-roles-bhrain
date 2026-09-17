# domain.term.choice.reason: route.guard.level.slot

## .etymology

a **slot** is a narrow gap into which exactly one item fits. three properties come with the word,
and all three are what this coordinate needs:

| property of a slot | what it gives the term |
|---|---|
| it holds **one** occupant | a reviewer's coordinate is exclusive — two reviewers never share one |
| it is **pre-cut** | the slot exists before its occupant arrives, which is precisely when we assign it (before the level sort, before any subprocess is spawned) |
| it belongs to a **fixture** | a slot is always *of* something — a rack, a schedule, a roster. so `{ index, total }` reads naturally as one object |

⇒ the third is the one that carries the weight. a bare index would have to name its denominator in
prose; `slot` already implies a fixture with a size, so `slot.total` is expected rather than
explained.

## .the rejected candidates

enumerated **before** the pick, per `rule.require.enumerate-before-you-name` — the instances the
word must cover are: the emit path's ordered release, the tail status arithmetic, an absent roster
on an sdk-supplied event, and a level whose members re-sort by budget.

| candidate | why not |
|---|---|
| `position` | 🔴 **it collides inside one signature.** `cliEmit` already takes a guard-wide `position` argument (`ContextGuardProgress`), so a `reviewer.position` beside it is one word for two scopes — `rule.forbid.domain-term-ambiguity`, at the sharpest possible distance |
| `seat` | implies a contest for a scarce place. a reviewer's coordinate is assigned from the declared list and is never competed for |
| `lane` | it is the prose word for a live review, used throughout the vision and the reviews. to promote it to a **declared** term would fix one loose sense and forbid the other — and the loose sense is the useful one |
| `ordinal` | names the **type** of the value rather than what it is a value **of**. and it is false of `total`, which is a cardinal, so the object would be half-misnamed |
| `offset` | implies arithmetic against a base — a reader would expect `base + offset` to compute an address. it computes no address; it labels a place |

⇒ `slot` covers all four instances. the sharpest test is the third: **an event with no slot** reads
as *"no slot was handed to us"*, which is exactly the sense we want, where *"no offset"* or
*"no ordinal"* would read as a defect.

## .why the roster rides the EVENT rather than the argument

the alternative shape was to hand the roster to `cliEmit` as a second argument, beside the
guard-wide `ContextGuardProgress`. it does not work, and the reason is mechanical:

> `setStoneAsPassed` wraps `cliEmit` and **supplies the guard-wide position itself**, which
> overwrites any second argument a caller passes. so a roster handed there never arrives.

⇒ **the slot rides the event; the guard-wide position rides the argument.** two carriers, because
two different parties know the two facts: the reviews runner knows the level's roster, and the
passage operation knows where the guard sits overall.

## .why `slot?` is optional, and why that is not a legacy shape

`GuardProgressEvent` is re-exported through `src/contract/sdk/route.ts`, so an external consumer may
legally construct one. a required `slot` would make every such consumer compute a roster they do not
have.

so its absence has a defined sense — **a caller that supplies no slot has handed no roster, so no
order can be imposed** — and such an event falls through to the un-buffered emit path the renderer
had before concurrency. that path is correct for a single-lane caller, which is what an sdk consumer
is.

## .disputes

none raised.

## .evidence

- **the collision is measured, not predicted.** peer review i023/r2 read `left` as queued-alone and
  computed `0 left` where `1 left` was right. the two senses coincide on an unbounded level and
  part only under a cap, so the bound `done + left = slot.total` is stated on the render and clamped
  at `genContextCliEmit.test.ts` `[case9][t0]`, which settles one lane of two and asserts the
  identity at that instant
- **two indices, one object, and they must not be conflated.** `reviewer.index` is the guard-wide
  declared position — it is written into the review artifact's filename (`r001`) and is the cache
  key. `slot.index` is the position **within one level**. a level of 3 whose members are declared
  at guard positions 4, 5, 6 carries `slot.index` 0, 1, 2 for the same three reviewers
- **assigned before the sort.** `levelSlotByIndex` is rebuilt per level in `runStoneGuardReviews.ts`
  from the reviewer's place in the declared peer list, so it is stable against the order in which
  lanes actually settle — a race, amid a concurrent pour

## .refs

- `term=route.guard.level.slot._.choice._.md` — the chosen word, its boundary, its forbidden synonyms
- `term=route.guard.level._.choice._.md` — the boundary this term sits within
- `rule.forbid.domain-term-ambiguity` — the rule that disqualified `position`
- `rule.require.enumerate-before-you-name` — the enumeration above
