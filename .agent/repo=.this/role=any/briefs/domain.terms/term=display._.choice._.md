# domain.term: display

term.chosen   = display
term.kind     = adj
term.boundary = —          # a ROOT: one sense, several subjects (see .reason)
term.synonyms.forbidden:
- pretty
- friendly
- human
- printable
- short

## .what

the form of a value **rendered for a human reader**, as opposed to the form the
machine holds.

it qualifies a value that has two representations — one canonical and one legible —
and names the second. today its only subject is a filesystem path: the machine holds
an absolute one, and a reader wants it relative to somewhere they recognize.

⚠️ **it does not mean "shorter".** shortness is a frequent consequence, never the
sense. `getReviewDisplayPath` returns the **longer** absolute form where the relative
one would be a `..` crawl, because the longer one reads better — and it is still the
display form.

## .refs

- src/domain.operations/route/drive/asRouteDisplayPath.ts
- src/domain.operations/review/getReviewDisplayPath.ts
- src/domain.operations/route/guard/asGuardDisplayPath.ts

## .reason

- `term=display._.choice.reason.md`
