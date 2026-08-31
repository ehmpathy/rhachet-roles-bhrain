# rule.require.specialize-a-rule-its-readers-look-past

## .what

> **a rule whose every example draws from one domain will be read as a rule ABOUT that domain.**

when a reader violates a general rule in a **second** domain, the repair is **not** a louder
`.what`. it is a **named specialization** — a peer rule, in the domain the reader occupied, that
states the same claim in that domain's own words and cites the general rule as its parent.

## .why

a reader does not consult a rule index before each keystroke. they pattern-match on what the rule
**looks like**, and the examples are what it looks like.

so a general rule illustrated only with `aws` reads as *"the aws rule"*. a reader who has read it,
believed it, and agreed with it will type `ssh grove-1` **without a flicker of recognition** —
because they are not in aws-land, and every signal the rule sent said aws.

⇒ **this is not a failure of attention. it is a failure of retrieval.** the rule was in context and
did not fire, because the cue it carried did not match the situation the reader was in.

and the repair a conscientious author reaches for first — bold the `.what`, widen the phrasing,
add a warn line — is the **weakest** available move. it addresses a reader who is already engaged.
the reader who looked past is the one who never engaged at all.

## .the evidence — the split that worked

**2026-07-28.** `rule.require.wrap-cli-in-skills` carried the general claim, illustrated end to
end with `aws`. its own `.see also` records the outcome:

⚠️ **that rule and its specialization are FOREIGN — do not glob for them here.** both live in the
org role set this repo depends on, never in this tree; the ask to author them was re-seeded to the
repo that owns that namespace, per *a tree adopts only what is scoped to its own repo*. what is
cited below is **testimony from that repo's record**, and it is the evidence for this rule rather
than a parent claim of it.

> *"`rule.require.reach-a-grove-through-its-duct` — this rule, specialized to groves. **split out
> 2026-07-28 because every example here is `aws`, and a reader looked straight past it while they
> typed `ssh grove-1`.**"*

## ⚠️ .the honest bound — a specialization raises retrieval, it does not guarantee it

a specialization is a **better cue**, never a gate. where the pull toward the un-paved path is a
keystroke's worth of convenience, a brief on its own is still outscored by a **mechanism** — a
hook, a guard, a gate. per this repo's own cited research, a when-then cue scores far above a
principle, and a mechanism above both (`research.selfreview-effectiveness`).

⇒ so a split is the **first** move, never the last. a rule looked past **after** it was
specialized has earned a mechanism, and the specialization is what tells you which situation the
mechanism must fire in.

## .the cues — when → then

| when… | then… |
|---|---|
| you write a general rule and **every example is from one domain** | 🔴 the split is owed **at authorship**, not after the first violation |
| a reader violates a general rule **in a domain it does not illustrate** | that is the signal. specialize into **their** domain, do not bold the parent |
| you are about to **bold, widen, or warn** in a general rule after a miss | ask first whether the reader ever recognized the rule applied |
| a rule reaches a second domain and you add a **second example** to it | an added example is cheaper and weaker. weigh a named peer instead |
| you name a specialization | name it in the **reader's** vocabulary (`reach-a-grove-through-its-duct`), never the parent's |

## .the test — forced articulation

> **"in what situation would a reader who agrees with this rule fail to notice it applies?"**

- you can name one → **that situation is the specialization**, and it is owed
- you genuinely cannot → the rule's examples already span its domain

⚠️ this test is answerable **before** any violation. the 2026-07-28 split was made after the
miss; it could have been made when the second domain was first reached.

## .what a specialization owes

| the doc | must carry |
|---|---|
| the **specialization** | the claim in the reader's own domain vocabulary, its own concrete examples, and a **`.see also` pointer up** to the parent rule |
| the **parent** | a `.see also` pointer **down**, plus one line on **why** the split happened — the dated miss |

⇒ the pair is the point. a specialization with no parent link duplicates a claim and drifts from
it; a parent with no note of the split loses the evidence that the general form was insufficient.

## ⚠️ .this is NOT a license to fork a rule per domain

a rule split into six near-identical peers is `rule.forbid.domain-term-synonyms`'s failure in a
new form: six statements of one claim, which drift apart and then disagree.

| the situation | the move |
|---|---|
| a reader **looked past** the rule in a second domain — evidenced, not guessed | **specialize** |
| a reader **read** the rule and disagreed with it | argue the rule; a peer changes no mind |
| you **anticipate** a second domain, with no reader and no miss | add an example. wait for the evidence (`rule.prefer.wet-over-dry`) |

⇒ **the trigger is a real reader who looked past it.** the aws → grove split had one. a
speculative split has none, and it costs every future reader a second file to reconcile.

## .enforcement

- a general rule whose every example is from one domain, after a reader violated it in a second =
  **blocker** — the specialization is owed
- a repair applied by **emphasis** (bold, a widened `.what`, a warn line) where a reader never
  recognized the rule applied = **blocker** — it addresses the wrong failure
- a specialization with no `.see also` pointer to its parent = **blocker** — an unlinked peer
  drifts
- a parent with no note of **why** it was split = **nitpick** — the evidence that the general form
  was insufficient is what stops a later merge
- a rule forked per domain with no evidenced miss = **blocker** — that is synonym sprawl in rule
  form

## .see also

- `rule.require.specialize-a-rule-its-readers-look-past.example=grove-ssh-after-the-split.md` —
  the 2026-07-29 case where the split had already landed, both briefs were in context, and the
  driver ran the raw path ten times in one hour
- `rule.always.reuse-pavement-before-improvise` — check for an extant specialization before you
  lay a second one
- `rule.require.rules-are-clusters` (librarian) — the peer-shape discipline: one worked case in
  the rule, occurrences beside it
- `rule.require.timeless-lessons` — a dated miss is evidence and stays; the ambient session drops
- `research.selfreview-effectiveness` — why a mechanism beats a cue, and a cue beats a principle
- `rule.prefer.wet-over-dry` (ehmpathy) — why the **evidenced** miss is the trigger, not the
  anticipated one
