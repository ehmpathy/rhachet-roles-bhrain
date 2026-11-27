# domain.term: education.pedigree

term.chosen   = pedigree
term.kind     = noun
term.boundary = education   # "pedigree, of what?" → of a role's education
term.synonyms.forbidden:
- resume
- transcript
- logbook
- cv
- record

## .what

an **education.pedigree** is the record of what a role was taught: one entry per graduated
pursuit, each with its courses in order, the greats read, the claims held and refuted, and the
briefs and skills it left. it lives in the role at `$briefsDir/education/`, as an index
(`pedigree._.md`, booted at `say`) and one entry per pursuit
(`pedigree.pursuit=v$date.$slug.md`, at `ref`).

`education.pedigree set` stamps an entry; `get` reads every entry back.

## .refs

- src/domain.objects/Learner/PedigreeEntry.ts · PedigreeCourse.ts
- src/domain.operations/education/setPedigreeEntry.ts · getAllPedigreeEntries.ts
- src/contract/cli/education.pedigree.ts

## .reason

- `term=education.pedigree._.choice.reason.md`
