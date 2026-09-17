import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = one reviewer's in-flight window, in epoch milliseconds
 */
export interface ReviewWindow {
  slug: string;
  beganAt: number;
  endedAt: number;
}

/**
 * .what = true only for the one error an absent log legitimately raises
 * .why = an allowlist, per `rule.forbid.failhide` — a catch may swallow the
 *        errors it names and MUST rethrow the rest. an EACCES or an EIO read
 *        as an empty log otherwise, and this oracle then reports "no lanes ran"
 *        for a disk that could not be read
 */
const isErrorNoSuchFile = (error: unknown): boolean =>
  error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT';

/**
 * .what = the path the mock reviewer appends its window to
 * .why = one place owns it, so the fixture and its readers cannot drift
 */
const windowsLogPath = (input: { cwd: string }): string =>
  path.join(input.cwd, '.test', 'windows.log');

/**
 * .what = the ONE definition of a well-formed epoch stamp
 * .why = the shape check and the parse were two sources of truth for what a valid
 *        stamp is — a regex in the line guard, and a bare `parseInt` twenty lines
 *        below it. an author who loosens one and not the other gets a `NaN`
 *        window, and a `NaN` compares false against every operand, so
 *        `computeMaxInFlight`'s sort would place it arbitrarily and report a peak
 *        that is WRONG rather than absent. raised i002/r2
 */
const isStampWellFormed = (input: { stamp: string }): boolean =>
  /^[0-9]+$/.test(input.stamp);

/**
 * .what = a validated stamp, as epoch milliseconds
 * .why = the parse and its precondition travel together, so no call site can
 *        reach `parseInt` on a string this module never vetted
 */
const asStampMs = (input: { stamp: string }): number => {
  if (!isStampWellFormed(input))
    throw new Error(
      `readReviewWindows: "${input.stamp}" is no epoch stamp. a NaN window would report a wrong peak rather than an absent one.`,
    );
  return parseInt(input.stamp, 10);
};

/**
 * .what = empties the window log, so one pass is read apart from the pass before it
 * .why = the fixture appends across every arrival, and each clamp asks about ONE pass
 */
export const clearReviewWindows = async (input: {
  cwd: string;
}): Promise<void> => {
  await fs.writeFile(windowsLogPath({ cwd: input.cwd }), '');
};

/**
 * .what = pairs the mock's BEGAN/ENDED lines into one window per reviewer
 * .why = the PARSE half of the oracle, split from the fs read so it can be
 *        clamped at the unit tier. every concurrency verdict in the suite is
 *        read through this function, so an untested one makes every clamp
 *        above it unfalsifiable (`rule.forbid.unit.remote-boundaries` forbids
 *        a unit test that reads the disk, so the transformer must come out)
 *
 * .note = a lane whose ENDED never arrived yields NO window, deliberately. the
 *         mock writes ENDED before every exit branch, so an unpaired BEGAN means
 *         the subprocess was killed rather than that it failed — and a killed
 *         lane has no end instant to honestly report
 */
export const asReviewWindows = (input: { raw: string }): ReviewWindow[] => {
  const beganBySlug = new Map<string, number>();
  const windows: ReviewWindow[] = [];

  for (const line of input.raw.split('\n')) {
    const trimmed = line.trim();

    // a blank line is an absence of a record, never a broken one
    // .why = the fixture appends a newline after each record, so the final
    //        split always yields ''. that is the ONE line a skip is honest about
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    const [marker, slug, stamp] = parts;

    // 🔴 a line this parser cannot read is a CORRUPT CAPTURE, never a quiet zero
    // .why = a silent skip made a truncated mid-write line indistinguishable
    //        from "that lane never ran" — so a peak clamp would read an
    //        under-count and go GREEN on data it could not parse. that is the
    //        failhide shape `rule.forbid.failhide` names, one level up from the
    //        read: the read now rethrows an EACCES, and this rethrows a garbled
    //        line. both are "the oracle could not see", and neither may pass as 0
    //
    // ⇒ raised twice on i001, independently — `mech-failhides` nitpick.1 and
    //   `arch-hazards-maintenance` nitpick.2. two lanes on one line is a signal
    if (
      parts.length !== 3 ||
      !marker ||
      !slug ||
      !stamp ||
      (marker !== 'BEGAN' && marker !== 'ENDED') ||
      !isStampWellFormed({ stamp })
    )
      throw new Error(
        `readReviewWindows: cannot parse window line "${trimmed}" — expected "BEGAN|ENDED <slug> <epochMs>". a garbled line means a corrupt capture, and a concurrency clamp must not read one as zero lanes.`,
      );

    if (marker === 'BEGAN') {
      // 🔴 a second BEGAN for a slug still awaiting its ENDED cannot be paired
      // .why = the map holds ONE begin instant per slug. to overwrite it would
      //        drop the first lane's window silently, and every peak clamp reads
      //        through here — so an under-count would go GREEN on a log the
      //        oracle cannot honestly interpret (a lane killed then restarted
      //        within one pass). refuse it loud, exactly as a garbled line is
      //        refused above: both are "the oracle cannot see", and neither may
      //        pass as fewer lanes. raised i018/r7
      if (beganBySlug.has(slug))
        throw new Error(
          `readReviewWindows: two BEGAN lines for "${slug}" with no ENDED between them. the oracle pairs one begin per slug, so a second would drop the first window silently — a concurrency clamp must not read an under-count as fewer lanes.`,
        );
      beganBySlug.set(slug, asStampMs({ stamp }));
    }
    if (marker === 'ENDED') {
      const beganAt = beganBySlug.get(slug);

      // ⚠️ an ENDED with no BEGAN is DROPPED, deliberately — and it is the one
      //    skip that survives the rule above
      // .why = the clamps call `clearReviewWindows` between passes, so a lane
      //        that began in pass N and ended in pass N+1 leaves a legitimately
      //        orphaned ENDED. the line is well-formed; it is its PARTNER that
      //        is absent, which is a different fact from a garbled capture
      if (beganAt === undefined) continue;

      const endedAt = asStampMs({ stamp });

      // 🔴 a window must span forward — endedAt > beganAt, always
      // .why = `computeMaxInFlight` sweeps begin/end events and, at a tie, sorts
      //        the end BEFORE the begin so two touching windows do not read as
      //        overlapped. a zero-width window (endedAt === beganAt) then cancels
      //        its own begin against its own end and reports peak 0 for a lane
      //        that ran; a backward window (endedAt < beganAt, e.g. a wall-clock
      //        NTP step between the two stamps) counts the lane in-flight across
      //        a negative span. both make a peak clamp read an under-count with
      //        no error — the failhide this oracle exists to refuse. the fixture
      //        holds each lane >= 0.6s, so a non-forward span is a corrupt
      //        capture, never a real pour. raised i018/r7 nitpicks 1 + 2
      if (endedAt <= beganAt)
        throw new Error(
          `readReviewWindows: window for "${slug}" does not span forward (beganAt=${beganAt}, endedAt=${endedAt}). a zero-width or backward window would make a peak clamp under-count without an error — the capture is corrupt, not a pour.`,
        );

      windows.push({ slug, beganAt, endedAt });
      beganBySlug.delete(slug);
    }
  }

  return windows;
};

/**
 * .what = reads each reviewer's in-flight window out of the mock's append-only log
 * .why = concurrency is provable only by OBSERVED overlap. a duration assertion
 *        proves naught — a slow machine mimics a serial run, and a fast one mimics
 *        a concurrent run. the windows say which actually happened
 *
 * .note = the fs read, and no more. the pair-up lives in `asReviewWindows`, so
 *         this stays a thin boundary and the logic stays unit-testable
 *
 * 🔴 .why only ENOENT is swallowed = this is the oracle EVERY concurrency clamp
 *     reads through — `l1Peak`, `l3Peak`, `l1Count`. a bare `.catch(() => '')`
 *     turns a permission error or a disk error into an empty window set, and the
 *     clamp above it then reports a peak of 0 with no hint of the real cause.
 *     an absent log is the one legitimate empty case (the first pass, before the
 *     mock has written), so it alone is allowed through
 */
export const readReviewWindows = async (input: {
  cwd: string;
}): Promise<ReviewWindow[]> =>
  asReviewWindows({
    raw: await fs
      .readFile(windowsLogPath({ cwd: input.cwd }), 'utf-8')
      .catch((error) => {
        if (isErrorNoSuchFile(error)) return '';
        throw error;
      }),
  });

/**
 * .what = the greatest count of windows that were open at one instant
 * .why = THE observable for a concurrent pour. it is the count the bound governs,
 *        and it is what a serial arm can never raise above 1
 *
 * .note = computed by a sweep over begin/end events rather than by a pairwise
 *         overlap check, so it reports the true peak rather than a lower bound
 */
export const computeMaxInFlight = (input: {
  windows: ReviewWindow[];
}): number => {
  const events = input.windows.flatMap((w) => [
    { at: w.beganAt, delta: 1 },
    { at: w.endedAt, delta: -1 },
  ]);

  // an end sorts BEFORE a begin at the same instant, so two windows that merely
  // touch are not counted as overlapped
  //
  // .note = this tie-break is safe ONLY because every window spans forward —
  //         `asReviewWindows` refuses `endedAt <= beganAt` at parse, so no single
  //         window can cancel its own begin against its own end here. a zero-width
  //         window would otherwise report peak 0 for a lane that ran
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);

  let inFlight = 0;
  let peak = 0;
  for (const event of events) {
    inFlight += event.delta;
    peak = Math.max(peak, inFlight);
  }
  return peak;
};

/**
 * .what = the windows for one level, by the fixture's slug prefix
 * .why = the two levels are asserted apart — l1 fans out, l3 pours one at a time
 */
export const selectWindowsForLevel = (input: {
  windows: ReviewWindow[];
  prefix: string;
}): ReviewWindow[] =>
  input.windows.filter((w) => w.slug.startsWith(input.prefix));
