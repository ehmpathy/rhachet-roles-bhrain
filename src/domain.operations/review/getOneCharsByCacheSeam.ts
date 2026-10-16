import {
  IS_CACHEABLE_SECTION,
  type PromptSectionChars,
} from '@src/domain.objects/Reviewer/PromptSectionChars';

/**
 * .what = parts a prompt's chars across the cache seam — the mass a cache could ever
 *         serve, and the mass that is re-paid at full input rate every round
 *
 * .why = the fold was an inline `filter(...).reduce(...)` over `ORDER_OF_SECTIONS` in
 *        `genReviewGroveStdout`, so a reader had to simulate which of the six sections
 *        survived the filter to learn what the figure meant
 *        (rule.forbid.inline-decode-friction).
 *
 *        ⇒ and the render read the result THREE times — once as `cacheable`, twice as
 *        `chars - cacheable`. so the shape it actually wanted was never one sum; it was
 *        a PARTITION, and the complement was open-coded beside it.
 *
 * .note = 🔴 the two halves are computed from ONE record, so they cannot drift. it
 *         iterates `IS_CACHEABLE_SECTION` rather than `ORDER_OF_SECTIONS` for a reason
 *         the type system enforces: that record is keyed `Record<keyof
 *         PromptSectionChars, boolean>`, so a seventh section added to the union is a
 *         TYPE ERROR until it declares its seam — and then it lands in whichever half
 *         it declared, here, with no edit.
 *
 *         ⇒ a `filter` over the rank order has no such property. it would have summed
 *         five of seven sections and reported a confident figure.
 *
 * .note = 🟡 `cacheable` is a CEILING, never a realization. it is the mass a cache
 *         could serve if every byte of it hit — and this branch measured a prompt whose
 *         layout was flawless and whose realized rate was 0.0%, because the request
 *         reached a replica that held no cache. so the caller must label it as the
 *         bound it is; the realized figure comes from `cache.get` alone.
 */
export const getOneCharsByCacheSeam = (input: {
  sections: PromptSectionChars;
}): { cacheable: number; perRound: number } => ({
  cacheable: getOneCharsOnSeamSide({
    sections: input.sections,
    cacheable: true,
  }),
  perRound: getOneCharsOnSeamSide({
    sections: input.sections,
    cacheable: false,
  }),
});

/**
 * .what = the chars of every section that sits on one side of the cache seam
 * .why = one named sum, read twice, so the two halves share one derivation
 *
 * .note = the `as` cast is the documented exception `rule.forbid.as-cast`
 *         permits, the same one `ORDER_OF_SECTIONS` carries: `Object.keys` is
 *         typed `(o: object) => string[]` on purpose, so TS cannot soundly
 *         narrow it. the true type is `Array<keyof PromptSectionChars>`, which
 *         `IS_CACHEABLE_SECTION`'s keys provably are — a literal
 *         `Record<keyof PromptSectionChars, boolean>` with no dynamic writes
 */
const getOneCharsOnSeamSide = (input: {
  sections: PromptSectionChars;
  cacheable: boolean;
}): number =>
  (Object.keys(IS_CACHEABLE_SECTION) as Array<keyof PromptSectionChars>)
    .filter((name) => IS_CACHEABLE_SECTION[name] === input.cacheable)
    .reduce((sum, name) => sum + input.sections[name], 0);
