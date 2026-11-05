# F5 — the reviewed code rides the system prompt

## .the fork

the corpus-first layout puts the target corpus in the head, and the head rides as the system
prompt. target bodies were user-role before. an instruction planted in a reviewed diff now reads
at system trust.

- **A, taken.** keep the corpus in the system prompt. state the trade beside the template
  (`asPromptHeadStatic`), and keep the target fenced as data: the `<target>` block, and a closer
  that names it as what to review.
- **B.** send the head as the first bytes of the user message. no system prompt rides, so the
  adapter has no slot to anchor a shared prefix in
  (`rule.require.name-the-shared-prefix-as-the-cache-anchor`). the corpus is the 88% a level
  shares, so B forfeits the cure.

## .why A

the harm a forged instruction can do is bounded. a review's output is a verdict a guard tallies.
a forged clean verdict still meets the driver's passage and the human gate. B gives up the whole
cure to narrow that one path.

## .rework

clean. `asRoleOfSharedPrefix` names the system slot in one place. a move to the user message is
an edit there and in the head's census, with no change to the prompt's bytes.

## .confidence — 75%, and why not higher

no measurement of a model's trust gap between the two roles was taken, and the bound above rests
on the guard and the human gate, not on the model.

## .verdict

open — for the director at the end of the route.
