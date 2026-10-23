/**
 * .what = whether a path is a file of the route this review was driven from
 * .why = the route's spec is what a reviewer grades against, so it is never a lever to make
 *        a prompt fit (seed S31): the overflow refusal never suggests a cut of it, and a split
 *        shares it into every partition. both decisions must read the SAME rule, so it lives
 *        here once — two copies could drift into a refusal that suggests a cut the split undoes
 */
export const isPathOfRouteSpec = (input: {
  path: string;
  /** the route dir, relative to the cwd; null when the review ran outside a route */
  route: string | null;
}): boolean =>
  input.route !== null &&
  (input.path === input.route || input.path.startsWith(`${input.route}/`));
