# seed S34 — a diff is marked by its kind, in one glyph

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`). typos
repaired; word choice and order kept. it sharpens S32, which named the three kinds of diff.

## .the utterance

on a review prompt that marked an added file `change="added"`:

> lets make change="added" -> change="+" ,(+,-,~); save some tokens. also, maybe change => kind ? as in diff kind?

## .settled

- the attribute that marks a diff names its **kind**, never its "change": `kind=`
- the value is one glyph per kind, the same three kinds S32 split:
  - `+` an addition
  - `-` a deletion
  - `~` a mutation (an edit)
- every diff in the prompt carries it, edits included — one form, three values, read the same way
- the motive is tokens: a glyph repeats on every target of every round, so a word there is paid
  for without bound

## .open

- none

## .landed in

- `src/domain.operations/review/asTargetSection.ts`
- `src/domain.operations/review/asPromptHeadStatic.ts`
