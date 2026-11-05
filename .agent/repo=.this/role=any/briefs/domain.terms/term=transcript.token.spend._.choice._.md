# domain.term: spend

term.chosen   = spend
term.kind     = noun                 # also the verb in `reflect.on.token.spend`
term.boundary = transcript.token
term.synonyms.forbidden:
- usage
- consumption
- burn
- cost

## .what
the tokens a transcript's calls paid for, and what they cost: the measured efficiency, the
inventory by category, and what each held block was repaid.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts
- src/domain.operations/reflect/tokens/getOneTokenSpendReport.ts
- src/contract/cli/reflect.on.token.spend.ts

## .reason
- `term=transcript.token.spend._.choice.reason.md`
