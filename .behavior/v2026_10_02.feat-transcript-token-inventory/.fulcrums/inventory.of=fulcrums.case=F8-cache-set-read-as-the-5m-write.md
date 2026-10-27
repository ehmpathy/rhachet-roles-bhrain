# F8 — `cache.set` is read as the 5m write; a write with no ttl split is read as 5m

## .the fork

a brain spec carries one cache-write rate, `cache.set`. usage carries two write counts,
`ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens`, and older transcripts carry only the
total `cache_creation_input_tokens`. choices for the rate and the split:

- **A — `cache.set` = the 5m rate; the 1h rate stays null (`unpriced`); a total with no split
  counts as 5m**
- **B — derive the 1h rate as 2× input** (the provider's published multiplier) and price it
- **C — treat `cache.set` as ttl-agnostic** and price both ttls at it

## .taken — A, and why at the time

- the specs' `cache.set` values equal 1.25× input in every anthropic config — the 5m multiplier
- B is a rate table in this repo by another name; the vision forbids a second source of truth
- C underprices every 1h write by 37.5%, silently
- the 5m default for an unsplit total matches the api default ttl before the 1h option shipped

## .rework — clean

`asTokenRatesByModel` sets `cacheWrite1h: null`; once the specs carry a 1h field (the reseed
dream), read it there. the unsplit-total default is `5m = total − 1h`, with `1h ?? 0`, read in two
places (`getTokenRepaid`, `asTokenSpendOfTranscript`).

## .confidence — 70%, and why it is low

the live sessions here write at 1h only (5.2M 1h tokens, 0 at 5m on this session), so under A a
priced model still renders `+ N tok unpriced` for every write — honest, but the total price is a
lower bound until upstream adds the field. the vision's illustration assumed 5m writes; the
measured default is 1h.

## .where

- `src/domain.operations/reflect/tokens/asTokenRatesByModel.ts`
- `src/domain.operations/reflect/tokens/getTokenRepaid.ts` · `asTokenSpendOfTranscript.ts` — the
  unsplit-total default
- `dreams/v2026_10_21.reseed.anthropic-brain-specs-for-5x-models.md` — shape step 3

## .verdict

open.
