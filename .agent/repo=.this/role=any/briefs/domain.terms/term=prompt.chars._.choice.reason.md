# domain.term.choice.reason: chars

## .etymology

`chars` — the unit the composer can count exactly, with no tokenizer in hand. a prompt's
characters are known the moment it renders; its tokens are known only once a provider bills it.
so the attribution of a prompt to its inputs is stated in chars, and tokens stay the provider's
figure.

## .rejected

| rejected | why |
|---|---|
| `length` | generic, and silent on its unit — a reader must ask "length in what?" |
| `bytes` — as a word for a prompt's SIZE only | a different count. a multi-byte glyph is one char and several bytes, and the census sums chars so the sections add to the rendered string. byte IDENTITY is a distinct concept and keeps its word — a byte OFFSET (`getOneSharedPrefixByteCount`), and the exact bytes a cache matches (the two cache-order rules) — see the choice file |
| `size` | as a name for the UNIT only — it names the property, never the unit, and so cannot part chars from tokens. `size` the property (the lever, the share) is legal, per the choice file |

## .the peer it is never conflated with

`tokens` — the provider's count, the one `cost` is priced from. the meter reports both, and a
census in chars says so in its header, because a chars share and a tokens share of one prompt
differ.

## .evidence

- raised 2026-10-02 by a peer review of `.behavior/v2026_09_20.review-cost-meter` (i053, r014
  nitpick.5): `quantity` declares two positions, `cost` and `chars`, and only `cost` held a cluster
- 2026-10-07, a peer review of the same route (i016, r017 nitpick.1) read the two cache-order
  rules' `bytes` as the forbidden size synonym. the rules' subject is which bytes N requests share
  byte for byte, the unit a prompt cache matches in, and each states its weights in `chars`. so
  the forbid row was widened from "offset" to "identity", rather than the rules renamed to a unit
  that names the wrong concept
- three dops compose it: `asPromptSectionChars`, `getOneCharsByCacheSeam`,
  `getOnePromptSectionCharsFromCompiled`
