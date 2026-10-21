# S3 — how is a block's cost split by cached vs not?

## .said

> but how do we scale the tokens by cached vs not?

## .settled

a call's prompt is one ordered prefix, and `usage` splits it into three spans in order: cache read
(the front), cache write (the next stretch), raw input (the tail). each block holds a known position
in that order, so per call its tokens fall in exactly one span — or are cut at a span boundary — and
take that span's rate. an expired cache shows as the block in the write span again, so a re-write
is priced as a write, never assumed a read.

## .landed

- `1.vision.yield.md` · .the three tiers of a figure (`priced`) · open question 15
