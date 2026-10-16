# domain.term: composition

term.chosen   = composition
term.kind     = noun
term.boundary = prompt        # the named inputs a prompt is built from, and their sizes
term.synonyms.forbidden:
- anatomy      # a metaphor; it names no inputs. binds a NAME for the input split only —
               # the `reviewPromptCacheAnatomy` clamp measures byte ORDER, a `layout`
               # concern, and is left in place until disturbed (see `.reason` disputes)
- makeup       # informal, and reads as a cosmetic
- layout       # the ORDER of bytes, a separate concern (`prompt.cache.shared-prefix`)

## .what

a prompt's **composition** is the set of named inputs it was built from, with each input's
chars, its count, and which side of the cache seam it sat on. every char of the prompt lands in
exactly one input, so the parts sum to the whole.

## .refs

- `src/domain.operations/review/getOnePromptComposition.ts`
- `metrics.compiled.json` — the per-run record of it
- `rule.require.distinguish-every-review-input` — the contract a composition must honor

## .reason

- `term=prompt.composition._.choice.reason.md`
