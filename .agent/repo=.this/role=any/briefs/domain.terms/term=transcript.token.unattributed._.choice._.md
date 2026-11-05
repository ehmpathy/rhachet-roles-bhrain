# domain.term: unattributed

term.chosen   = unattributed
term.kind     = adj                  # a token tier, and the category its tokens fall into
term.boundary = transcript.token
term.synonyms.forbidden:
- other
- misc
- unknown
- overhead

## .what
the tokens a call's context holds that no transcript record explains — the harness system prompt,
the tool schemas, and the body of a compacted context. it is the fourth attribution tier, after
`measured` (from usage), `exact` (one category arrived), and `apportioned` (split by bytes).

## .refs
- src/domain.objects/Reflector/TokenHeld.ts
- src/domain.operations/reflect/tokens/getOneTokenInventory.ts

## .reason
- `term=transcript.token.unattributed._.choice.reason.md` — etymology, disputes, evidence
