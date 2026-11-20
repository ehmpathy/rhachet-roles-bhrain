import { realpathSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { dirname, isAbsolute, join } from 'path';

/**
 * .what = refuses a dispute whose fulcrum does not sit in this route's own `.fulcrums/`
 * .why = the dispute path validates the file `--why` names, but every gate reads the entry by
 *        case id from this route's `.fulcrums/`. a `--why` into another route would bind the
 *        dispute to this route's unrelated entry of the same id — case ids like F3 collide across
 *        routes — and a human verdict on that entry would cover a concern no human read
 *
 * .note = both sides go through `realpathSync`, so a route behind a symlink compares as the
 *         directory it is
 */
export const assertFulcrumPathOnRoute = (input: {
  pathResolved: string;
  route: string;
  repoRoot: string;
}): void => {
  const routeAbs = isAbsolute(input.route)
    ? input.route
    : join(input.repoRoot, input.route);
  const dirExpected = join(realpathSync(routeAbs), '.fulcrums');
  const dirFound = realpathSync(dirname(input.pathResolved));
  if (dirFound === dirExpected) return;
  throw new BadRequestError(
    [
      `--why must name a fulcrum in this route's own .fulcrums/`,
      `   ├─ named: ${input.pathResolved}`,
      `   ├─ route: ${input.route}`,
      `   └─ fix: write the argument on this route, then cite it route-relative`,
      `      └─ --why .fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
    ].join('\n'),
    { why: input.pathResolved, route: input.route },
  );
};
