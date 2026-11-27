/**
 * .what = whether a slug is a valid kebab slug
 * .why = slugs land in dir names the route-part parsers must read back
 */
export const isEducationSlug = (input: { slug: string }): boolean =>
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug);
