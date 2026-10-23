# F121 — a transient brain fault asks again twice, at 10s then 30s

- raised 2026-10-07, by the driver, from the 5.1 i011 round: 8 of 26 lanes malfunctioned on a provider 502/504
- rework: **clean** — one constant and one predicate
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — no retry (as it stood)** | a fault is reported at once; the driver re-arrives, and a cached clean lane is reused |
| **B — retry a transient fault inside the lane's deadline (taken)** | a gateway 5xx says naught about the prompt; a second ask costs seconds where a re-arrive costs a whole round |
| **C — retry in the brain package** | the cure would reach every caller, but the package belongs to another repo |

## .taken, and why

**B.** `withTransientBrainRetry` wraps the `ask` in `stepReview`; `isErrorOfTransientBrainFault` reads
`status` 5xx or 429, or a dropped-socket `code`, by shape. delays `[10s, 30s]`. the lane's own
`withDeadline` bounds all three asks together, so a retry never outlives the bound. any other fault
rethrows at once, unchanged.

## .rework, and why

**clean.** the delays are one constant; the fault set is one predicate with a caselist test.

## .confidence, and why it is not higher

- the delays are a guess; no measurement of how fast this provider's 504s clear
- a 429 retried at 10s may still sit inside a rate window
- a retry re-sends the prompt, so a fault that DID bill (a 504 after the provider ran the call)
  bills twice. measured rate unknown
- C may be the better home; a reseed to `rhachet-brains-openrouter` would then retire B

## .where

`src/domain.operations/review/withTransientBrainRetry.ts` ·
`src/domain.operations/review/isErrorOfTransientBrainFault.ts` · `stepReview.ts`
(`DELAYS_OF_TRANSIENT_BRAIN_RETRY`)

## .verdict

— (awaits the council)
