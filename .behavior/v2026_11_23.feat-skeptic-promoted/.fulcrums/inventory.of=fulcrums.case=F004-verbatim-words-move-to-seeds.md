# F004 — verbatim words move to the seeds

- **fork**: ship the briefs with the human's verbatim words inline, as the source holds them; or keep quotes in the role's seed entries and restate each claim in the brief
- **read**:
  - the quotes sit in three places, not one: the `source:` line of most rule `.md` and `.md.min` files (e.g. `razor-the-foundation-…` `:5`, `skepticize-contradicting-guards` `:5`, `check-each-new-term-…` `:5`); the eight yield laws #818 names; and the bodies of examples (`the-four-pulls-and-the-layer` quotes the human at `:7`; the sweep names `the-blocker-cause-relayed-unread` with a five-row table of his words, `the-fifty-asks`, `the-pnpm-patch-skill-mods`)
  - each `source:` line names its inbox id or date, and the seed summary lands each utterance, so the seed is where the words already live
- **taken**: restate. `rule.forbid.verbatim-quotes-outside-seeds` (learner, booted in this repo) forbids a quote outside its seed, examples included. a rule's `source:` line drops; its claim stands in its own words. an example keeps its record (date, seat, what happened, the cost) and states the human's words as a claim, not a quote
- **rework**: clean — text edits inside the role's briefs; the seeds hold every utterance
- **confidence**: 85%. an example reads weaker without the words that drove it; the human may prefer examples keep their quotes, which a seed-only rule forbids
- **where**: every rule `.md` / `.md.min` with a `source:` line; the yield-law briefs; examples that quote the human
- **verdict**: open
