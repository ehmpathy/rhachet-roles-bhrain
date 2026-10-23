# domain.term: denial

term.chosen   = denial
term.kind     = noun
term.boundary = fs.error     # an fs error that means the path is there and barred
term.synonyms.forbidden:
- barred       # an adjective of the path; the contract names the error
- forbidden    # overloaded here by the rule directive `forbid`
- unreadable   # 🟡 true of a denial, and also loosely said of an absence — so it parts naught

## .what

a **denial** is an fs error that means the path is there and this process may not read it:
`EACCES`, or `EPERM` where an ownership rule bars it rather than a mode bit.

a denial is a WALL a human must act on. the cli refuses on it and names the fix; it never reads
it as an empty corpus. its counterpart, and the table that parts the two, is
`term=fs.error.absence`.

## .refs

- `src/utils/fs/isErrorOfDenial.ts`   # `CODES_OF_DENIAL`
- `src/contract/cli/review._.cost.ts`           # the refusal a denial earns

## .reason

- `term=fs.error.denial._.choice.reason.md`
