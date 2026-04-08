# self-review: has-questioned-assumptions

## assumption: "yield" is the right word

**what we assume**: "yield" clearly communicates "output of the stone"

**questioned**:
- what if users interpret "yield" as "give up" or "surrender"?
- what if "yield" is unclear to non-native english speakers?
- did the wisher specify "yield" or did we infer it?

**evidence**: the wisher explicitly said "the `yield.md` pattern" in 0.wish.md. this is not an inference.

**alternatives considered**:
- `output.md` - too generic, conflicts with stdout concept
- `result.md` - implies computation, not production
- `done.md` - too informal
- `artifact.md` - too abstract

**verdict**: "yield" is appropriate. it means "produce" or "the output produced" - exactly what stone outputs are.

**holds**: yes.

---

## assumption: file extension stays `.md`

**what we assume**: all stone yields are markdown files

**questioned**:
- what if a stone yields json, code, or other formats?
- the pattern `{stone}.yield.md` assumes markdown

**evidence**: behavior stones produce prose artifacts (vision, criteria, blueprint). non-prose outputs use different patterns (e.g., code goes in src/).

**verdict**: markdown is the right default for behavior artifacts.

**holds**: yes.

---

## assumption: old behaviors don't need migration

**what we assume**: extant `.v1.i1.md` files can remain

**questioned**:
- what if the code needs to support both patterns simultaneously?
- what if this creates confusion about which pattern to use?

**evidence**: the vision states "old behaviors retain old pattern" - but does the code actually support this?

**need to verify**: in the research/blueprint phase, ensure code handles both patterns or documents the cutover.

**holds**: partially. needs verification that dual-pattern support works.

---

## assumption: the wisher wants ONLY yield.md, not yield.v1.md

**what we assume**: drop version entirely, not just iteration

**questioned**:
- the wish mentions "v1.i1.md" pattern specifically
- what if the wisher wanted "v1.yield.md" or "yield.v1.md"?
- what if version track is still desired?

**evidence**: the wish says "the yield of the stone" - singular, no version qualifier. the intent seems to be simplification, not restructure.

**verdict**: complete simplification aligns with the wish's spirit.

**holds**: yes, with confidence.

---

## assumption: the alpha-order claim is accurate

**what we assume**: "yield" alpha-sorts better than "v1.i1"

**questioned**:
- `v` comes BEFORE `y` in the alphabet
- the alpha-order claim is technically backwards

**evidence**: reviewed file sort order:
- `1.vision.guard` (g)
- `1.vision.stone` (s)
- `1.vision.v1.i1.md` (v)
- `1.vision.yield.md` (y)

both sort after `stone`. the order difference is: v < y. so `yield` actually sorts LATER.

**verdict**: the alpha-order claim in the wish is incorrect, but the overall intent (clearer names) is valid.

**issue found**: the vision should clarify that the primary benefit is clarity, not alpha-order.

**action**: vision already addresses this - it emphasizes clarity over order in the evaluation section.

**holds**: the vision correctly de-emphasizes alpha-order.

---

## summary

| assumption | status | notes |
|------------|--------|-------|
| "yield" is right word | holds | wisher specified, appropriate sense |
| extension stays .md | holds | behavior artifacts are prose |
| no migration needed | needs verification | dual-pattern support TBD |
| drop version entirely | holds | aligns with simplification intent |
| alpha-order claim | partially false | but vision already clarifies clarity > order |

one assumption needs verification in the research phase. all others hold.
