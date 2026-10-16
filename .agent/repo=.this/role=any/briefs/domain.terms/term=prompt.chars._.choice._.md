# domain.term: chars

term.chosen   = chars
term.kind     = noun
term.boundary = prompt   # the size of a prompt, or of one named input within it
term.synonyms.forbidden:
- length
- bytes   # as a word for a prompt's SIZE. byte IDENTITY (an offset, a shared run) is a distinct concept, see below
- size    # as a name for the UNIT. `size` the PROPERTY — the lever, the share — is legal, see below

🟡 **`size` is forbidden as the unit, never as the property.** `chars` is how a size is counted;
`size` is what is counted. so a figure, a field, or a column that reports a count is `chars`, and
a lever or a sort ON that count may say `size` — `input size DOWN`, `size share`,
`…-volatility-then-size`. ⇒ the test: could the word be swapped for a number with a unit? yes →
`chars` · no, it names the dimension under argument → `size` is legal.

🟡 **`bytes` is forbidden as a synonym of `chars`, never as a word.** a prompt cache keys on an
exact BYTE prefix, so where a byte and a char part ways — a multibyte glyph — the cache answers
in bytes and only bytes. `getOneSharedPrefixByteCount` measures that quantity and is named for it
honestly. ⇒ the test: does the figure measure how much prompt there is (`chars`), or where two
prompts' bytes part (a byte offset)?

🟡 **byte IDENTITY keeps `bytes` too, offset or not.** a rule about which exact bytes N requests
share, or which block must lead so a cache can match it byte for byte, names the cache's own unit
of match — `rule.require.order-prompt-bytes-by-reuse-breadth` and
`rule.forbid.shared-bytes-behind-narrow-bytes` are named for that, never for a size. the moment
such a rule states HOW MUCH a block weighs, the figure is `chars` (`200.8k of a 336.0k prompt`).
⇒ the same test, widened: "how much" → `chars` · "which, byte for byte" → `bytes`.

## .what

the count of characters in a rendered prompt, or in one named input of it. it is the meter's
measure of **input size** before any brain sees the prompt — the one figure every run has, priced
or not. its peer on the `quantity` axis is `cost`.

## .refs

- `src/domain.operations/review/asPromptSectionChars.ts`        # `asPromptSectionChars` — chars per section, read from a rendered prompt
- `src/domain.operations/review/getOneCharsByCacheSeam.ts`      # `getOneCharsByCacheSeam` — chars on each side of the cache seam
- `src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled.ts`

## .reason

- `term=prompt.chars._.choice.reason.md`
