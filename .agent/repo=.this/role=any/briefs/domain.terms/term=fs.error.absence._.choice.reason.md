# domain.term.choice.reason: absence

## .etymology

`absence` names a state of the path, not an act of the reader, and it is the word the codebase
already settled for its contracts (`isErrorOfAbsence`, `CODES_OF_ABSENCE`).

rejected:

| rejected | why |
|---|---|
| `missing` | the everyday word, rejected twice: it reads as an -ing form, and it blurs into "could not be had", which is the denial sense |
| `notfound` | names one errno, `ENOENT`, and drops its peer `ENOTDIR` — a path whose parent is a file is absent for the identical reason |
| `unreadable` | 🔴 the sharpest of the three. it is true of a DENIAL, so to use it here collapses the very pair this cluster exists to part |

## .why the pair is itemized together

absence and denial are the two fs failures that both arrive as an empty read. a reader that
collapses them renders a permission wall as a measured nil: `refused` renders `$0`, so an
`EACCES` read as an absence becomes a confident zero over a file nobody could read. the
distinction is a correctness property of the meter, so both words are domain vocabulary and
neither is the generic english the itemization rule exempts.

## .the boundary

"absence, of WHAT?" answers "of a path, as an fs error reports it" — `fs.error`. the head `fs`
is not itself declared; it is recorded in the gap census rather than guessed.

## .evidence

- `isErrorOfAbsence.integration.test.ts` — the errno allowlist, clamped against real fs throws
- the realm note in `isErrorOfAbsence.ts`: the code is read off the error's SHAPE, since a native
  fs rejection crosses the jest vm realm where `instanceof Error` answers false

## .disputes

none.
