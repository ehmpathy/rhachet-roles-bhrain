# S18 · a concede MAY carry an optional --why — collect justifications

- **kind** = an expansion (the concede-forbids-`--why` throw is removed)
- **said** = 2026-09-15, over the `setStoneAsStanced` concede-forbids-`--why` throw

## .said — verbatim

> why not also collect why's from concessions optionally?   if (input.as === 'conceded' && input.why)
>     throw new BadRequestError(
>       [
>         `--why is not accepted for --as conceded`,
>         ``,
>         `a concede claims no judgment, so it cites no fulcrum — it commits you to a FIX.`,
>       ].join('\n'),
>       { stone: input.stone },
>     );
>  ; would be cool to see justifications

## .settled

a concede MAY carry a `--why` — an optional justification a later reader can weigh. the
concede-forbids-`--why` throw is REMOVED.

- `--why` stays REQUIRED for a dispute (the council reads it), OPTIONAL for a concede.
- whichever stance carries a `--why`, the path is validated to point at an EXTANT file
  (`assertFulcrumPathExists`), and stored verbatim on the row (`PassageReport.fulcrum`).
- a concede with no `--why` cites no fulcrum, as before.

## .why this is coherent with "a concede claims no judgment"

a concede still owes no fulcrum — it commits to a FIX, not to a council argument. the `--why` is
NOT a claim on the council; it is a note the driver may leave to record WHY they conceded, for a
later reader who wants the justification. the dispute's `--why` (required, council-bound) and the
concede's `--why` (optional, informational) share one flag and one storage field; they differ only
in whether the road stops for a council to read it.

## .landed

- `setStoneAsStanced.ts` — the `conceded && why` forbid-throw is removed; `assertFulcrumPathExists`
  still runs for any `--why` (dispute or concede).
- `route.ts` — CLI help: `--why` is `optional for --as conceded — an extant path that records why
  you conceded`.
- tests — `setStoneAsStanced.integration` [t1b] concedes with an optional `--why` and asserts the
  justification is stored on the conceded row.
