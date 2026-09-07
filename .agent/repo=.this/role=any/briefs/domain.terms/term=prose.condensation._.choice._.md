# domain.term: prose.condensation

term.chosen   = condensation
term.kind     = noun          # the verb form is `condense`
term.boundary = prose
term.synonyms.forbidden:
- summarization
- distillation
- abridgement
- prune
- reduction

🟡 **`compression` is not a forbidden synonym — it names a different act.** see the `.reason`; that
distinction is the most load-bearing part of this cluster.

## .what
**condensation** is a **rank-and-cut** pass over prose that already exists: per line, *if it is not
95%+ important to mention, do not mention it.*

- it is reflexive — a second pass over the draft, run every time
- it cuts whole lines, never words inside a line
- ⇒ so it is lossy by design: it drops true information judged below the bar

## .condensation vs compression — the distinction this cluster exists to hold

| | what it removes | lossy? |
|---|---|---|
| **compression** | words that carried no distinction | ❌ lossless by construction — a word that carried one was never surplus |
| **condensation** | lines that rank below the bar | lossy by design — the drop is the point |

**so a cut that destroys a distinction is a failed COMPRESSION, never a successful condensation.**
the bar grades importance; it never licenses the drop of a word that carried a distinction.

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.require.reflexive-condensation.md
- src/domain.roles/telepath/briefs/define.reflexive-condensation.md
- src/domain.roles/telepath/briefs/rule.require.distillation.md (its **condense** move)
- src/domain.roles/telepath/readme.md

## .reason
see the ref-level cluster beside this choice:
- `term=prose.condensation._.choice.reason.md` — the etymology, the compression boundary in full, and
  why the two senses inside `condense` are one concept rather than two
