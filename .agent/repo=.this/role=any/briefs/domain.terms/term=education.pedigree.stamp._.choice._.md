# domain.term: education.pedigree.stamp

term.chosen   = stamp
term.kind     = verb (and its noun: a stamp, the state it leaves)
term.boundary = education.pedigree   # "stamp, of what?" → of a graduated pursuit into the pedigree
term.synonyms.forbidden:
- record
- log
- commit
- write

## .what

to **stamp** a pursuit is to set its entry into the role's pedigree, rebuild the index, and name
both in the role's boot spec; `education.pedigree set` performs it. a pursuit is **stamped** when
all three facts hold: the entry written, the index row present, the boot spec names both. the
`pedigree-stamped` judge of `4.graduate` reads those three facts.

## .refs

- src/domain.operations/education/getOnePedigreeStamp.ts
- src/domain.operations/education/setPedigreeEntry.ts
- src/domain.operations/education/pursuit/templates/4.graduate.guard

## .reason

- `term=education.pedigree.stamp._.choice.reason.md`
