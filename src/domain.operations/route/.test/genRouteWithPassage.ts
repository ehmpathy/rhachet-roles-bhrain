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
 */
export const genRouteWithPassage = async (input: {
  lines: object[];
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-'));
  const passagePath = path.join(route, '.route', 'passage.jsonl');
  await fs.mkdir(path.dirname(passagePath), { recursive: true });
  await fs.writeFile(
    passagePath,
    input.lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
  );
  return { route };
};
