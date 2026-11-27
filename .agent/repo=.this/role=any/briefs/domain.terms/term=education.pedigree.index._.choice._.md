# domain.term: education.pedigree.index

term.chosen   = index
term.kind     = noun
term.boundary = education.pedigree   # "index, of what?" → of a role's pedigree entries
term.synonyms.forbidden:
- root
- summary
- toc

## .what

an **education.pedigree.index** is the pedigree's root brief, `$briefsDir/education/pedigree._.md`:
one row per graduated pursuit, booted at `say`. each row points at its entry
(`pedigree.pursuit=v$date.$slug.md`, booted at `ref`). the index is rendered whole from every
entry on each stamp, so a re-stamp never appends a twin row.

## .refs

- src/domain.operations/education/asPedigreeIndexMarkdown.ts · asPedigreeIndexPath.ts
- src/domain.operations/education/setPedigreeEntry.ts

## .reason

- `term=education.pedigree.index._.choice.reason.md`
