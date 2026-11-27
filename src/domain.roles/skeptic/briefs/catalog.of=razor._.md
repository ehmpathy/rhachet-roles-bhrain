# catalog.of=razor — the razors of the greats, as an index

> a razor is a question put to a claim. each one aims at a shape of claim a mind is known to get wrong. the catalog lets the doubt you would not have thought of still run.

one row per razor. read a razor on demand; its path is computable from its row:

```
briefs/catalog.of=razor.shaves=$group.razor=$slug.md
```

e.g. `occam` in group `cause` → `briefs/catalog.of=razor.shaves=cause.razor=occam.md`. each file holds the question, what settles it, the verified source, when it fails, and the rule that runs it.

## .how to pick one

1. **which shape** does the claim take? → the group
2. **which razor** in that group fits? → the row
3. **what settles its question?** → the work owed
   - **logic**: inspect the claim itself. no read needed
   - **observation**: name the read, then run it
   - **rivals**: write the rival set first, at full strength, then shave

groups `untestable` and `proof` fire first: a claim no test can reach, or that no one owns, needs no cause weighed.

## .the razors

### shaves=untestable — a claim that cannot be tested

| razor | the question | settled by |
|---|---|---|
| popper | what observation would show this wrong, and was it run? | logic, then observation |
| alder | what observations would settle this, and does the claim entail them? | logic |
| hume-is-ought | which value joins this "is" to this "ought"? | logic |
| duhem-quine | this observation contradicts the claim: which part of the bundle failed? | rivals |

### shaves=proof — a claim with no owner or weight

| razor | the question | settled by |
|---|---|---|
| russell | am I the one who asserts? then the proof is mine | logic |
| hitchens | what evidence came with this claim? | observation |
| sagan | how far is this from what is settled, and does the evidence match? | rivals |
| cromwell | have I left any room to be wrong? | logic |

### shaves=cause — a cause among rivals

| razor | the question | settled by |
|---|---|---|
| occam | which parts does this assume that a rival would not need? | rivals |
| anti-razor | does the simpler claim fit every observation, or only the ones kept? | rivals |
| hume-proportion | is this cause exactly sufficient: neither short nor beyond? | logic |
| hickam | could two or more causes hold at once? | rivals |
| hanlon | did a slip, a gap, or a default explain it before I named a motive? | rivals |
| morgan | does a lower-capacity explanation suffice before I credit a higher one? | rivals |
| rapoport | can I state the rival so well its holder would thank me? | rivals |

### shaves=frame — a choice or frame

| razor | the question | settled by |
|---|---|---|
| false-dilemma | do these options cover every case? | logic |
| instrument | did the tool I hold pick the shape of the problem? | rivals |
| chesterton | do I know why this fence was built, and what breaks if it goes? | observation, plus rivals |

### shaves=number — a number or a sample

| razor | the question | settled by |
|---|---|---|
| goodhart | now that someone aims at this number, does it still track the outcome? | observation |
| base-rate | how often does this kind of case hold across the whole class? | observation |
| survivorship | which cases did this sample drop? | observation, then rivals |
| segal | is there a second, independent measure that could disagree? | observation |

### shaves=scope — a claim at the wrong level: the forest and the trees

a part stated as the whole, a whole stated of a part, a case stated as a law, a model stated as the world. the plain name is an idiom, first recorded by Thomas More, *Confutacion of Tyndals Answere*, 1533: "he can not se the wood for the trees" (read at https://www.phrases.org.uk/meanings/you-cant-see-the-wood-for-the-trees.html). the idiom names one direction; the razors below run both.

| razor | the question | settled by |
|---|---|---|
| ladder | on which rung does this claim sit, and on which its evidence? name a case and a class | observation |
| composition-division | is a trait of the parts stated of the whole, or of the whole stated of a part, and does it transfer? | logic |
| simpson | does this trend hold inside each subgroup, or only in the pool? | observation |
| hasty-generalization | how many cases back this "all", and how were they drawn? | observation |
| external-validity | does the place it was shown match the place it is now used? | observation |
| overfit | was it fitted to the reads it cites, and did it meet one it was not fitted to? | observation |
| misplaced-concreteness | is this noun a real item, or a label for a class, a score, or a model? | logic |
| leaky-abstraction | what does this layer hide, and could the hidden part break the claim? | observation |
| box | for what use is this model held, and is its error small enough for that use? | rivals |

its repair move is this role's own razor, foundation vs application (below): it shaves no claim; it sorts a lesson into two right levels.

### shaves=self — where the seat is easiest to fool

| razor | the question | settled by |
|---|---|---|
| feynman | where am I easiest to fool, and what test could show me wrong? | observation |

`cromwell` and `segal` point here too: no seat audits itself without an outside check.

## .the dials and pairs

- **how many causes**: `occam` (fewer) · `anti-razor` (enough for every observation) · `hickam` (several at once). one dial, three settings
- **refute, then ask what failed**: `popper` → `duhem-quine`
- **the burden pair**: `hitchens` (what came with it) · `russell` (who owes it)
- **the self trio**: `feynman` · `cromwell` · `segal`
- **up and down the ladder**: `ladder` names the rung; `hasty-generalization` and `external-validity` guard the climb up; `composition-division` and `simpson` guard the step down

## .the law of the catalog

- each razor asks; none refuses. a survivor of every razor is "not yet refuted", never "proved"
- a rivals razor names its rivals before it shaves. a logic razor needs no read
- a binary fork can be truly binary (say why); a zebra does occur; the tool in hand is often right

## .the one razor of this role

`rule.always.razor-the-foundation-from-the-application`: split each lesson into the law that holds in any domain and the act it owes here. it is this role's own, not a great's; it never takes a row above.

## .considered and left out

each fails the test for a row: does it ask a question no row already asks?

- grice: unverified; occam covers the rest
- brandolini: states a cost, asks no question; it is why `hitchens` and `russell` pay
- sturgeon, lindy: base-rate cases
- munger's inversion: overlaps `popper` and the rival set
- the einstein and mencken lines: cited under `anti-razor`
- ecological fallacy: the worked case under `composition-division`; korzybski's map and territory: under `misplaced-concreteness`
- the rule of three, and metz's wrong abstraction: under `hasty-generalization`; reference class: under `base-rate`
- hume's problem of induction: cuts every claim, so none; it is why `hasty-generalization` grades a degree
- "the exception proves the rule": an exception named after the case is a patch; one named before it is a scope bound
- the duck test: its fault IS the question to ask (what else quacks?)
- betteridge: one source type; chekhov's gun: a craft rule that pulls against doubt

## .the test

> **which razor does this claim's shape invite, and what is left after it?**

full sources for the role: `define.skeptic.lessons-from-the-greats`.

---

written by human + beaver 🦫
