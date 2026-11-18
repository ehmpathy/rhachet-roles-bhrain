# domain.term: owed

term.chosen   = owed
term.kind     = adj
term.boundary = route.fulcrum
term.synonyms.forbidden:
- assignee
- route-to
- escalation

## .what
**owed** names **who must settle a fulcrum's dispute: `human`, `reflect`, or `none`.** it is derived,
never chosen:

| ground | confidence | owed |
|---|---|---|
| `wrong` | ≥ 0.90 | `reflect` — an upstream reflection, named by `reflect: owner/repo#n` |
| `wrong` | < 0.90 | `human` |
| `dirty` | any | `human` |
| (no dispute) | — | `none` — a design call |

`owed: human` holds the next human gate until a verdict lands.

## .refs
- src/domain.operations/route/fulcrum/asFulcrumOwed.ts             # the derivation
- src/domain.operations/route/fulcrum/assertFulcrumFitsDispute.ts  # refuses a file whose owed disagrees

## .reason
- `term=route.fulcrum.owed._.choice.reason.md`
