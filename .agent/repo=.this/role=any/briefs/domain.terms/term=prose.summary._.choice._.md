# domain.term: prose.summary

term.chosen   = summary
term.kind     = noun
term.boundary = prose
term.synonyms.forbidden:
- recap
- wrapup
- takeaway
- tldr
- digest

## .what
a `summary` is **a passage that restates the whole of what preceded it, short enough to be read in
one pass**, so a reader who reads only the summary holds the whole.

⇒ in the telepath boundary its subject is a turn: the last passage a brain emits before it
rests, which stands in place of all the turn produced.

## 🟡 .the seam — `itemization` holds the same word for a FILE

the librarian canon uses `summary` for the cluster root — `$subject._.md`, the file that stands
in place of the whole, as a peer of its own parts (`rule.require.summary-at-the-cluster-root`,
`rule.forbid.itemization-without-coordinates`). that sense is also undeclared, and it is not
this cluster's to settle.

| the boundary | its subject | the artifact |
|---|---|---|
| 🔮 `prose` — this cluster | a turn | a passage, emitted once, with no peers to index |
| 📚 `itemization` — owed, not declared | a cluster | a file, with peer entry files it indexes |

⇒ both are *"the whole, restated short, in place of its parts"* — so this is **one concept over two
subjects**, never an overload. per `rule.require.boundary-qualified-terms`, *"$word, of WHAT?"*
returns two answers, so each subject takes its own boundary-qualified cluster.

**do NOT read this cluster as a claim on the bare word.** a contract that means the file sense
must write `itemization.summary`, and that cluster is in arrears — recorded in
`term=prose._.choice._.md`.

## .what it is NOT

| not a summary | why |
|---|---|
| a transcript — all that happened, in order | that is the archaeology; it refs out |
| a conclusion — the last claim reached | one part, which stands only for itself |
| a status — where the work now sits | a fact about state, not a restatement of the whole |

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/skills/elucidate.summary.sh — the skill name
- src/contract/cli/telepath.ts — `elucidateSummary`, the exported operation
- package.json — `./cli/telepath`, the published export subpath
- src/domain.roles/telepath/getTelepathRole.ts — the `onStop` hook command

## .reason
see the ref-level cluster beside this choice:
- `term=prose.summary._.choice.reason.md` — why `summary` over its rejected synonyms, and why a
  word in a published skill name went undeclared until the day it shipped
