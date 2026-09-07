# rule.forbid.absolutes

> **only the sith deal in absolutes. an absolute is a quantifier over a set — so state the set, or
> state the bound.**

`never` · `always` · `every` · `all` · `none` · `impossible` · `cannot` each claim a property over
a whole set. the claim is legitimate when the author walked the set, or when a mechanism closes it.
it is a **termsmell** in every other case, and every other case is the common one.

## .why it is a TERMSMELL, and that is the accurate word

a termsmell is a word that signals a defect beneath it — the word is the tell, over the fault.
`rule.forbid.gerunds` names the pattern: *"gerunds signal unclear domain: lazy placeholder."*

`never` smells the same way, and the mechanism is sharper:

- an absolute is the **cheapest** claim an author can write
  - it costs one word, and it asserts the largest claim available
  - a bounded claim costs a measurement, a file read, or a count
- ⇒ so an author who has **not** measured reaches for the absolute, and one who **has** reaches for
  the number
- **the reader cannot part the two.** both render as the same word

⇒ that asymmetry is the whole rule. the absolute is where an unmeasured claim hides, because it
is the one shape a measured claim and an unmeasured claim share.

## .the two shapes, and only one is a quantifier

| shape | what it does | verdict |
|---|---|---|
| **absolute** — *"it never fails"*, *"this always holds"* | claims a property over an unwalked set | 🟡 the smell |
| **contrastive** — *"structure, never voice"*, *"a claim, never a verdict"* | excludes one named alternative in a stated binary | permitted |

the contrastive form is a different act. *"X, never Y"* names **Y**, so a reader who disagrees
points at Y. that is a bound, over a quantifier — and it is what
`rule.require.disputable-claims` asks for.

🟡 **the tell that parts them: can you name what the word ranges over?**

- *"a claim, never a verdict"* → it ranges over **one** alternative, and the alternative is on the page
- *"it never fails"* → it ranges over **every run that has ever happened**, and the author walked zero

## .the test

> **what is the set, and did you walk it?**

- you walked it → state the count. *"zero of 74"* outranks *"never"*, and it is checkable
- a mechanism closes it → state the mechanism. *"it has no write path"* outranks *"it never writes"*
- you did not walk it → the absolute is a guess dressed as a certainty. state the bound
- it is contrastive → name the alternative, and the word excludes rather than quantifies

## .the repairs

| 👎 the absolute | 👍 the bound |
|---|---|
| *"the headers can never drift"* | *"one source, so a drift needs two edits"* |
| *"it never blocks session start"* | *"`onBoot` returns 0 on every branch — `route.ts:88-140`"* |
| *"this always works"* | *"it held on 74 of 74 files this round"* |
| *"every reviewer overflows"* | *"four of the eleven overflowed"* |
| *"no one can check the canon"* | *"the checkers are gitignored, so a consumer gets none of them"* |
| *"it is impossible to catch"* | *"no shipped hook fires before emit — `anthropics/claude-code#61152`"* |

⇒ **each repair is shorter or equal, and each is checkable.** that is the sign the absolute
carried no information — it was a word where a number was owed.

| when… | then… |
|---|---|
| you write `never` or `always` about behavior | the strongest cue. what is the set? did you walk it? |
| you write `every` or `all` about a set you did not count | count it. a count is one tool run |
| you write *"it is impossible"* | name what makes it so, or say *"no shipped surface does it"* |
| the absolute reads as emphatic | that is why it is reached for, and why it hides an unmeasured claim |
| you would answer *"but it IS always true"* | then the mechanism that makes it so is the claim. write that |
| the word excludes one named alternative | contrastive. it is a bound, so leave it |

## 🟡 .the measured state of this repo, so the cost is on the page rather than assumed

walked 2026-09-07 against disk, over 4735 files:

| | count |
|---|---|
| `never`, total | **2900** across **962** files |
| of those, **contrastive** (`X, never Y`) | 1274 |
| the rest | 1626 |
| in a **filename** | 4 — one of them `rule.require.generic-governs-structure-never-voice` |

⇒ so a conform of the contrastive half would rename a booted, published telepath rule and touch
1274 lines that carry a bound already. the sort above is what makes the rule affordable, and it is
derived from the wisher's own reason — *"only the sith deal in **absolutes**"* names the quantifier,
so a binary exclusion sat outside it from the start.

🟡 **the 1626 is a candidate set, over a defect count.** the shape test is a regex, and a regex
cannot part a walked set from an unwalked one. so that number is the population a reviewer reads,
and the rule's real yield is the subset that names no set.

## .the axis

a structure rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`) — an
unbounded quantifier is unbounded in every register, so it prescribes no member of that rule's
voice row.

blocker: an absolute claimed over a set the author did not walk and no mechanism closes · a
quantifier where a count was available · *"impossible"* where *"no shipped surface"* is the truth.
nitpick: an absolute that is true and would read sharper as its mechanism.
false positive: a contrastive `never`, which names its one alternative · an absolute over a set the
author walked and states · a quantifier a mechanism closes, with the mechanism named · a verbatim
quote · a term declared with the word in it.

⇒ see also: `rule.require.disputable-claims` (the bound this asks for) ·
`rule.forbid.subversive-prose` (the hedge stack is this defect's mirror — one overstates, one
understates, and neither states) · `rule.forbid.obfuscation` · `rule.forbid.gerunds`
(`ehmpathy/role=mechanic` — the termsmell pattern this follows).
