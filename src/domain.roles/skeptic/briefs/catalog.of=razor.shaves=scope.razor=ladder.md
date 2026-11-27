# razor: the ladder of abstraction

shaves: a claim at the wrong level (the level itself) · settled by: observation (name the case; find it in the record)

## .the question

> **on which rung does this claim sit, and on which rung does its evidence sit? name one concrete case it covers, and one class it belongs to.**

the one razor of the `scope` group that runs both ways. down: name a case (the trees). up: name the class, or what to do with the cases (the forest).

## .the ladder

each rung up keeps what the cases share and drops what sets them apart. Hayakawa's own rungs, read from the bottom:

| rung | Hayakawa's example | a seat's example |
|---|---|---|
| VIII | "wealth" | "quality is poor" |
| VII | "asset" | "ci is unreliable" |
| VI | "farm assets" | "the suite is flaky" |
| V | "livestock" | "the integration tests are flaky" |
| IV | "cow" | "this test is flaky" |
| III | "Bessie" (cow₁) | "this test failed on run 412" |
| II | the cow we perceive | the red line we see in the log |
| I | process-Bessie: "a perpetual dance of electrons" | the process: timer, socket, race, and all the rest |

abstraction is no defect: "this process of abstracting, of leaving characteristics out, is an indispensable convenience." a claim may sit on any rung. the defect is a claim cut off from the rungs below it.

## .the three defects

| defect | what it looks like | Hayakawa / Johnson |
|---|---|---|
| **stuck high** | a claim that never points down to a case: "the system is fragile", "we need better quality" | the thought that "never points down the abstraction ladder to lower levels of abstraction and from there to the extensional world". "the high-level speaker frustrates you because he simply doesn't tell you what he is talking about" |
| **stuck low** | a heap of cases with no class and no next act: a log dump, a list of what happened, no "so" | "the low-level speaker frustrates you because he leaves you with no directions as to what to do with the basketful of information he has given you" |
| **the leap** | the claim sits rungs above its evidence: one failed run (III) reported as "the suite is flaky" (VI) | the evidence holds rung III; the claim spends rung VI. run `razor=hasty-generalization` on the climb, `razor=composition-division` on the step down |

a fourth, for terms: a definition at the same rung gives no information. "indifference" defined as "apathy", "apathy" as "indifference". a domain term defined only by its synonym, or by a higher word ("a stone is a kind of milestone"), says naught until it points down to an instance.

## .the move

1. **name the rung of the claim**: which word carries it? "flaky", "unreliable", "always" sit high
2. **name the rung of the evidence**: what was actually read? a run, a line, a count
3. **gap > 0 → close it**: lower the claim to the evidence's rung, or climb the evidence (more cases, a count over the class)
4. **stuck high → step down**: name one case the claim covers, by path, id, or line
5. **stuck low → step up**: name the class the cases share, or the act they call for

Hayakawa's test of a sound high-level claim: its abstractions "can systematically and surely be referred to lower level abstractions". clear thought requires "the constant interplay of higher and lower level abstractions"; in science, "hypotheses being checked against observations".

## .the source

- S. I. Hayakawa, *Language in Thought and Action*, London: George Allen & Unwin; ch. 10 "How We Know What We Know", pp. 166-179: the Bessie passage, the diagram "Abstraction Ladder" (p. 169), "Chasing Oneself in Verbal Circles", "Dead-Level Abstracting"
- the book's own foreword: it "began as a revision of *Language in Action*, published in 1941". the edition of the scan is not stated in the text read
- "dead-level abstracting" is Wendell Johnson's term, from *People in Quandaries*, as Hayakawa cites it
- the ladder "is based on 'The Structural Differential,' a diagram originated by A. Korzybski", *Science and Sanity*, 1933, ch. XXV
- read in full text by bhrowser at https://archive.org/details/in.ernet.dli.2015.30957 (Digital Library of India scan; its catalog date of 1911 is wrong)
- the idiom names one direction only: "he can not se the wood for the trees" (Thomas More, *Confutacion of Tyndals Answere*, 1533, its first record); "ye can not see the wood for trees" (Heywood, 1546). read at https://www.phrases.org.uk/meanings/you-cant-see-the-wood-for-the-trees.html

## .fails when

- the rungs have no fixed count; name the two in play, never a number
- a case named from memory may be made up: find it in the record
- a high claim is not a defect in itself. only a claim that cannot be referred down is

## .run by

`rule.always.razor-the-foundation-from-the-application`
