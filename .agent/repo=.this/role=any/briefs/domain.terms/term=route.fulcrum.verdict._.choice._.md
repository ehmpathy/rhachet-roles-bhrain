# domain.term: verdict

term.chosen   = verdict
term.kind     = noun
term.boundary = route.fulcrum
term.synonyms.forbidden:
- ruling
- decision
- resolution

## .what
a **verdict** is **a human's settlement of one disputed fulcrum: `upheld` (the driver's call stands)
or `conceded` (the reviewer's concern stands, and its repair is owed).**

it lives in two places that must agree:

```
$route/.fulcrums/inventory.of=fulcrums.case=F$n-$slug.md   # frontmatter `verdict: { by: human, at, ruled }`
$route/.route/fulcrum.verdicts.jsonl                            # one ledger row per verdict, the proof
```

a yaml verdict that the newest ledger row for its case does not match is **forged**: a hand edit, read
as unruled.

## .refs
- src/domain.operations/route/fulcrum/setFulcrumVerdict.ts            # the one lever that writes it
- src/domain.operations/route/fulcrum/getAllFulcrumVerdictRows.ts      # the ledger read
- src/domain.operations/route/fulcrum/isFulcrumVerdictProven.ts        # the proof check
- src/contract/cli/route.ts                                            # `rhx route.fulcrum.rule`

## .reason
- `term=route.fulcrum.verdict._.choice.reason.md`
