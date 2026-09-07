# rule.forbid.decode-friction

> **count the mental steps between the words and the claim. more than zero is decode friction.**

**decode friction** is any prose that charges the reader an operation before its claim arrives — a
lookup, a count, a look-back, an inversion, or a decipher.

⇒ the term is adopted, never coined. `rule.forbid.inline-decode-friction` (ehmpathy/mechanic) owns
it for **code** — *"do i have to decode this to understand what it produces?"* this is its prose
half, and the test transfers unchanged.

## 🟡 .the test is a COUNT, and that is what makes it work

> **how many mental steps from these words to the claim?**

zero → it reads · one or more → each step is the defect, and each is nameable.

an author cannot answer *"is this clear?"* honestly, because **for them the count is always zero** —
they hold the referent, the term, and the order they wrote it in. so the verdict form of this rule
grades nobody.

- a count forces a RANK instead of a verdict
- ⇒ and a rank is what a second reader can check

🟡 same move as the 95% bar in `rule.require.reflexive-condensation`, and for the same reason: a
number is checkable where a judgment is not.

## .the two species

| species | what the reader must do | why an author writes it |
|---|---|---|
| a **FETCH** — the meaning is stated; assembling it costs work | look up a term · count a row · look back for a pronoun · carry a qualifier from elsewhere | an oversight. the author already held it, so they did not spare it |
| a **RIDDLE** — the meaning is encoded; it must be deciphered | guess what was meant | authored. the encode felt like craft at the moment it was chosen |

🟡 **the riddle species has its own rule, and it is not redundant** — an author who sweeps their
fetches will keep every riddle, because a fetch reads as an oversight and a riddle reads as the good
part. ⇒ `rule.forbid.riddles`.

## .the shapes — the FETCH species

| shape | 👎 as written | steps | 👍 the reading form |
|---|---|---|---|
| undeclared jargon — a term the reader must look up or guess | *"the lane catches what a re-read cannot"* | 1 lookup | *"the peer reviewer catches what a re-read cannot"* |
| the index reference — the reader must count | *"row 2 is the expensive instance"* | 1 count | *"the metaphor row is the expensive instance"* |
| the distant referent — a pronoun whose subject is sentences back | *"it does not, and that is the whole reason"* | 1 look-back | *"the guard does not read the review, and that is the whole reason"* |
| the displaced qualifier — the bound arrives away from the claim | *"unfixed"*, its scope in a column header two cells away | 1 fetch | *"unfixed **at the vision**"* |
| the double negative | *"it is not the case that no reviewer reaches it"* | 1 inversion | *"one reviewer reaches it"* |
| the inverted clause — the condition precedes its consequence by 20 words | *"where the rubric matches zero files and the flag is absent, it throws"* | 1 hold | *"it throws — when the rubric matches zero files and the flag is absent"* |
| the undeclared symbol | a glyph whose sense is never stated | 1 guess | declare it, or drop it |
| the compound claim — two assertions fused, so neither can be disputed alone | *"the scope is prose-only because it grades prose and would otherwise overflow"* | 1 split | two sentences, or a bullet and a child |

⇒ **not one repair adds a word for its own sake, and four are shorter.** the fix is to state the
referent, never to explain around it.

## .why a re-read is a cost the author never pays

the author knows the referent, holds the term, and wrote the clause in the order it occurred to
them. the decode step costs them zero, every time, so the sentence reads clean on the page they just
wrote.

- the reader pays it on the first read
- ⇒ and on **every** later read, because a decode is not cached
- a passage of ten such sentences is not ten small costs — the reader's working memory goes to
  assembly rather than to the argument, so the argument lands at a fraction of its strength

🟡 **it survives every density rule.** a decode-friction sentence can be short, active, bulletized,
disputable, and correctly placed. `require.brevity` and `forbid.rambles` both pass it, because no
word in it is surplus — the defect is the ORDER and the REFERENCE, never the count.

## .why it is a rule of its own

| rule | its subject |
|---|---|
| `require.brevity` | surplus words inside a line |
| `forbid.rambles` | a line that runs past its own point |
| `forbid.narration` | a tree serialized into a paragraph |
| `require.reflexive-condensation` | a line that ranks below the bar |
| this rule | a line that ranks **above** it, and is still **unreadable at first pass** |

⇒ the four above grade **how much** was written. this grades whether what was written can be taken
in the order it appears.

## .the measured case

the wisher, mid-drive, on a priority table in this route's own vision yield:

> *"do you mean a peer-reviewer? wtf is a lane"*

`lane` was an undeclared synonym of `reviewer` — 577 occurrences across 72 files before the stop.

⇒ **the author never paid the lookup, so the author never counted it.** the reader paid it on the
first line and stopped reading.

## .when it fires

| when… | then… |
|---|---|
| you use a term this repo has not declared | the strongest cue. check the glossary, or declare it |
| you refer by position — *"the second one"*, *"row 2"*, *"the above"* | name it. a position is an index the reader must compute |
| a pronoun's subject is more than one sentence back | repeat the noun. two words, and it spares a look-back |
| a qualifier sits in a header, a column, or a footnote | move it to the claim it bounds |
| you write a sentence with two `not`s | invert it. a double negative is a computation |
| a condition runs 20 words before its consequence | lead with the consequence |
| you use a glyph whose sense you have not declared | declare it, or drop it |
| a sentence fuses two claims with *"because"* or *"and"* | split. a fused claim cannot be disputed in halves |

## .the boundary

| a violation | not a violation |
|---|---|
| a term the reader must guess | a **declared** domain term used in its declared sense |
| a reference by **index** — the reader counts | a reference by **name**, or by a **printed id** |
| a qualifier separated from its claim | a qualifier adjacent to its claim |
| a compound claim fused into one sentence | a claim and its ground, in two sentences |
| a glyph with no declared sense | a glyph declared in `catalog.of=glyph._.md` |

**the line that parts them: does the reader hold what they need at the moment they read it?**

- yes → it reads, however dense
- no, they must fetch or compute → decode friction, however short

### 🟡 .an INDEX is computed; an ID is read — and only the first is a defect

the two render alike, so a sweep that cuts *"row 2"* will also cut *"case=F11"*, which is the shape
a peer rule **prescribes**.

| the reference | what the reader does | verdict |
|---|---|---|
| *"row 2 is the expensive instance"*, over an unnumbered table | counts to 2 | 🔴 an index |
| *"the metaphor is the expensive instance"* | reads | ✅ a name |
| *"`case=F11` overturned it"*, over a table whose id column prints `F11` | reads | ✅ an id |

⇒ **an id is a name that happens to be short.** it is printed beside its row, so no arithmetic
stands between the reference and its referent.

🟡 the carve-out is owed rather than convenient: `declare-once` states its repair as *"enumerate by
id, never restate a count"* — so a decode-friction sweep with no id carve-out would delete the one
technique its peer rule asks for.

🟡 **dense is not the defect.** a compressed sentence whose every term the reader already holds
reads at full speed. this rule grades ASSEMBLY, never compression — and the two are often opposites,
since the repair is usually a **shorter, more precise** phrase.

## .the axis

a structure rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`). a
sentence that must be decoded must be decoded in every register, so it prescribes no member of that
rule's voice row.

blocker: an undeclared term used as though declared · a reference by index where a name would serve
· a qualifier placed away from the claim it bounds · a compound claim fused so neither half can be
disputed · a glyph used with no declared sense.
nitpick: a pronoun whose subject is more than one sentence back · a condition that precedes its
consequence by more than a clause.
false positive: a declared domain term in its declared sense · a dense sentence whose terms the
reader holds · a deliberate double negative that names a logical shape · a verbatim quote · **a
reference by a printed id** (`case=F11`, `S39`) · **a reference into a binary just named** (*"the
first is X; the second is Y"* — no count is owed).

⇒ see also: `rule.forbid.riddles` (the second species, and the one an author will not cut) ·
`rule.forbid.inline-decode-friction` (ehmpathy/mechanic — the code half, where the term is
declared) · `rule.require.elucidation` · `rule.forbid.subversive-prose`.
