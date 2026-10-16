# domain.term: absence

term.chosen   = absence
term.kind     = noun
term.boundary = fs.error     # an fs error that means the path is not there
term.synonyms.forbidden:
- missing      # a gerund-shaped adjective, and it blurs into "could not be read"
- notfound     # names one errno (ENOENT) and drops its peer ENOTDIR
- unreadable   # 🔴 the DENIAL sense. to use it here collapses the pair this cluster exists to part

## .what

an **absence** is an fs error that means the path is not there: `ENOENT`, or `ENOTDIR` where a
parent is a file.

an absence is a FACT the meter reports on purpose — a tree that never reviewed, a run that died
before it wrote its metrics. it reads as an empty corpus, never as a fault.

its counterpart is `term=fs.error.denial`. the two are the fs failures that both arrive as an
empty read, and they need opposite answers:

| the error | means | the meter answers |
|---|---|---|
| absence | the path is not there | an empty corpus — a measured fact |
| denial | the path is there, and this process may not read it | a refusal that names the fix |

## .refs

- `src/utils/fs/isErrorOfAbsence.ts`   # `CODES_OF_ABSENCE` — the one allowlist every fs reader shares

## .reason

- `term=fs.error.absence._.choice.reason.md`
