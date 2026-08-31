# rule.require.place-a-passage-by-its-subject

## .what

> **a passage sits where its SUBJECT sits — never where the author's cursor was.**

when you write a new sentence, table, or pointer into an extant document, its home is decided by
one question: *what is this passage about?* find the section about that, and put it at the end of
it.

## .why — the cursor is a fact about the AUTHOR, not about the reader

the defect has one mechanism, and it is mechanical rather than careless:

1. you open a document to edit **passage A**
2. while you are there, you produce a **new thought B**
3. B lands at the cursor — which is inside A

⇒ **the cursor recorded where your process was. it says naught about where a reader will look.**
and because step 3 requires no decision at all, the defect recurs on every edit that produces a
thought its author did not open the file to write.

### the two costs, and the first one is invisible to the author

**1. it severs an argument.** a passage dropped between two sentences of one continuous thought
breaks the thread. the author does not feel this, because the author holds both halves in mind;
the reader has only the page, and on the page the second half now answers an interruption instead
of the first half.

**2. it is unfindable.** a reader who wants that passage searches under its own subject. a pointer
about *concepts vs capacity* filed inside a paragraph about *the ladder* is retrievable only by
someone who already knows where it is — which is no one but the author.

⚠️ **and an intro is the worst possible landing site.** a `.what` or an opening paragraph is the
highest-traffic real estate in any document; a passage inserted there displaces the claim every
reader came for, and it pays the severance cost at the exact point where the reader has the least
context to recover from it.

## .the cues — when → then

| when… | then… |
|---|---|
| you produce a thought **while mid-edit on something else** | 🔴 the strongest cue there is. do not type it where you are — name its subject first |
| you are about to add a **pointer to another document** | its home is the end of the section whose subject it zooms, plus a `.see also` line |
| you insert a passage into an **intro** or a `.what` | ask whether the intro is genuinely about that, or merely where you were |
| you find yourself with a sentence that begins *"also"*, *"and note that"*, *"relatedly"* | those words are what a passage reaches for when it has no home in its surroundings |
| a section grows a passage on a **second** subject | that is `rule.prefer.decompose-a-subject-via-suffixes` — eject it, do not accrete it |

## .the two tests

> **1. the severance test — delete the passage. do the two passages around it now read as one
> continuous thought?**

- yes → 🔴 you severed something. move the passage out
- no → they were already separate; the placement did no harm on this axis

> **2. the subject test — what is this passage ABOUT? is the section it sits in about that?**

- yes → it is home
- no → find the section that is, and put it at the end of it
- **no section is** → the document has no home for it, so it is a **new section**, or a peer file

## .the worked case

`philosophy.entoolment-is-the-pinnacle._.md` opens with a two-sentence claim: what the ladder is,
then what follows from it. a pointer to its `concepts-vs-capacity` zoom-in was inserted **between
those two sentences**, because the author was mid-edit on the first one.

both costs landed at once. the opening claim was cut in half, and a reader who wanted the
concepts-vs-capacity argument would never look for it under *"what the ladder is"*.

⇒ **and the same file already held the answer.** its `via-routes` pointer sits at the **end** of
the section whose subject it zooms, with a `.see also` line beside it. the correct placement was
one scroll away, in the same document, in the author's own prior hand
(`rule.always.reuse-pavement-before-improvise`, learner).

## .why this is telepath's and not the librarian's

both roles govern documents, and the split is clean:

| role | governs | its subject |
|---|---|---|
| **librarian** | the artifact's **contract** — is this a catalog, an inventory, a cluster? does its name declare its coordinates? | the shelf |
| **telepath** | the reader's **parse** — does the concept arrive whole, in one pass? | the transfer |

a misplaced passage breaks no contract. the file is still a valid philosophy, correctly named,
correctly wired. **what it breaks is the transfer** — the reader's thread, and the reader's ability
to retrieve. that is telepath's whole subject.

⇒ and the librarian's own charter says so directly: a librarian *"operates **between** documents"*
(`kno401.actors.1.role.librarian`). a passage's position **within** one document is not between
any two of them.

## .enforcement

- a passage inserted mid-argument, where its removal would restore one continuous thought =
  **blocker**
- a passage whose subject is not the subject of the section it sits in = **blocker**
- a cross-document pointer placed anywhere but the end of the section it zooms = **nitpick**
- a passage in an intro or `.what` that is genuinely about the intro's subject = **false positive**

## .see also

- `rule.prefer.decompose-a-subject-via-suffixes` (librarian) — what to do when the passage is not
  merely misplaced but a whole second subject
- `rule.require.summary-at-the-cluster-root` (librarian) — the artifact-contract half, for
  comparison: that one governs the file's NAME, this one governs a passage's POSITION
- `rule.always.reuse-pavement-before-improvise` (learner) — the worked case's second lesson: the
  correct placement was already in the same file
- `rule.forbid.rambles` (ehmpathy/mechanic) — the adjacent smell; a ramble is a passage that
  overstays, where this is a passage that sits in the wrong room
