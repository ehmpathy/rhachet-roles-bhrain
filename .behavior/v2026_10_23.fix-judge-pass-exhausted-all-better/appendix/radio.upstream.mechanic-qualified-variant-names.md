## .what

two mechanic rules, raised in review of ehmpathy/rhachet-roles-bhrain#693 (comments 4371942303, 4371945313):

1. **rule.forbid.mixed-nest-and-flat-variants** — when one noun has several variants, never nest some and flatten others, and never let one variant take the bare namespace.
   - 👎 `{ slugs: exhaustedSlugs, slugsUrgent }` — `slugs` silently means "exhausted"; `slugsUrgent` sits flattened beside it
   - 👍 `{ slugs: { exhausted, urgent } }`
2. **rule.require.qualified-names-when-variants** — where a name has more than one variant in scope, every use is qualified. a bare `slugs` is ambiguous the moment a second set of slugs exists.
   - 👎 `asJudgeUrgentHaltLines({ slugs })` beside `getStoneConcessionExhaustion({ slugs })`, where one means urgent lanes and the other exhausted lanes
   - 👍 `asJudgeUrgentHaltLines({ slugs: { urgent } })` · `getStoneConcessionExhaustion({ slugs: { exhausted } })`

## .why

- a bare name that takes the namespace hides which variant it is, so a reader must trace the caller to know
- a half-nested, half-flattened shape is two conventions in one signature, and it drifts

## .the worked case

ehmpathy/rhachet-roles-bhrain#693 — `genRouteGuardExhaustedReason`, `getStoneConcessionExhaustion`, `computeConcessionExhaustionKind`, `computeUrgentConcessionLaneSlugs`, `asJudgeUrgentHaltLines`, and `asBudgetHaltRemedyGroup` reshaped to `slugs: { exhausted, urgent }`.

## .enforcement (proposed)

- a variant that takes the bare namespace beside a flattened peer = blocker
- an unqualified name where two or more variants are in scope = blocker
