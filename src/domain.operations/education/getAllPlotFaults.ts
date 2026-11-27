import { asBuildsOnSlugs } from './asBuildsOnSlugs';
import { isEducationSlug } from './isEducationSlug';

/**
 * .what = the faults of a pursuit's plot, one line each; empty when the plot is sound
 * .why = the plot is the ledger's source of truth: a slug the disk can never hold (`Idempotency`,
 *        `` `idempotency` ``), a twin row, or a `builds on` that names no earlier course would
 *        leave a course owed forever, so each is named while the plot can still be edited
 */
export const getAllPlotFaults = (input: {
  rows: Array<Record<string, string>>;
}): string[] => {
  const slugs = input.rows.map((row) => (row.course ?? '').trim());
  if (slugs.length === 0)
    return ['the plot names no course; add a row per course to its table'];
  return input.rows.flatMap((row, index) => {
    const slug = slugs[index]!;
    const slugsEarlier = slugs.slice(0, index);
    const faultsOfSlug = [
      ...(isEducationSlug({ slug })
        ? []
        : [`row ${index + 1}: course \`${slug}\` is no lowercase kebab slug`]),
      ...(slugsEarlier.includes(slug)
        ? [`row ${index + 1}: course \`${slug}\` is plotted twice`]
        : []),
    ];
    const faultsOfBuildsOn = asBuildsOnSlugs({
      cell: row['builds on'] ?? '',
    }).flatMap((base) =>
      slugsEarlier.includes(base)
        ? []
        : [
            `row ${index + 1}: course \`${slug}\` builds on \`${base}\`, which no earlier row plots`,
          ],
    );
    return [...faultsOfSlug, ...faultsOfBuildsOn];
  });
};
