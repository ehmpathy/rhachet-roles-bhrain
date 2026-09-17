import * as fs from 'fs';
import * as path from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = a drift guardrail on every copy of `mock-window.sh`
 *
 * ⚠️ .note = this docblock and the `given` below name NO cardinal, deliberately. they
 *         read "the two copies" until a third fixture (`route-peer-concurrency-solo`)
 *         joined `FIXTURES` and left every "two" stale — caught at i018. a count
 *         stated beside a list it does not derive FROM decays by default, so the
 *         iterated set is the only count, and it is the `FIXTURES` array below
 *
 * 🔴 .why = the duplication is DELIBERATE and was argued twice (i002, i003): each
 *           asset dir is copied whole into a `genTempDirForRhachet` sandbox, so a
 *           shared file outside either dir would break hermeticity. the copy stays.
 *
 *           ⇒ what the copy costs is a silent drift surface. an author who repairs
 *             one mock — a bsd-portability fix, a hold default, a control flag —
 *             has no signal that a second copy exists, and the two fixtures then
 *             measure concurrency by different rules while both suites stay green.
 *
 * ⚠️ .note = the hazard was rediscovered by FOUR independent reviewer lanes across
 *         i002 and i003, and each round re-argued the dedup and re-declined it.
 *         none proposed a check. this is that check (raised i004/r011)
 *
 * 🔴 .note = it compares the EXECUTABLE lines, never the bytes. r011 recommended a
 *         byte-identity assertion, and that property was already false when it was
 *         written: the `-default` copy carries seven extra comment lines naming
 *         itself the sole witness for the level default. that note is TRUE of one
 *         fixture and false of the other, so a byte clamp would have gone red on
 *         arrival and its only repair would have been to delete a true remark.
 *
 *         ⇒ the property worth a clamp is that every copy BEHAVES alike. a comment
 *           cannot change an observed window; a stripped `sleep` can
 *
 * .note = an integration test, never a unit one — it reads the disk, which
 *         `rule.forbid.unit.remote-boundaries` puts out of the unit tier. its peer
 *         `readReviewWindows.test.ts` states the same split from the other side
 */
const ASSETS = path.join(__dirname, 'assets');

const FIXTURES = [
  'route-peer-concurrency',
  'route-peer-concurrency-default',
  'route-peer-concurrency-solo',
] as const;

/**
 * .what = the lines bash actually runs — comments and blank lines dropped
 * .why = a per-fixture remark is legitimate; a per-fixture BEHAVIOR is the defect
 */
const asExecutableLines = (input: { raw: string }): string[] =>
  input.raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

describe('mock-window.sh fixture parity', () => {
  given('[case1] every concurrency asset dir that carries the mock', () => {
    when('[t0] each copy of the mock is read', () => {
      const mocks = FIXTURES.map((fixture) => ({
        fixture,
        lines: asExecutableLines({
          raw: fs.readFileSync(
            path.join(ASSETS, fixture, '.test', 'mock-window.sh'),
            'utf8',
          ),
        }),
      }));

      then('every copy runs the same lines as the first', () => {
        // .why = a diff here means one copy was repaired and the other was not,
        //        so the two suites now measure overlap by different rules. the
        //        repair is to carry the laggard forward, never to relax this
        const [first, ...rest] = mocks;
        for (const other of rest)
          expect({ fixture: other.fixture, lines: other.lines }).toEqual({
            fixture: other.fixture,
            lines: first!.lines,
          });
      });

      then('each copy has executable lines, so parity is no vacuous truth', () => {
        // .why = two absent files read as equal, and so do two all-comment ones.
        //        without this, a delete of both mocks would pass the assertion
        //        above while every clamp that depends on them fails elsewhere,
        //        for a reason nobody traces back to here
        for (const { lines } of mocks) expect(lines.length).toBeGreaterThan(10);
      });
    });
  });
});
