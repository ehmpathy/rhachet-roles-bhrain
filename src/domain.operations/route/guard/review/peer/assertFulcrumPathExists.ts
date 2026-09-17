import { existsSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
import { isAbsolute, join } from 'path';

/**
 * .what = asserts the `--why` path names a fulcrum entry that EXISTS on disk
 * .why = a dispute is a guarantee to the council, so it must cite an argument a human will
 *        read. this resolves that citation and refuses when it points at naught.
 *
 * 🔴 it RESOLVES, and never MINTS (F018). the driver authors the entry, for a reason the
 *    wisher named: the entry's form makes the driver state the reviewer's case in its
 *    strongest form before they state their own — *"an opportunity to nudge them to
 *    reconsider"* (S04). a command that wrote the file for them would remove the one step
 *    that changes minds.
 *
 * ⚠️ so the check is `existsSync` plus a throw — never a template, an ordinal, a slug choice,
 *    or a reconcile against extant entries. that asymmetry is the largest cost this design
 *    shed, and it is why `.fulcrums/` needs no write path at all.
 *
 * .note = the path is stored VERBATIM as the driver passed it (PassageReport.fulcrum), so a
 *         relative path stays relative. it is resolved for the check ALONE — a copy of an
 *         argument cannot drift from itself, where a re-derivation can.
 *
 * 🟡 a relative `--why` is checked TWO ways, so the driver need not recall which base applies
 *    (r8 b1, then relaxed): route-relative first (`--why .fulcrums/…case=F00N-<slug>.md`, the
 *    canonical form the vision documents), then repo-root-relative
 *    (`--why $route/.fulcrums/…case=F00N-<slug>.md`, the form a driver reaches for after a
 *    `git.repo.get` or a copy-pasted path). the first that resolves wins.
 */
export const assertFulcrumPathExists = (input: {
  why: string;
  route: string;
  repoRoot: string;
}): void => {
  const routeAbs = isAbsolute(input.route)
    ? input.route
    : join(input.repoRoot, input.route);

  if (isAbsolute(input.why)) {
    if (existsSync(input.why)) return;
    throw new BadRequestError(
      [
        `no fulcrum entry at "${input.why}"`,
        ``,
        `a dispute cites an argument the council will read, so the entry must exist first.`,
        `write it there, then re-run this command:`,
        `  ${input.route}/.fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
      ].join('\n'),
      { why: input.why, route: input.route },
    );
  }

  const asRouteRelative = join(routeAbs, input.why);
  if (existsSync(asRouteRelative)) return;

  const asRepoRootRelative = join(input.repoRoot, input.why);
  if (existsSync(asRepoRootRelative)) return;

  throw new BadRequestError(
    [
      `no fulcrum entry at "${input.why}"`,
      ``,
      `a relative --why is checked two ways, and neither resolved:`,
      `   route-relative     = ${asRouteRelative}`,
      `   repo-root-relative = ${asRepoRootRelative}`,
      ``,
      `a dispute cites an argument the council will read, so the entry must exist first.`,
      `write it there, then re-run this command:`,
      `  ${input.route}/.fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
      ``,
      `and pass either the ROUTE-relative path (canonical), or the repo-root-relative one:`,
      `  --why .fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
      `  --why ${input.route}/.fulcrums/inventory.of=fulcrums.case=F00N-<slug>.md`,
    ].join('\n'),
    {
      why: input.why,
      route: input.route,
      asRouteRelative,
      asRepoRootRelative,
    },
  );
};
