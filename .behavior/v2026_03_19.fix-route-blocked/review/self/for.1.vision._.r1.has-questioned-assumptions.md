# self-review: has-questioned-assumptions

## hidden assumptions surfaced

### 1. "drivers read top of output first"

**what do we assume?** that drivers (LLM agents) prioritize content at the top of output when they decide what to do next.

**evidence?** none. LLMs process entire context. they may weight the END of output more (recency bias).

**what if opposite were true?** if drivers prioritize the bottom, the current design (bottom placement after 5+ hooks) might actually be better.

**did wisher say this?** no. wisher said "at the top" but didn't justify why top is better than bottom.

**counterexamples?** some LLMs show recency bias — last-seen content has more weight.

**verdict**: **assumption needs validation**. should we put the challenge at BOTH top AND bottom? or test which placement works better?

---

### 2. "the problem is visibility, not willfulness"

**what do we assume?** drivers loop infinitely because they don't SEE the `--as blocked` option, not because they REFUSE to use it.

**evidence?** the wish says drivers "may not know" the option exists. but it also says they "repeat over and over 'please run x'".

**what if opposite were true?** what if drivers DO see the option but ignore it because they're determined to complete the stone?

**counterexamples?** some drivers might be "stubborn" — they see blocked but refuse to admit defeat.

**verdict**: **partial assumption**. visibility is ONE problem, but not the only one. the "you must choose" mandate addresses willfulness, but may not be enough for stubborn models.

---

### 3. "ASCII box format will render clearly"

**what do we assume?** the ASCII box (┌───┐) will display correctly in Claude Code's terminal output.

**evidence?** i've seen tree-style output (├─, └─) render fine. but the box characters may differ.

**what if opposite were true?** if box characters corrupt, the output becomes unreadable noise.

**counterexamples?** some terminals/fonts don't render box-draw characters well.

**verdict**: **should test before ship**. or use simpler tree format that's proven to work.

---

### 4. "owl-themed metaphors resonate with drivers"

**what do we assume?** names like "fallen-leaf challenge" fit the owl personality and help drivers understand.

**evidence?** the owl persona uses 🦉, jasmine tea, stillness metaphors. autumn leaves align.

**what if opposite were true?** "fallen-leaf" might confuse drivers who don't know the owl backstory.

**did wisher say this?** wisher said "fallen-leaf challenge section" directly — this came from the wish.

**verdict**: **holds** — wisher used the term, so it's intentional. document the definition in the vision.

---

### 5. "boot.yml supports skill 'say'"

**what do we assume?** we can add `skills: say: [route.stone.set]` to boot.yml and it will work.

**evidence?** current boot.yml only shows `briefs:`. no skills example visible.

**what if opposite were true?** rhachet might not support skill headers in boot.yml. we'd need a different approach.

**counterexamples?** need to research rhachet boot.yml schema.

**verdict**: **must research before implement**. action item captured.

---

### 6. "equal presentation of all three options prevents loops"

**what do we assume?** equal presentation of arrived/passed/blocked will lead drivers to choose blocked when stuck.

**evidence?** none. drivers might still prefer "arrived" or "passed" even when truly stuck, because those feel like progress.

**what if opposite were true?** equal presentation might not change behavior. drivers might need stronger "blocked is ok" words.

**counterexamples?** human psychology: people resist to admit they're stuck. LLMs might inherit this bias.

**verdict**: **partial assumption**. equal presentation helps, but the "you must choose" mandate and the escalation counter (21x) provide backup.

---

## summary

| assumption | verdict | action |
|------------|---------|--------|
| drivers read top first | **needs validation** | consider top AND bottom |
| problem is visibility not willfulness | **partial** | mandate + escalation address this |
| ASCII box renders | **should test** | use proven tree format instead |
| owl metaphors resonate | **holds** | wisher used the term |
| boot.yml supports skill say | **must research** | research rhachet schema |
| equal presentation prevents loops | **partial** | backup mechanisms extant |

## changes to vision

based on this review:

1. removed reliance on ASCII box — suggest tree format as primary
2. noted that top placement is an assumption to validate
3. clarified that "you must choose" mandate is intentional to counter willfulness
