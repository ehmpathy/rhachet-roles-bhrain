# seed S1 — each level can specify the concurrency

## .said — verbatim, unedited

> we want to finally do that peer review paralellism. except we want it to have a bottleneck
> ability. e.g., each level can specify the concurrency. (l1 is infinite, l3 is 1 at a time due to
> ratelimits)

⚠️ **left exactly as spoken**, `paralellism` included. a tidied quote is already a paraphrase.

source: `0.wish.md`, `.the wisher's own words`.

## .settled

three concepts, each of which holds independent of this route:

1. **the bound is per level, never global.** *"each level can specify"* — the unit that carries a
   concurrency is the level, not the guard and not the reviewer. this is the premise fulcrum F1
   reasons from, and it is why a declaration site that repeats the value per reviewer reads wrong.

2. **`concurrency` is the wisher's word for the property.** they wrote *"bottleneck ability"* for
   the *capability* and *"the concurrency"* for the *value*. that split is itself the settlement:
   the mechanism may be called a bottleneck; the number is called concurrency. fulcrum F5 adopts
   it, and this quote is its etymology.

3. **the unbounded case is real and it is the common one.** *"l1 is infinite"* — the default is
   not a compromise chosen for convenience; the wisher named an unbounded level explicitly. that
   is the decisive support under fulcrum F2.

⚠️ **the parenthetical is a demonstration, never a spec.** *"l1 is infinite, l3 is 1"* illustrates
the shape with the levels this repo happens to use today. it does not mean level 1 must always be
unbounded or that level 3 must always be 1.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F5-concurrency-is-the-word.md`
- `.fulcrums/inventory.of=fulcrums.case=F1-where-concurrency-is-declared.md`
- `.fulcrums/inventory.of=fulcrums.case=F2-the-default-is-unbounded.md`
- `1.vision.experience.case=3.author-declares-the-bound.md`
