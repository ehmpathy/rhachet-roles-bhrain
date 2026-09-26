import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * .what = builds a real temp route dir with a `.route/passage.jsonl` seeded from the given lines
 * .why = both the passage reads and the reminder daemon read the real passage.jsonl off disk, so
 *        their integration tests need a real route dir with a real passage log — not a mock. this
 *        is the ONE shared builder for that fixture, lifted to `route/.test/` (the common ancestor
 *        of the passage/ and reminder/ sub-clusters) so both import it, never re-copy it
 *        (rule.prefer.wet-over-dry rule-of-three; rule.prefer.most-common-denominator).
 *
 * .note = the last line of `lines` is the drive's current status (append-only, tail-wins), the
 *         same read `getLatestPassageForRoute` performs.
 *
 * .why a `.stone` file is written per named stone = a passage entry names a stone, so a route that
 *        holds that entry HOLDS that stone — a real one always does. a passage-only route (an entry
 *        for `5.1.execution` with no `5.1.execution.stone` on disk) is an IMPOSSIBLE shape, and a
 *        fixture in that shape silently models a route the product cannot produce. that matters
 *        because the stone frontier is what decides completion: stepRouteDrive answers
 *        `nextStones.length === 0 → route complete! 🌴🤙`, so a route with no enumerable stones is a
 *        COMPLETE drive by its own rule. a fixture that meant "an ACTIVE drive on 5.1.execution"
 *        but wrote no stone file in truth supplied a COMPLETE one, and any consumer that read
 *        completion honestly looked broken against it. so the stone files are seeded here, once, and
 *        every fixture models a route that could exist (rule.require.hermetic-tests).
 *
 * .note = `stones: 'none'` opts out, for the cases that mean to test the zero-stone shape itself
 *         (a finished route whose stones were pruned/renamed) — the boundary clamped in
 *         stepRouteReminderTick.integration case8.
 *
 * .note = `stonesOpen` seeds stone files with NO passage entry — the stones still to drive. this is
 *         how a fixture models a MID-ROUTE pause: a `passed` tail reads LIVE by status, and an open
 *         stone keeps the frontier non-empty so the drive is genuinely unfinished. a `passed` tail
 *         with no open stone is a COMPLETED route, not a paused one — the two are distinct states
 *         that share a status, so a fixture must say which it means.
 */
export const genRouteWithPassage = async (input: {
  // a passage line is written verbatim, so its shape stays OPEN (status, blocker, and whatever
  // else a case seeds); only `stone` is read here, to name the stone file to seed alongside it
  lines: ({ stone?: string } & Record<string, unknown>)[];
  stones?: 'per-passage' | 'none';
  stonesOpen?: string[];
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-'));
  const passagePath = path.join(route, '.route', 'passage.jsonl');
  await fs.mkdir(path.dirname(passagePath), { recursive: true });
  await fs.writeFile(
    passagePath,
    input.lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
  );

  // seed one `.stone` file per stone the passage names, so the frontier enumerates what the
  // passage claims (deduped — an append-only passage names one stone many times)
  const namesPassage =
    (input.stones ?? 'per-passage') === 'per-passage'
      ? [...new Set(input.lines.map((line) => line.stone).filter((n) => !!n))]
      : [];

  // plus the still-to-drive stones, which carry no passage entry
  for (const name of [...namesPassage, ...(input.stonesOpen ?? [])])
    await fs.writeFile(path.join(route, `${name}.stone`), `${name}\n`);

  return { route };
};
