# domain.term.choice.reason: composition

## .etymology

latin *componere* — to put together. a composition is a whole stated as its parts, which is the
exact claim: the prompt, put together from named inputs, with no char left over.

## .rejected peers

- `anatomy` — a figure of speech that names no parts; it cannot be summed
- `makeup` — informal, and its common sense is cosmetic
- `layout` — names the ORDER the bytes sit in. order is what decides the shared prefix, and it
  is a separate concern: two prompts of one composition can have two layouts

## .boundary

`prompt`, a peer of `prompt.cache`. the composition is a fact about any prompt, whatever the
brain; the cache reads it, the attribution reads it, and neither owns it.

## .evidence

- declared op `getOnePromptComposition`, and the per-run `metrics.compiled.json` it writes
- `rule.require.distinguish-every-review-input` names it the contract it governs
- the `repo-rules-briefs` lane named it un-itemized, 2026-09-27

## .disputes

### dispute: anatomy — raised 2026-10-03 — status: RESOLVED (qualify the forbid)
- raised.by  = the `repo-rules-briefs` lane, i054
- claim      = the forbid list bans `anatomy`, yet the clamp `reviewPromptCacheAnatomy.test.ts`
               and `research.review-cost-and-cache` both say "the cache anatomy"
- counter    = those two name the byte ORDER of a prompt and where its shared prefix parts —
               the `layout` concern this term already parts itself from — never the input
               split. the forbid binds a name for the composition, and neither use is one
- resolution = the forbid row now states the sense it binds. the clamp's filename predates
               the term and is left in place until disturbed; a rename to it would be a
               `shared-prefix` word, never a `composition` one
