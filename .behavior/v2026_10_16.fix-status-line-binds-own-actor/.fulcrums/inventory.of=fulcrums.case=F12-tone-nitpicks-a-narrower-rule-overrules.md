# F12 · hold the error header, the coordinate ids, and the readme row as written

## .the fork
the tone lane (`ergo-friction-hazards`, 5.1 i001) raised four nitpicks. for each:
- (a) change the text as asked
- (b) keep it, because a rule with a narrower scope governs that exact text

## .taken, and why at the time
(b), on all four:

| nitpick | the ask | why it holds |
|---|---|---|
| n1 | lowercase `MalfunctionError` | `rule.require.qualified-error-headers` (mechanic) requires the class name exact — `💥 MalfunctionError:` — and grades a paraphrase or a recased name a blocker. it is a code-construct name, which `rule.prefer.lowercase` itself exempts |
| n2 | swap `💥` for `⛈️` | the same rule binds `💥` to `MalfunctionError` and `✋` to `ConstraintError`, as the scanned half of the header. the chill-emoji rule is a `prefer` for comments and logs; the header rule is a `require` for this exact line |
| n3 | lowercase `F1` / `S1` | these are the `case=` ordinals `rule.forbid.itemization-without-coordinates` and the fulcrum and seed rules prescribe (`case=F14-slug`, `case=S$n-slug`). they are coordinates that name files on disk, not acronyms; a recase would part every row from its file |
| n4 | lowercase the readme row | the file on disk is `domain.terms/.readme.md`, lowercase, and the row cites it as is. naught to align |
| r8 (`behavior-intent-coverage`, i002) n2 | snap the permissions.route `already healed` no-op | it is snapped: case1 `[t1]`, `'init.claude.permissions.route - already healed'`. naught to add |

## .rework
clean — four text edits, should the wisher rule otherwise.

## .confidence — 95%
n1–n3 rest on rules that name the exact text; n4 is a measurement.

## .where
`init.claude.status-line.sh` and `init.claude.permissions.route.sh` (the ERR trap and fault lines);
this route's `.fulcrums/` and `.seeds/`; `domain.terms/catalog.of=term._.md`.

## .verdict
open
