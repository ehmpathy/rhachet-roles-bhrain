/**
 * .what = what one poke measured, as the provider reported it
 * .why = named apart from the row, so a reader past the parse boundary can hold a
 *        measurement with no nullable in its type
 */
export interface WarmerPokeMeasured {
  promptTokens: number;
  cacheGetTokens: number;
  /** named, never folded into a rate — measured ~1 in 5 from replica dispatch */
  hit: boolean;
  /**
   * what the provider billed, as `IsoPriceHuman` — e.g. `$0.000428`.
   *
   * .note = a DISPLAY form in a PERSISTED row, which `rule.require.iso-price`
   *         forbids outright: *"IsoPriceHuman is display-only (locale-bound,
   *         lossy) — keep at the ui edge, never stored/passed"*. the canonical
   *         stored shape is `IsoPriceWords` (`'USD 0.000428'`).
   *
   *         ⇒ stated here rather than quietly inherited, because this is the
   *         whole review-cost subsystem's wire format, never a slip in this
   *         file: `stepReview` writes eleven of these into `metrics.realized.json`,
   *         `compileReviewPrompt` writes the cost estimate, and
   *         `getOneReviewRunMeterAt` declares the type by name. the warmer
   *         matches its neighbours exactly, which is why no read scoped to the
   *         warmer could see it.
   *
   * .note = what it costs, and what it does NOT. precision SURVIVES the round
   *         trip (`asIsoPriceHuman` → `asIsoPrice` → `priceSum`), clamped by
   *         `getOneWarmerCost.integration.test` on real sub-cent figures like
   *         `$0.001383360`. lost is the CURRENCY: `$` is shared by USD, CAD,
   *         AUD, SGD and more, so `asIsoPrice` must assume one. every provider
   *         here bills USD, so the assumption holds, and the harm is latent.
   *
   *         ⇒ a migration to `IsoPriceWords` is SAFE (`asIsoPrice` reads both,
   *         so rows already on disk still parse):
   *         `.dream/v2026_09_25.fix.the-review-cost-wire-format-is-a-display-string.md`
   */
  cost: string;
}

/**
 * .what = the fields every row carries, whatever its act
 */
interface WarmerPokeRowEnvelope {
  at: string;
  reviewer: string;
  attempt: number;
  why: string;
}

/**
 * .what = a row whose attempt reached a provider and billed — it ALWAYS carries a measurement
 */
export interface WarmerPokeRowSpent extends WarmerPokeRowEnvelope {
  act: 'poke';
  measured: WarmerPokeMeasured;
}

/**
 * .what = a row that measured naught — a defer, a retire, or a fault
 * .why = a defer and a retire made no call; a fault made one and could not read it
 *        back, so it may still have billed. none of the three holds a measurement
 */
export interface WarmerPokeRowQuiet extends WarmerPokeRowEnvelope {
  act: 'defer' | 'retire' | 'fault';
  measured: null;
}

/**
 * .what = one row, as it lands in the warmer's log
 * .why = `1.vision.experience.case=7` obliges this row and no less. an engine
 *        act with no record is money nobody knows was spent, and the party who
 *        would notice never invoked a surface.
 *
 * .note = a union on `act`, so a `poke` with no measurement cannot be built in this
 *         repo's code. a row read back from disk can still be torn — a prior tool
 *         version or a hand edit wrote it — so the parse boundary keeps its own guard
 *         (`getOneWarmerCost`'s `asPokeMeasurement`)
 */
export type WarmerPokeRow = WarmerPokeRowSpent | WarmerPokeRowQuiet;
