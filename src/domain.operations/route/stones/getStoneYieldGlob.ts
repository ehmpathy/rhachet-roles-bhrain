/**
 * .what = the one glob that names a stone's yield artifacts
 * .why = four call sites hand-typed `${stone}.yield*` independently, and they agreed only
 *        by coincidence of authorship
 *
 * 🔴 .note = this round's headline defect is exactly that shape. the rewind's cleanup globbed
 *            `…triggered.*.md` while the real markers are named `.since` / `.uptil`, so the glob
 *            matched ZERO of them and 13 live markers sat unarchived on one route. the glob was a
 *            hand-typed literal, independent of the operation that built the paths it aimed at.
 *
 *            ⇒ so the repair for the yield family is the same one the round already took for the
 *            self-review triggers (`asSelfReviewTriggeredGlob`) and the promise filenames
 *            (`getStonePromisePaths`): ONE owner, and every reader routed through it.
 *
 * ⚠️ .note = the LEGACY glob is deliberately owned here too. it is a second pattern for the same
 *            question — *which files are this stone's outputs?* — and two of the four call sites
 *            carry both. to own one and leave the other hand-typed would re-create the split at
 *            half scale.
 */

/**
 * .what = the glob for a stone's yield artifacts, relative to the route dir
 * .why = matches `.yield`, `.yield.md`, `.yield.json` — every variation
 */
export const getStoneYieldGlob = (input: { stone: string }): string =>
  `${input.stone}.yield*`;

/**
 * .what = the glob for a stone's LEGACY output artifacts, relative to the route dir
 * .why = matches the pre-`.yield` names: `.v1.i1.md`, `.i1.md`
 */
export const getStoneYieldGlobLegacy = (input: { stone: string }): string =>
  `${input.stone}*.md`;
