import * as path from 'path';

/**
 * .what = casts a path to its comparable form, so two spellings of one location compare equal
 * .why = the driver types `--into` by hand; the guard computes its own. a leading `./`, an
 *        interior `//`, a `..` segment, or a trailing slash is a difference in spelling,
 *        never in destination.
 *
 * .note = `path.posix` resolves every dot segment and collapses every slash run, so the three
 *         interior variances are handled by one call rather than by a regex per shape. it
 *         PRESERVES a trailing slash, so the strip below is still owed.
 * .why = it carried two hand-written regexes until 2026-09-20 and caught only the leading
 *        `./` and the trailing `/`. two independent lanes found the same gap in one round:
 *        `review//self/a.md` and `review/self/../self/a.md` each named the owed file and each
 *        rendered a `challenge:mismatch` whose diff showed two paths a reader cannot tell
 *        apart. a mismatch on a correct file is the one verdict this cast exists to prevent.
 *
 * 🔴 .note = the leading `./` is stripped BEFORE the posix call, never folded into it, and the
 *            order is load-bearing rather than belt-and-braces. `route` is not always
 *            route-relative — `getSelfReviewArticulationPath` joins whatever `--route` holds,
 *            and every test route is an absolute tmpdir path. so a driver who prefixes `./`
 *            onto an absolute path hands in `.//abs/path`, which posix reads as the RELATIVE
 *            `abs/path` — the leading slash is dropped, and the owed file renders `mismatch`.
 *            measured 2026-09-20: `[case3][t1]` went red the moment the strip was folded into
 *            the posix call. ⇒ a `./` prefix is a no-op the driver may type; it is removed on
 *            its own terms so it cannot interact with the remainder.
 *
 * 🔴 .note = it does NOT expand against the cwd, and that is deliberate rather than a gap. to
 *            expand would need the repo root, which makes a pure cast cwd-dependent
 *            (`rule.forbid.cwd-outside-gitroot`), and would compare a real location against a
 *            computed one. ⇒ the two operands are compared as written, so an `--into` of a
 *            different KIND than the guard's own path renders `mismatch`, and the diff names
 *            the path the guard owes — which is the form every prompt hands out.
 */
export const asComparablePath = (value: string): string =>
  path.posix.normalize(value.replace(/^\.\//, '')).replace(/\/+$/, '');
