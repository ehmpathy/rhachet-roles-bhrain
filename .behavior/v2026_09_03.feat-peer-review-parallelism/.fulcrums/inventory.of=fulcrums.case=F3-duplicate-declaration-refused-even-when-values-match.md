# fulcrum F3 — a duplicate declaration is refused even when the values match

**rework** — clean · **status** — open · **confidence** — 88%

⚠️ **confidence raised from 65% in self-review r1.** the repo already refuses an ambiguous
declaration at parse, for an analogous conflict, in the same parse function — see the precedent
below. the argument moved from *"i think strict is right here"* to *"this is what the guard parser
already does."*

## 🔴 .the precedent, found in-repo — this pattern is extant, not invented

`parseStoneGuard.ts:61-74` — `assertReviewSlugsGloballyUnique`:

```ts
if (collisions.length > 0)
  throw new BadRequestError(
    `reviewer slug used by BOTH a self and a peer reviewer: ${collisions.join(', ')}. ` +
      `slugs must be globally unique across self + peer.`,
    { collisions },
  );
```

and its `.why`, verbatim:

> *"a loud throw at parse makes the ambiguity structurally impossible rather than settled by
> convention"*

⇒ **that is this fulcrum's argument, already declared in this repo.** the guard could have settled
a self/peer slug collision by convention — *"peer wins"*, or *"first wins"* — and deliberately does
not, because a rule a reader must recall is weaker than a shape they cannot express.

⚠️ **note what the precedent does NOT settle.** it refuses a collision whose two sides genuinely
conflict (`--that` turns ambiguous). F3 asks about two declarations that **agree**, where no
ambiguity exists at all — so the precedent is strong support and not a proof. that residual is why
this sits at 88% rather than higher.

## .the fork, stated fairly

case 7 establishes that two **disagreed** declarations for one level are refused at parse. what of
two declarations that **agree**?

| option | for | against |
|---|---|---|
| **accept a matching repeat** | harmless — there is no ambiguity to decide; lenient toward a copy-paste that happens to be consistent | the rule becomes two sentences: *"one declaration per level, unless the duplicates agree."* a reader must now hold a special case |
| **refuse any repeat** ✅ | the rule stays one sentence: *one level, one declaration*; a repeat is a typo either way, and a typo caught is cheaper than a typo tolerated | refuses a file that is not actually ambiguous — strictly more restrictive than the harm requires |

## .taken, and why at the time

**refuse.**

- `rule.prefer.prevent-over-correct` rung 1: a shape that cannot express the wrong value beats a
  shape that tolerates it. one declaration per level is expressible as a flat invariant; "one, or
  many that agree" is not.
- a matching repeat is not a *safe* file — it is a file one edit away from case 7. the author who
  copies a block twice will eventually change one copy. to refuse now is to refuse the state that
  precedes the ambiguity, not merely the ambiguity.
- the error is cheap and the fix is one deleted line.

## 🔴 .the counter-argument, stated fairly

this refuses a file with no defect in it. a reader who writes the same value twice and is told
"this is an error" may reasonably ask *"which value did you think was wrong?"* — and the answer is
"neither", which is an unsatisfying error to receive.

⚠️ a mitigation that would make this comfortable: the error message must say **why** a matching
repeat is refused, not merely that it was. in the shape of *"level 3 is declared twice. both say
1, so no ambiguity exists today — but a later edit to one copy would create one. keep one."* that
turns a pedantic refusal into a taught lesson (`rule.require.errors-name-the-fix`).

⚠️ **what would overturn this:** a wisher who prefers leniency here, or evidence that yaml anchors
or a generator legitimately emit duplicate keys in this repo's guards.

## .why the confidence is 65% — the lowest in this set

this is a taste call with a real argument on each side, and it is the one I would least defend at
93%. it also may be moot: under fulcrum F1's option B the declaration is a **yaml map key**, and
most yaml parsers either reject duplicate keys outright or silently take the last. so the parser's
own behavior may settle this before we do — which is itself worth a check at the execution stage.

## .rework — clean

one branch in the parse validation, and one test.

## .where

- `1.vision.experience.case=7.conflicted-bounds-are-refused-at-parse.md` — `[case3]`
- `src/domain.operations/route/guard/parseStoneGuard.ts`

## .the verdict

_open — for the fulcrum council at the end of the route._
