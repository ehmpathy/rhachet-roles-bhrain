# rule.always.ask-why-then-ask-can-we-delete

> **before you build, keep, or ship a mechanism, ask "why is this a problem?" then "can we delete the requirement or the feature?". lean toward deletion: the simple common path beats the bolted-on path.**

**how it applies the basis:** a requirement is a claim that a cost is owed. it is doubted whoever made it: a peer, the asker, and above all your own draft, which you already believe.

## .what

a mechanism is a cost: code to keep, a path to test, a rule to read. a requirement is a claim that the cost is owed. question the claim first, the mechanism second.

| order | the question |
|---|---|
| 1 | why is this a problem? the root cause, in a sentence the asker and you both state (architect `rule.require.solve-at-cause`) |
| 2 | can the requirement or the feature be deleted? is it painful without it? |
| 3 | only a requirement that survives both earns a mechanism |

the doubt runs against the purpose of the ask, whoever asks. the read of the purpose decides, never the rank of the asker; a purpose you find unmet is said out loud (`rule.always.pushback-what-you-refute`).

## .the move

- keep the must-haves; a nice-to-have is deleted until its absence hurts
- push back out loud on a bolted-on path, your own drafts included
- a fix for a defect cures the defect and deletes the patch; a patch kept beside the cure is the bolt-on
- a fence, or a gap in a sequence a peer wrote: read why it stands (Chesterton). no reason on record → ask the maker once; no answer → delete it and say so

## .the test

> **if this were deleted, who would feel it, and how?**

no one, or no named harm → delete it.

## .enforcement

blocker: a mechanism built for a requirement no one can state the why of · a fence removed with its reason on record unread
nitpick: a bolt-on or a nice-to-have passed unquestioned · a requirement kept because of who asked, with its purpose unread

cites: `define.skeptic.lessons-from-the-greats` (Saint-Exupéry; Chesterton's fence).

see also:
- `rule.always.ask-why-then-ask-can-we-delete.example=the-fridge-for-the-cream.md`: a second fridge asked for, the cream deleted instead
- `rule.always.ask-why-then-ask-can-we-delete.example=the-bolton-order-and-the-vision-wish.md`: the repo case, three orders and where each landed
- `rule.always.test-a-claim-against-the-whole-it-speaks-for.example=the-skipped-milestone-m4.md`: a gap in a sequence, read as a choice first

forbid twin: `rule.forbid.requirements-kept-with-no-why`

---

written by human + beaver 🦫