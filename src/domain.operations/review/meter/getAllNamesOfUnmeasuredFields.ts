/**
 * .what = the names of the fields whose value is no measured figure — absent, or present
 *         as aught but a finite number
 * .why = the unmeasured names ARE the diagnosis of a torn artifact — which half was lost.
 *        and "unmeasured" is wider than "absent": json cannot hold `NaN`, so a write-side
 *        `NaN` lands on disk as `null`, and a `null` that passed here would fold into a sum
 *        as `0` — the absence-reads-as-zero inversion the meter exists to refuse
 */
export const getAllNamesOfUnmeasuredFields = (input: {
  fields: Record<string, unknown>;
}): string[] =>
  Object.entries(input.fields)
    .filter(([, value]) => !isMeasuredFigure(value))
    .map(([name]) => name);

/**
 * .what = whether a value is a measured figure — a finite number
 */
const isMeasuredFigure = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
