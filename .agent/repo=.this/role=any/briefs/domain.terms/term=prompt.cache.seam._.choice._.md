# domain.term: seam

term.chosen   = seam
term.kind     = noun
term.boundary = prompt.cache   # the line a prompt DECLARES between what a cache could serve and what it re-pays
term.synonyms.forbidden:
- split   # for the cache line only; `review.scope.split` owns the word for a division of targets
- cut
- cutoff
- boundary   # the glossary's own word for a term's scope; overloaded here
- shared prefix   # `prompt.cache.shared-prefix` — the MEASURED run two requests shared; the seam is the DECLARED line

## .what

the **seam** is the declared line that parts a prompt's named inputs into two sides:

| side | what sits there | priced |
|---|---|---|
| `cacheable` | inputs that repeat byte for byte round over round — the rubric, the briefs | at the cache read rate, IF the cache serves them |
| `perRound` | inputs that change each round — the targets, the conversation | at the full input rate, every round |

the seam is declared at two grains. both are `Record`s, so a new input fails to typecheck until
it declares its side:

| constant | grain | read by |
|---|---|---|
| `IS_CACHEABLE` | each fine **input** (`PromptInputName`) | the composition, and the compiled lane |
| `IS_CACHEABLE_SECTION` | each coarse **section** (`keyof PromptSectionChars`) | the census rows and the cost report |

`SECTION_OF_INPUT` maps each input to its section. a test binds the two grains, so a section
never disagrees with an input it holds.

🟡 **the seam is a DECLARATION, never a measurement.** the `cacheable` side is an UPPER BOUND:
the most a cache could serve if every byte of it hit. what a cache actually served is the
`shared-prefix` two requests had, and the `cache.get` tokens the provider billed. the seam
says where the line SHOULD fall; the shared prefix measures where it DID.

## .refs

- `src/domain.operations/review/getOnePromptComposition.ts`     # `IS_CACHEABLE` — each input's side
- `src/domain.operations/review/asPromptSectionChars.ts`        # `IS_CACHEABLE_SECTION` — each section's side
- `src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled.ts`  # `SECTION_OF_INPUT` — input → section
- `src/domain.operations/review/getOneCharsByCacheSeam.ts`      # the chars on each side
- `.log/bhrain/review/$ts/metrics.compiled.json`                # `prompt.cacheable` — the upper bound as written
- `.agent/repo=.this/role=any/briefs/rule.require.distinguish-every-review-input.md`  # obligation 2: state its seam

## .reason

- `term=prompt.cache.seam._.choice.reason.md`
