# rule.always.predict-before-you-look

> **before you run, read, or test, write one line: what you expect. then look. a match means the belief held; a mismatch means a belief of yours broke. stop, and find which.**

**how it applies the basis:** a first thought you never wrote down cannot be shown wrong: any result fits it after the fact. a prediction turns your own belief into a claim the world can refute, which is the only doubt of yourself that works.

## .why

- doubt with no outside signal does not help. a model that re-reads its own answer with no outside feedback grew less accurate on every benchmark tried (Huang et al. 2023, arXiv 2310.01798). self-correction helps where reliable outside feedback exists (Kamoi et al. 2024); the loops that gain, such as Reflexion, are fed by tests and env results
- the look is the outside signal; the prediction is what lets it reach your belief. a guess made before the answer raises surprise at a mismatch, where a guess made after it does not (the pretest effect)
- a score of stated expectations against outcomes is what tunes confidence: a short drill on it cut overconfidence and improved Brier scores 6 to 11% (Chang, Chen, Mellers & Tetlock 2016)
- a surprise is precise by construction: the mismatch is between your own written line and a recorded result, so it cannot cry wolf

## .the move

| step | the act |
|---|---|
| 1 | before a run, a read, or a test whose result you will act on: write `expect: <outcome>` (an exit code, a value, a line, a pass or fail) |
| 2 | look |
| 3 | match → say the belief held, and move on |
| 4 | mismatch → stop. name the belief that broke, where else you hold it or wrote it, and fix it there too (`rule.always.file-an-incident-for-a-defect-you-name-in-yourself`) |

## .the test

> **what did I expect before I looked, and did it match?**

## .the cues

| when… | then… |
|---|---|
| the outcome is one no one doubts (a test you expect to pass, a review you expect clean) | no prediction is owed: an expectation no outcome could surprise carries no information. predict what you are unsure of — which cause, which file, what count, what a peer will find |
| a result surprises you ("wait, what?") | that is a mismatch, whether or not you wrote the line: a belief broke (ergonomist `rule.forbid.surprises` names the same moment, as a tool defect) |
| you write "as expected" after a look | was it written before? if not, it is a fit after the fact, and proves none |
| you cannot say what you expect | you do not yet hold a belief about it; say so, and look to learn, not to confirm |

## .enforcement

blocker: a mismatch smoothed over with "as expected" or a re-run until green, with no belief named
nitpick: a run whose result you then acted on, with no expectation written before it

cites: `define.skeptic.lessons-from-the-greats` (Huang et al. 2023; Kamoi et al. 2024; Shinn et al. 2023; Kornell 2009; Chang et al. 2016).

see also: `rule.always.trust-no-one-especially-not-yourself` (the basis) · `rule.always.reach-less-wrong-via-questions` (a claim must forbid some outcome you could see)

forbid twin: `rule.forbid.predictions-written-after-the-look`

---

written by human + beaver 🦫