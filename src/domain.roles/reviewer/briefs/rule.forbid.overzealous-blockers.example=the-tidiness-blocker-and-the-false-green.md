# rule.forbid.overzealous-blockers.example=the-tidiness-blocker-and-the-false-green

- **date** = 2026-09-07
- **repo** = `ehmpathy/rhachet-roles-bhrain`
- **branch** = `beav/fix-contemplation-gate-on-entrance`, stone `5.3.verification`, round `i029`
- **rule** = `rule.forbid.overzealous-blockers`

two points landed in one review round, from the same rubric family. both were graded **blocker**. one
grade was wrong and one was right. the contrast is what the rule distils.

## .the mis-graded one

verbatim, from lane `r004`:

> *"lines 64, 83, 97 all call `runStoneGuardReviews` with the identical `hash: 'testhash'`, across
> three adjacent `then` blocks … That's genuinely `rule.forbid.redundant-expensive-operations`."*

**the rule citation was correct.** three calls to one local operation, in one integration test file.

**the grade was wrong:**

| the harm test | answer |
|---|---|
| a user harmed? | no |
| an on-call engineer paged? | no |
| the suite green? | yes |

and `redundant-expensive-operations` declares blocker for calls that cost money or wall-clock **at
scale**. three local calls in one test file match its shape and carry none of its cost.

🔴 **the price was real.** the suite it named strict-gates on four credentials the driver did not hold,
so the driver was not **permitted** to close the point. a tidiness observation held a stone.

## .the correctly-graded one

same round, same rubric family:

> a snapshot pins **`malfunctioned 💥`** for three cases whose own keys read *"code is clean → the
> guard **approves**"*.

the test asserts the opposite of what its own name claims. every future reader who consults that
baseline reads a lie. ⇒ hold the release.

## .what the pair teaches

the discriminator is **not** severity of language, reviewer confidence, or how strongly the cited rule
is worded. it is one question:

> **does the artifact mislead in production?**

⇒ the rule: `rule.forbid.overzealous-blockers`
