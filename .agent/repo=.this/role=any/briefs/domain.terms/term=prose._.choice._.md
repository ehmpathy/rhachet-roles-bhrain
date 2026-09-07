# domain.term: prose

term.chosen   = prose
term.kind     = noun
term.boundary = —          # a ROOT. it heads its own boundary; no word qualifies it
term.synonyms.forbidden:
- copy
- text
- writing
- wording
- language

## .what
`prose` is **any text an actor emits that a reader must parse for its concepts** — regardless of the
artifact it sits in.

🟡 the scope is deliberately total. a chat reply, a yield, a brief, a commit body, an error string,
and a code comment are all prose. the wisher settled this outright (2026-09-04): *"it applies to
code comments too … literally any prose."*

what it excludes is narrow and mechanical:

| not prose | why |
|---|---|
| code — a declaration, an expression, a signature | its reader is a compiler first |
| a coordinate — a filename, a path, a key | governed by the itemization rules |
| structured data — json, yaml, a lockfile | its shape is its contract |

## .why it earns a cluster rather than reads as generic english

the generic sense is *"written language in ordinary form"*, which is a **form** claim — prose as
opposed to verse.

⇒ **this repo's sense is a SCOPE claim instead: every surface a rule of the telepath canon may
grade.** so a table, an outline, and a bulleted list are all prose here and would not be under the
generic reading, since none is "ordinary form".

🟡 that inversion is exactly why the word needs declaring: **a reader who takes the generic sense
concludes an outline is exempt from the prose rules**, when an outline is what most of them demand.

## .the boundary it heads

**the declared members are enumerated below and never counted** — a count goes silently false as
the set grows, and this list is settled by a `Glob` against disk rather than by a re-read of itself
(`rule.forbid.itemization-without-coordinates`: the census check is a `Glob`, never a read):

- `term=prose.elucidation` — the root purpose of the telepath: transfer a concept until the
  peer can use it, in both directions
- `term=prose.distillation` — the practice: decompose + condense into fundamentals, then speak in
  those terms
- `term=prose.condensation` — the rank-and-cut pass at the 95% bar
- `term=prose.bulletize` — the verb: render a passage as a nested outline
- `term=prose.narration` — the defect: prose in sequence where a tree was owed
- `term=prose.diffusion` — the defect: a purpose spread across rival points, so the needle cannot be found
- `term=prose.emphasis` — the scarce signal that ranks one line against its neighbours
- `term=prose.obfuscation` — the defect: concealment by selection, where every part is true
- `term=prose.subversive` — the defect: prose that elongates or encircles its own purpose. a
  boundary in its own right — it heads `subversive.shallow` (cut it) and `subversive.squishy`
  (replace it with the mechanism), and it never appears alone in a grade
- `term=prose.summary` — the artifact: a passage that restates the whole of a turn, read in one pass

### the arrears, named here so it is visible
- `itemization.summary` — the seam `term=prose.summary` declares from one side. the librarian
  canon uses the same word for a cluster root (`$subject._.md`, a file with peer entry files it
  indexes). one concept, two subjects, and only the `prose` half is declared
- `compression` / `lossless` / `lossy` — **the sharpest of these.** `term=prose.condensation`
  declares the boundary from its side (compression is lossless by construction; condensation is
  lossy by design) — so the concept is settled and only the cluster is absent
- `enumerate` — DISPUTED 2026-09-04, OPEN. its dispute's own counter #2 says its home would
  be `term=prose.enumerate` (`term=itemization.itemize._.choice.reason.md:60`). that line is the
  first place this boundary was named, and it named a boundary that did not exist
- `passage` — used in every telepath brief, undeclared
- `purpose` — `rule.require.purpose-first` turns on the distinction between a purpose (a reader's
  decision) and a subject. that distinction is declared in the rule and in no cluster
- `ramble` · `accretion` — declared senses in the ehmpathy canon, no cluster in this glossary

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.forbid.subversive-prose.md
- src/domain.roles/telepath/briefs/rule.require.bulletize.md
- src/domain.roles/telepath/briefs/rule.forbid.narration.md
- src/domain.roles/telepath/readme.md
- src/domain.roles/telepath/skills/elucidate.summary.sh

## .reason
see the ref-level cluster beside this choice:
- `term=prose._.choice.reason.md` — etymology, why not `copy` or `text`, and why a boundary of at
  least seven words sat headless until 2026-09-04
