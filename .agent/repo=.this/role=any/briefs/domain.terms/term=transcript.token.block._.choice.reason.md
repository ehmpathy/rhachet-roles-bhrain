# domain.term.choice.reason: block (transcript.token)

## .etymology
the anthropic messages api names the units of a message's `content` array **content blocks** — a
`text` block, a `tool_use` block, a `tool_result` block. the transcript records them verbatim. the
domain adopts the api's own word rather than coin one.

chosen over `chunk` / `segment` (imply a cut of one larger text at arbitrary bounds; a block has
its own origin and category) and `part` (too generic to search).

## .the line against the api's block
an api content block is a wire unit. a token block is the slice of it the MODEL sees, measured in
bytes: a `tool_result` block's text, not its jsonl envelope. one api block yields one token block;
a record with no model-visible text yields none.

## .evidence
- the allocation splits each call's context delta across the blocks that arrived in it, by byte
  share — so a block must carry its bytes, never the record's size (`asTokenAllocation`)
- invariant: a block belongs to exactly one category; the categories partition the context
