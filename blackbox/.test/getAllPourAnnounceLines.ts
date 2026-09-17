import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = one roster branch of a pour announce — `   ├─ r1:l1-a`
 * .why = the connector class is `[├└]`, never `└` alone. every member but the
 *        LAST takes the `├─` tee; only the last takes the `└─` elbow
 */
const ROSTER_BRANCH = /^\s+[├└]─ r\d+:/;

/**
 * .what = the declared member count of a pour announce — `🦉 l1 pours 4 lanes`
 */
const ANNOUNCE_COUNT = /pours (\d+) lane/;

/**
 * .what = asserts every pour announce is followed by as many roster branches as
 *         it declares
 *
 * 🔴 .why = A SNAPSHOT CANNOT CATCH A TRUNCATED INPUT. this check exists because
 *           that happened: the roster filter read `└─` alone, so when i019
 *           changed the announce to one member per branch, three of four members
 *           fell out of the filter — and `--resnap` wrote the one-line remainder
 *           as the new oracle, GREEN. the snapshot RECORDED the defect rather
 *           than caught it, and four call sites recorded it at once
 *
 * ⇒ the announce states its own count, so the roster has an oracle the filter
 *   does not supply. that is what makes this check independent rather than
 *   circular — a filter cannot grade itself against its own output
 *
 * .why it THROWS = the defect is in the harness, never in the subject under
 *        test. a silent short read is `rule.forbid.failhide` at the one moment
 *        it costs the most: resnap time, where a green result is written to disk
 *
 * 🔴 .why the message INTERPOLATES its terms rather than carries a metadata bag =
 *     `HelpfulError` appends `JSON.stringify(metadata)` onto `.message`, so a
 *     `{ announce, declared, rostered, hint }` second argument renders a raw JSON
 *     dump on the failure line a human reads. this round's own clean-render sweep
 *     (i010/r006, i012/r001, i014/r001) stripped that shape from every peer throw
 *     site, and `asGuardPositiveInt` is the pattern it settled on — one prose
 *     sentence that names the fault, the values, and the edit.
 *
 *     ⚠️ this file was the one throw site the sweep missed, because it is HARNESS
 *       rather than product and no rubric scopes to `blackbox/.test/`. raised by
 *       two lanes at i023 (r004 nitpick.1, r010 nitpick.1) — ⇒ the lesson: a
 *       render convention holds only where a reviewer's glob reaches
 */
export const assertPourRostersComplete = (lines: string[]): void => {
  const announces = lines
    .map((line, position) => ({ line, position }))
    .filter((entry) => ANNOUNCE_COUNT.test(entry.line));

  announces.forEach((announce, order) => {
    const declared = Number(ANNOUNCE_COUNT.exec(announce.line)![1]);
    const until = announces[order + 1]?.position ?? lines.length;
    const rostered = lines
      .slice(announce.position + 1, until)
      .filter((line) => ROSTER_BRANCH.test(line)).length;

    if (rostered !== declared)
      throw new UnexpectedCodePathError(
        `pour announce roster does not match its count — the filter, not the subject, is wrong: "${announce.line}" declared ${declared} and rostered ${rostered}. ${
          rostered < declared
            ? 'the roster connector class is [├└]; a filter that reads one glyph alone keeps only the last member'
            : 'a roster that reaches past its own announce sweeps in the next level branches'
        }.`,
      );
  });
};

/**
 * .what = the pour announce lines of a run's stderr — each `pours` header plus
 *         its roster branches, in emit order
 * .why = the announce is deterministic (level, count, bound, and roster are all
 *        fixed by the fixture), so a snapshot is the right oracle for its SHAPE.
 *        this hands the snapshot its input, and clamps that the input is whole
 */
export const getAllPourAnnounceLines = (stderr: string): string[] => {
  const lines = stderr
    .split('\n')
    .filter((line) => line.includes('pours') || ROSTER_BRANCH.test(line));

  assertPourRostersComplete(lines);

  return lines;
};
