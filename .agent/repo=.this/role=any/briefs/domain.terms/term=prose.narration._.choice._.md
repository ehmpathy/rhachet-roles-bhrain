# domain.term: narration

term.chosen   = narration
term.kind     = noun
term.boundary = prose
term.synonyms.forbidden:
- narratives   # 🟡 the name issue #416 carries — see .reason, conform owed on the issue
- prose-dump
- wall-of-text
- story-mode
# note: the -ing forms (`storytelling`, `rambling`) need no entry here —
# `rule.forbid.gerunds` already bans them outright

## .what
`narration` is **prose that carries an argument in sequence where a tree was owed.**

three shapes, and they share one mechanism:
- a paragraph of claims chained by connectives — *"X, so Y, though Z, which means W"*
- a walkthrough of how the author got there
- a story told in place of a structure

⇒ the mechanism: prose serializes a tree and deletes its edges. the reader rebuilds them from
*"however"*, *"which means"*, *"in that case"* — and each rebuild is a place to guess wrong.

## 🟡 .what it is NOT — a narrative a human asked for

a narrative is a legitimate artifact; `narration` is a narrative offered where an outline was
owed. **the word names the defect, never the form.**

| narration — the defect | a narrative — legitimate |
|---|---|
| offered with no ask | a human asked for a story, a walkthrough, a worked sequence |
| an argument in a rule or a yield | a sequence in a `.demo=` artifact, whose declared subject IS the sequence |

## .the pair
`narration` is the negative of `bulletize`, as `ramble` is the negative of `brevity`:

| the target | the defect |
|---|---|
| `rule.require.bulletize` | `rule.forbid.narration` |
| `rule.require.brevity` (mechanic) | `rule.forbid.rambles` (mechanic) |

🟡 it is a peer of `chronological-accretion`, never its replacement — **that one grades prose ordered
by TIME; this grades prose where a TREE was owed.**

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.forbid.narration.md
- src/domain.roles/telepath/briefs/rule.require.bulletize.md
- src/domain.roles/telepath/briefs/define.bulletize.md

## .reason
see the ref-level cluster beside this choice:
- `term=prose.narration._.choice.reason.md` — etymology, why the act and not the artifact, and the
  **open conform owed on issue #416's title**
