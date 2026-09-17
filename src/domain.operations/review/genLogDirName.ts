import { getUuid } from 'uuid-fns';

/**
 * .what = the log directory's name — an iso timestamp, this process's pid, a uuid
 *
 * .why = sortable by the clock, and unique per concurrent lane
 *
 * .note = the timestamp alone was unique only while the guard ran reviews one at a
 *         time. it has millisecond resolution and no other discriminator, so a
 *         concurrent pour of N lanes — which spawns them in a tight loop — collides
 *         routinely, and two lanes that share a directory overwrite each other's
 *         input.scope.json, metrics.*.json, and output artifacts.
 *
 *         the harm lands only under failure and is a MISROUTED diagnosis: the failure
 *         hint hands the driver `logDirRelative`, so a driver sent to inspect reviewer
 *         A opens reviewer B's evidence — and finds a plausible file rather than an
 *         absent one.
 *
 * .note = the two suffixes close it rather than narrow it, and each answers a case the
 *         other cannot. a live pid is unique among live processes, so it parts the
 *         guard's lanes — every review runs as its own subprocess (runOneReview: "no
 *         in-process fork"). the uuid parts calls that share ONE process, which the
 *         exported stepReview permits and its own rules-skip note contemplates.
 *
 *         a finer clock is NOT the answer to either: it shrinks the window and does not
 *         close it, which turns a certain defect into an intermittent one — strictly
 *         worse to diagnose.
 *
 *         `getUuid` is the repo's extant uniqueness mechanism (uuid-fns, already a
 *         dependency). a hand-rolled module-level counter would have been a second
 *         mechanism for a solved problem, and the only mutable module state in that file.
 *
 * .note = 🔴 it is a LEAF on purpose, and the extraction is what makes it CLAMPABLE.
 *         it lived module-private inside `stepReview.ts`, where the only reachable
 *         assertion was an acceptance pour — and an acceptance pour cannot exercise the
 *         defect at all, because the guard gives every lane its own subprocess and so
 *         its own pid. ⇒ a directory-count assertion over a real pour stays green with
 *         the uuid removed, which is a clamp with no teeth. the unit grain is the only
 *         one where both suffixes are falsifiable
 */
export const genLogDirName = (): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${stamp}.pid${process.pid}.${getUuid()}`;
};
