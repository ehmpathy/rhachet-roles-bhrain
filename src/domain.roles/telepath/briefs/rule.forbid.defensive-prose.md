# rule.forbid.defensive-prose

> **write so the reader can USE it. prose written so the reader will ACCEPT it is a defense, and a
> defense is charged to every reader who raised no objection.**

**defensive prose** is any passage aimed at a reader modeled as a JUDGE — one who might reject the
author's choice — over a reader modeled as an ACTOR, one who needs to act on it.

## .why it is a rule of its own — it names the GENERATOR, never a shape

every other grader in this canon reads a property of the words. this reads the author's model of the
reader, and that model emits several shapes at once.

⇒ so an author who cuts seven shapes and keeps the model emits seven more next round.

**measured on this canon's own author, 2026-09-07:** a 12-line code comment on a one-line regex
change. 3 lines carried the mechanism; 9 defended the change. nine rules fired on it, and the author
had written three of those nine within the hour.

- the aphorism, the inline trail, the caps stress, the paragraph form
- ⇒ not nine slips. one intent, and every shape it produces

## .the test — a COUNT, per line

> **does a reader who wants to USE this need the line?**

count them. `informs` against `defends`, and state the ratio.

🟡 **a per-line JUSTIFICATION test cannot catch this.** every defensive line is true, short, and
defensible on its own merits — which is exactly what carries it through a careful cut. only the USE
question parts them, and an author asks it of themselves last.

## .the shapes

| shape | what it defends against | 👎 as written | 👍 |
|---|---|---|---|
| the pre-justification | *"you might think this was arbitrary"* | *"the comments argue each rule's tier, and a good argument cites its peers"* | delete. nobody charged it |
| the shown work | *"you might think I did not check"* | the measurement trail, inline | the result. the trail refs out |
| the principle | *"you might think this is a hack"* | *"an audit is evidence about its instrument until the instrument is verified"* | the mechanism, stated flat |
| the pre-emptive concession | *"you might object to X"* | *"it does not buy sincerity"* | delete. let the reviewer strike first |
| the absolution | *"you might think it was broken"* | *"the transport was never broken"* | delete. no reader charged it |
| the emphasis plea | *"you might not agree"* | caps, glyphs, and a bold on every clause | one mark, on the needle |
| the completeness display | *"you might think I missed a case"* | seven cases, where two carry the claim | the two |

⇒ **four of the seven are already named by a peer rule as a SHAPE.** what this adds is why they
arrive together: one intent produces all seven, so a sweep that cuts them one at a time leaves the
source live.

## .when it fires

| when… | then… |
|---|---|
| you are unsupervised, with a review ahead | the strongest cue. the reviewer is modeled as a judge, and that model is what emits the shapes |
| you were corrected in the last round | 🟡 the sharpest, and it is counter-intuitive: a correction raises the defense, and the defense is the defect |
| you change what you were not asked to change | the pull is to justify the change. state what it does |
| the change is one line and the explanation is twelve | that ratio IS the measurement |
| you would write *"a good X does Y"* as a premise | a premise nobody disputed, offered to earn agreement |
| you would state the measurement that led you here | the result informs; the road defends (`rule.require.archaeology-in-notes`) |
| you would close with a principle | it makes a small fix sound settled. state the mechanism instead |
| you sense the reader might not accept it | that sense IS the substitution. ask what they need to DO |

## .the boundary — a RATIONALE informs; a DEFENSE persuades

| a violation | not a violation |
|---|---|
| a premise offered so the reader agrees | a warn a future editor needs to not re-break it |
| the road to the result, inline | the result, and one line of ground |
| a principle that settles a small choice | a caveat the reader must act on |
| every case enumerated, where two carry the claim | a dispute record, whose declared subject IS the argument |

**the line that parts them: does the reader need it to ACT, or to AGREE?**

- act → a rationale. it stays, however long it runs
- agree → a defense. cut it

### the three-way check

per `rule.require.enumerate-before-you-name` — a test that answers the same on the good case and the
bad one is a filter a notch too coarse, so all three are written out:

| the specimen | the passage | verdict |
|---|---|---|
| the informer | *"entry lines only; a comment citation does not boot."* | every line informs. **passes** |
| the defender | *"…the tier comments cite peers by name, and a good argument does that."* | its second clause defends the comments. **caught** |
| the warn | *"🟡 do not loosen to a bare `rule\.` match — the tier comments cite foreign rules, and each would read as booted."* | it explains a choice, AND the reader needs it to avoid an action. **passes** |

⇒ the warn is the one a coarse rule fails. it looks like a defense because it justifies — and the ACT
question separates it in one step.

## .the seam with `forbid.subversive-prose`

| rule | what it reads |
|---|---|
| `forbid.subversive-prose` | the SENTENCE — could an observation settle it? |
| this rule | the passage's AIM — is the reader modeled as an actor or a judge? |

⇒ they part in both directions:

- a careless aphorism, written because it read well, is subversive and not defensive
- a passage where every sentence is settleable, and nine of twelve exist to prove the author was
  careful, is defensive and not subversive — and it runs four times its useful length

## .the axis

a structure rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`). a
defensive passage is defensive in every register, so it prescribes no member of that rule's voice row.

🟡 **it is the closest rule here to the root.** `rule.require.elucidation` asks *can the peer USE it
now?*; this names the one substitution that replaces that question with *will the peer ACCEPT this?*

blocker: a passage whose lines mostly serve agreement over action · a premise offered against an
objection nobody made · the road to a result left inline · a principle that converts a small choice
into a settled one · every case enumerated where two carry the claim.
nitpick: emphasis raised past the bar to urge agreement.
false positive: a warn a future editor needs to avoid an action · a caveat the reader must act on ·
a dispute record or a `.reason` file · a decision record.

⇒ see also: `rule.require.elucidation` (the root this names the substitution for) ·
`rule.forbid.subversive-prose` (the sentence grain) · `rule.require.archaeology-in-notes` ·
`rule.require.reflexive-condensation` (the RANK test this needs) ·
`rule.forbid.purposeless-passages`.
