import type { IsoTimeStamp } from 'iso-time';

/**
 * .what = formats the freshness confrontation — the file at the owed path predates the ask
 * .why = a leftover articulation from a prior round is not a review of the artifact that
 *        now exists. the file is present, so `absent` would be a lie; the driver needs to
 *        know WHICH of the two dates is the problem, so the emit names both.
 *
 * .note = the datum is the TRIGGER's mtime, never the artifact's: the question is "was this
 *         written for the review we asked for?", and only the ask dates that.
 * .note = it names NO haste and demands NO wait — the same D5 bound the mismatch emit carries.
 */
export const formatStaleArticulation = (input: {
  articulationPath: string;
  articulationMtime: IsoTimeStamp | undefined;
  askedAt: IsoTimeStamp | undefined;
}): string[] => {
  // .note = deliberate mutation — a line accumulator, scoped to this call and shared with
  //         no caller. the tree shape is conditional, so an immutable build is a chain of
  //         spreads that reads worse than the tree it renders (rule.require.immutable-vars).
  //         it is also the shape every extant tree formatter here takes
  const lines: string[] = [];

  lines.push(`🍂 that review predates the ask`);
  lines.push(`   │`);
  lines.push(
    `   ├─ a file is at the owed path, and it is older than the question`,
  );
  lines.push(`   │  ├─ path     = ${input.articulationPath}`);
  lines.push(`   │  ├─ written  = ${input.articulationMtime ?? '(unread)'}`);
  lines.push(`   │  └─ asked at = ${input.askedAt ?? '(unread)'}`);
  lines.push(`   │`);

  // 🔴 the two stamps are second-precision, so a file written moments BEFORE the ask renders
  //    identically to it — and "it is older than the question" then reads as a malfunction.
  //    that case is not a leftover round; it is a driver who wrote before the guard asked,
  //    which `(stone, slug)` path keys made possible. it gets its own words, and its own fix.
  const rendersIdentically =
    !!input.articulationMtime && input.articulationMtime === input.askedAt;
  if (rendersIdentically) {
    lines.push(`   ├─ the two read alike, so the gap is under a second`);
    lines.push(`   │  └─ you wrote it just before the guard asked for it`);
    lines.push(`   │`);
    lines.push(
      `   ├─ the words are probably fine — the guard cannot tell them`,
    );
    lines.push(`   │  apart from a leftover, so it asks you to claim them`);
    lines.push(`   │`);
    lines.push(`   └─ re-save the file, then promise again 🍵`);
    return lines;
  }

  lines.push(`   ├─ so it reviewed an artifact that has since moved on`);
  lines.push(`   │  └─ read what is there now, and write what you find`);
  lines.push(`   │`);
  lines.push(`   └─ then promise again 🍵`);

  return lines;
};
