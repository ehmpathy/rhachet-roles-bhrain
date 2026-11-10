import { DIR_OF_ROUTE_STATUS_LINE_CACHE } from './cache/asRouteStatusLineCachePath';
import { ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS } from './cache/ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS';

/**
 * .what = the help text for route.status.line
 * .why = one source for the `--help` of the subpath entry, which the legacy `cli/route`
 *        export forwards to (rule.require.single-source-of-truth-for-render)
 *
 * .note = the cache dir and the max age come from their owners; the help loads lazily, so
 *         the imports cost a hit naught
 */
export const asStatusLineHelp = (): string =>
  `
route.status.line - emit the current stone as a claude code status line

usage:
  route.status.line [options]

options:
  --help             show this help message

output:
  bound, stone + phase      🗿 <stone>, <phase> <emoji>
  bound, all stones passed  🗿 route complete 🌴🤙
  unbound / no stones       (empty line)

  the phase suffix names where inside the stone the driver is, tipped with an
  attention-color emoji at the end of the line (read the color, then the words):
    yield 🌾                 the stone yields its artifact — calm, no attention
    review.self, r7/r10 🔍   self-reviews, r{done}/r{total} — machine's turn
    review.peer, l3@i002 🔍  peer review, l{level}@i{rounds} — machine's turn
    judge, approved? 👋      a human must approve — attention needed
    ..., exhausted 👋        peer budget spent, a human must approve or extend
    ..., blocked ✋          blocked, act now — attention needed
    ..., malfunction 💥      a reviewer or judge broke, a human must fix

errors:
  a genuine fault is logged to stderr and exits non-zero; the harness then renders
  a blank line (the fault is surfaced on stderr, never silently hidden)

cache:
  a repaint whose render inputs did not change prints the line already computed,
  from ${DIR_OF_ROUTE_STATUS_LINE_CACHE}/ (per branch).
  the legacy cli/route export forwards here, so it is cached too, yet still loads
  the whole barrel first; re-run the driver init to move a seat to the bash reader.
  a fault that prints no line is never cached; a degraded line is cached with its
  stderr row, and each repaint prints that row again. an unreadable or unwritable
  cache is reported on stderr, and the line still prints. a cached line is at most
  ${ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS / 1000}s old; a passage, a meter row, a promise, or a route.bind.set shows on
  the next repaint. a bind flag that arrives any other way (a pull, a hand edit)
  shows within ${ROUTE_STATUS_LINE_CACHE_MAX_AGE_MS / 1000}s. to force a fresh line, drop the node records:
    rm -f ${DIR_OF_ROUTE_STATUS_LINE_CACHE}/branch=*.json
  keep the branch=*.route files in that dir: they are the bash reader's pointers.
  without them, a route under .behavior/ is found by a glob, and a route bound
  elsewhere reads a blank line until its next drive or bind

note:
  the claude code harness runs the status line with cwd = project root and
  renders stdout as the line. the driver init binds the bash reader,
  which spawns no node per repaint and reads the status file the route writers
  keep beside the route:
    BASH_ENV= bash .agent/repo=bhrain/role=driver/skills/route.status.line.sh || printf '%s\\n' '🗿 status line reader not found, rhx init --roles driver'
  this node entry serves a seat whose settings predate the bash reader; re-run
  the driver init to move that seat to the bash reader

examples:
  node -e "import('rhachet-roles-bhrain/cli/route.status.line').then(m => m.routeStatusLine())"
`.trim();
