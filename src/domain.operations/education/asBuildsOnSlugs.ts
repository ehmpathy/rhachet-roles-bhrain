/**
 * .what = the course slugs a plot's `builds on` cell names; empty for `—`, `-`, or `none`
 * .why = a driver writes the cell by hand, so it may part slugs by `,` or `·`, and may mark
 *        "none" any of three ways
 */
export const asBuildsOnSlugs = (input: { cell: string }): string[] =>
  input.cell
    .split(/[,·]/)
    .map((slug) => slug.trim())
    .filter((slug) => !['', '—', '-', 'none'].includes(slug));
