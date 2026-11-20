import type { FulcrumFrontmatterParse } from './asFulcrumFrontmatter';

/**
 * .what = the route's fulcrums, with every entry whose case id another file also declares marked
 *         unreadable
 * .why = a case id is the one key a human types into `rhx route.fulcrum.rule`; two files under one
 *        id would leave the second unruleable while the lever reports the first as done. so each
 *        is listed, never skipped, and named at the gate until the driver renames one
 */
export const asAllFulcrumsCaseUnique = <
  TFulcrum extends { slug: string; parse: FulcrumFrontmatterParse },
>(input: {
  fulcrums: TFulcrum[];
}): TFulcrum[] => {
  const counts = input.fulcrums.reduce(
    (tally, fulcrum) =>
      new Map(tally).set(fulcrum.slug, (tally.get(fulcrum.slug) ?? 0) + 1),
    new Map<string, number>(),
  );
  return input.fulcrums.map((fulcrum) => {
    const count = counts.get(fulcrum.slug) ?? 0;
    if (count < 2) return fulcrum;
    const clash = `case (unique on the route; ${fulcrum.slug} names ${count} files)`;
    const parse: FulcrumFrontmatterParse =
      fulcrum.parse.kind === 'invalid'
        ? { ...fulcrum.parse, malformed: [...fulcrum.parse.malformed, clash] }
        : { kind: 'invalid', absent: [], malformed: [clash] };
    return { ...fulcrum, parse };
  });
};
