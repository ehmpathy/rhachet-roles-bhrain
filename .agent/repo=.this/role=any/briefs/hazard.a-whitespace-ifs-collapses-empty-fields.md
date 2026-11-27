# hazard.a-whitespace-ifs-collapses-empty-fields

> **split rows with a field separator that is not IFS whitespace. a tab, a space, or a newline as
> `IFS` merges adjacent separators, so an empty field vanishes and every field after it shifts.**

## .the mechanism

- bash treats space, tab, and newline in `IFS` as **whitespace**: a run of them counts as one
  separator, and any at the start of a line are trimmed
- so `IFS=$'\t' read -r kind a b` over `T<tab><tab>x` reads `a=x`, `b=` — the empty field is gone
- any other character in `IFS` is a hard separator: each one parts exactly one field
- ⇒ a row that may carry an empty field splits on `\x1f` (the unit separator), never on a tab

```sh
👎  while IFS=$'\t' read -r kind a b; do …           # an empty `a` shifts `b` into its slot
👍  while IFS=$'\x1f' read -r kind a b; do …         # each field keeps its place
```

## .the cue

| when… | then… |
|---|---|
| a jq `@tsv` or a tab-joined row feeds `read` | can any field be empty? then emit `\u001f`-joined rows |
| a render prints a blank where a field belongs (`✗·`) | suspect the split before the producer |
| `IFS=' '` parts two fields, the first of which may be empty | the same hazard, with a space |

## .the occurrence

first seen in `rhachet-roles-bhrain/.behavior/v2026_11_23.feat-skeptic-promoted`
(`5.1.execution.from_vision.yield.md`, `.the first run`): `skeptic.claims` split rows on a tab, so
an unbacked claim row lost its empty fields and printed blank. the cure is the
`IFS=$'\x1f'` split in `skeptic.claims.sh`, the one its three peer checks already used.
