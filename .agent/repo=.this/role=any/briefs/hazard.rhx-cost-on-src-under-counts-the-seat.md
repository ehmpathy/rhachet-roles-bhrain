# hazard.rhx-cost-on-src-under-counts-the-seat

> **`rhx cost --what src/domain.roles/<role>/boot.yml` reads a role short of what a seat pays.
> the budget is enforced on the seat form; the src form reads ~6 tokens light per booted file.**

## .the mechanism

- a booted path rides in the payload, once per file
- a seat boots from `.agent/repo=bhrain/role=<slug>/…`; the src form from `src/domain.roles/<slug>/…`
- the seat path is longer, so each booted file costs more in the seat than `rhx cost` on src shows
- `roleBootClamps` `[t4]` boots the seat form (`getOneBootEmittedAsSeat`), and that is the figure
  the budget caps (`roleBootClamps.integration.test.ts:479-482`)

## .measured — the gap scales with the file count

| date | role | files booted | `rhx cost` src | seat `[t4]` | gap |
|---|---|---|---|---|---|
| 2026-11-24 | skeptic | 21 say · 2 ref | 8,850 | 8,965 | +115 |
| 2026-11-26 | skeptic | 10 say · 2 ref | 4,932 | 4,992 | +60 |

## .the cue

| when… | then… |
|---|---|
| you trim a boot to fit a budget | read the seat figure (`[t4]` snapshot), never the src cost alone |
| `rhx cost` on src shows headroom under ~6 × the booted files | the seat may be over. run the clamp |
| you quote a boot size in a yield or a blocker | name which form it is |

first seen in `rhachet-roles-bhrain/.behavior/v2026_11_23.feat-skeptic-promoted` (fulcrum F32 and
the 5k budget cut).
