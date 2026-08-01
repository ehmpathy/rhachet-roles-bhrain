# domain.term: vibe

term.chosen   = vibe
term.kind     = noun
term.synonyms.forbidden:
- theme
- persona
- brand
- style

## .what
the **vibe** of a review is the role's own render identity — the mascot + artifact a role marks
its `review.by` output with, so the review reads in that role's voice. it is a declared domain
object (`ReviewVibe`) with two fields:

- **mascot** — the emoji that opens the owl-phrase header line (bhrain owl `🦉`, ehmpathy seaturtle
  `🐢`)
- **artifact** — the emoji that prefixes the command echo (`🔍` for the owl, `🐚` for the seaturtle)

the vibe is optional in a role's `rubrics.yml`; absent, it defaults to the bhrain owl (`🦉` / `🔍`),
since bhrain owns the base `review.by` engine. each field defaults independently — a role may
declare only `mascot` and keep the owl `🔍` artifact.

## .refs
where the term composes declared objects & operations:
- src/domain.operations/review.by/asReviewRubricsConfig.ts       # the ReviewVibe interface + DEFAULT_VIBE + asVibe parse
- src/domain.operations/review.by/ReviewByResult.ts              # ReviewByResult.vibe
- src/domain.operations/review.by/genReviewByStdout.ts           # render: mascot opens the phrase, artifact prefixes the cmd echo
- src/domain.roles/reviewer/briefs/howto.add-review-by-to-a-role.[guide].md  # the published rubrics.yml `vibe:` block

## .reason
see the ref-level cluster beside this choice:
- `term=vibe._.choice.reason.md` — etymology, and why `vibe` over `theme`/`persona`/`brand`
