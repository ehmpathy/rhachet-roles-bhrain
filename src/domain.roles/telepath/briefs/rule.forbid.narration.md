# rule.forbid.narration

> **no narration. unless a human asked for a narrative, the passage must be bulletized.**

the clamp on `rule.require.bulletize`. that rule names the target; this one names the smell.

**narration** is prose that carries an argument in **sequence** where a **tree** was owed — a
paragraph of claims chained by connectives, a walkthrough of how you got there, a story told in
place of a structure.

## .why — a narrative hides the shape of its own argument

- prose serializes a tree and **deletes the edges**
  - the reader rebuilds them from *"however"*, *"which means"*, *"in that case"*
  - each rebuild is a place to guess wrong, and the author never sees the guess
- a narrative **cannot be skipped**
  - a reader who wants one claim must read every claim ahead of it to find it
  - an outline lets them descend one branch
- a narrative **absorbs surplus silently**
  - a bullet refuses a passage that fits no concept; a paragraph accepts it
  - ⇒ so narration is the container in which accretion grows

🟡 **and it is the shape every other defect hides in.** a truism needs a clause broad enough to
cover every case; a hedge stack needs four qualifiers; chronological accretion needs a sequence to
accrete along. **bulletize the passage and not one of them survives the split.**

## .the smells

| smell | what it is | the repair |
|---|---|---|
| the chained paragraph — *"X, so Y, though Z, which means W"* | an outline serialized; the connectives are its edges | nest them |
| the walkthrough — *"first we tried A, then B, and landed on C"* | also `rule.forbid.chronological-accretion` — state C and why | one bullet, plus the ground |
| the bulleted paragraph — a `-` on 47 words | the character is present, the form is absent | decompose it |
| the preamble — a paragraph before the claim it introduces | the claim is the bullet; the preamble is its parent | promote the claim |
| the buried list — *"there are three reasons: …"* prose-joined | the three are bullets, and the count is then self-evident | split at the commas |
| the run-on child — a bullet with a second sentence | two concepts on one line | split, or nest the second |

## .the test

> **would this passage survive a split into one-sentence bullets?**

- yes → **it was an outline all along.** render it as one
- no, because a piece belongs to no concept → **that piece is surplus.** cut it
- no, because a concept has no branch → **the tree is wrong.** add the branch
- no, because it is a **sequence a human asked for** → it is a narrative. prose is correct

**the second and third answers are the value.** the split does not merely reformat the passage —
**it audits it**, and it audits it before a reviewer is spent.

## .the boundary — the four licences are declared by `rule.require.bulletize`

this rule is that rule's clamp, so it fires exactly where that one does not. the four, with their
reasons, are declared there and cited here rather than restated: a human **asked** · a verbatim
quote · a narrative in a `.demo=` artifact · a single claim. only the first is general.

🟡 **an implied ask is not an ask.** *"explain this to me"* asks for a clear transfer, and an outline
is the clearer one. the licence needs the word — a narrative, a story, a walkthrough, a worked
sequence.

## .what this is NOT

| this fires | this does not |
|---|---|
| a paragraph of three or more claims | a paragraph of one claim and its ground |
| a walkthrough offered where a structure was owed | a walkthrough a human asked for |
| a bulleted paragraph | a table — it already carries the structure |
| a narrative in a rule or a yield | a narrative in a `.demo=` artifact |

⇒ it grades the **form against the ask**, never length alone. a long outline is legal; a short
narrative offered where a tree was owed is not.

## .the axis

a **structure** rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`) —
it governs **in what order, at what depth**, so it prescribes no member of that rule's voice row.

🟡 **it is a peer of `rule.forbid.chronological-accretion`, never its replacement**, and the two
overlap on one smell:

| rule | its subject |
|---|---|
| `forbid.narration` | prose where a **tree** was owed — a shape defect |
| `forbid.chronological-accretion` | prose ordered by **time** — a content defect |

⇒ a walkthrough trips both. a chained paragraph of timeless claims trips only this one.

blocker: a paragraph of three or more claims where an outline was owed · a walkthrough offered with
no ask · a bulleted paragraph · a bullet that holds two concepts.
nitpick: a preamble that delays its own claim by a paragraph.
false positive: a narrative a human asked for · a verbatim quote · a narrative in a `.demo=`
artifact · a table · a single claim with its ground.

⇒ see also: `rule.require.bulletize` (the positive peer — the target this guards) ·
`define.bulletize` (the form and the demos) · `rule.forbid.chronological-accretion` (the
time-ordered peer, which stays) · `rule.forbid.subversive-prose` (the shapes narration hides).
