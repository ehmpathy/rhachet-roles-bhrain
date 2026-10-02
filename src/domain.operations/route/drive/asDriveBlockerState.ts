import { UnexpectedCodePathError } from 'helpful-errors';

import { DriveBlockerState, DriveBrainInheritance } from './DriveBlocker';

/**
 * .what = the fresh state a route with no persisted blocker file starts from
 * .why = a first tick has never written the file, so `count: 0, stone: null, brain: null`
 *        is the honest zero — no block streak, no stone entered, no switch dispatched
 *
 * 🔴 .note = `brain: null` is what keeps case=10 byte-identical on an OPTED-IN route whose
 *        first stone is brainless. the fresh state is what an absent file degrades to, and
 *        an absent record must render no attribution line — a fresh route has inherited
 *        naught, so there is no spend to attribute
 */
export const asFreshDriveBlockerState = (): DriveBlockerState =>
  new DriveBlockerState({ count: 0, stone: null, brain: null });

/**
 * .what = parses the persisted `.drive.blockers.latest.json` content into a
 *         `DriveBlockerState`. EMPTY content degrades to fresh; PRESENT-but-unreadable
 *         content fails loud.
 * .why = both fields carry weight — `count` backs the 21-block stuck-cutoff, `stone`
 *        backs the brain-dispatch entry edge — so a silent degrade of either is a failhide
 *        over a safety net (`rule.forbid.failhide`). the two unreadable shapes are NOT the
 *        same fault and must not fold into one outcome:
 *
 *        - EMPTY / whitespace-only → fresh. an absent file is `getDriveBlockerState`'s
 *          (ENOENT → fresh); a zero-byte file is the same benign absence one layer down —
 *          `mutateDriveBlockerState` writes to a temp file then `fs.rename`s over the
 *          target, and rename is atomic on POSIX, so a reader sees EITHER the whole old
 *          file OR the whole new one, NEVER an empty or partial one. an empty file
 *          therefore means "no state yet", not "torn write".
 *
 *        - PRESENT but not json → MalfunctionError. the atomic rename makes a torn read
 *          from THIS feature impossible, so a non-empty file that will not parse is a
 *          genuinely corrupt state file (a truncation by a non-feature writer, a disk
 *          fault, a manual mangle). to degrade it to fresh would silently re-arm the
 *          21-block cutoff to 0 and clear the entry marker — the exact silent reset the
 *          rule forbids. fail loud so the operator repairs the file rather than the
 *          route drift past a broken safety net.
 *
 *        - 🔴 PRESENT, valid json, WRONG SHAPE → MalfunctionError, on the same ground.
 *          `?? 0` passes a wrong-typed value through: `"banana" > 21` is false, so the
 *          stuck cutoff silently un-arms; a numeric stone never equals a name, so a
 *          same-stone continuity re-dispatches (`rule.forbid.failhide`)
 *
 * .note = ABSENT is still benign and WRONG-TYPED is not, and the asymmetry is deliberate.
 *         an absent field is what an older writer leaves behind, so it degrades to the
 *         honest zero; a present field of the wrong type is a claim the file makes and
 *         cannot keep
 */
export const asDriveBlockerState = (input: {
  content: string;
}): DriveBlockerState => {
  // an empty / whitespace-only file is a benign absence (atomic rename precludes a torn
  // read), so it degrades to fresh — never a fault
  if (input.content.trim() === '') return asFreshDriveBlockerState();

  const parsed = ((): unknown => {
    try {
      return JSON.parse(input.content) as unknown;
    } catch (error) {
      // present-but-unparseable is a corrupt state file — fail loud, never a silent reset
      throw new UnexpectedCodePathError(
        'drive blocker state file is present but not readable json',
        {
          content: input.content,
          hint: 'the state file at .route/.drive.blockers.latest.json is corrupt; delete it to reset the block streak, or restore it from a known-good copy',
          cause: error instanceof Error ? error : new Error(String(error)),
        },
      );
    }
  })();

  // .why one thrower rather than three inline throws = the hint is identical for every
  //      wrong-shape arm, and three copies of it drift the day the remedy changes
  const throwWrongShape = (detail: { field: string; was: unknown }): never => {
    throw new UnexpectedCodePathError(
      `drive blocker state file carries a \`${detail.field}\` of the wrong type`,
      {
        field: detail.field,
        was: detail.was,
        typeWas: typeof detail.was,
        content: input.content,
        hint: 'the state file at .route/.drive.blockers.latest.json is corrupt; delete it to reset the block streak, or restore it from a known-good copy',
      },
    );
  };

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return throwWrongShape({ field: '<root>', was: parsed });

  const { count, stone, brain } = parsed as Record<string, unknown>;

  if (count !== undefined && count !== null && !Number.isFinite(count))
    return throwWrongShape({ field: 'count', was: count });
  if (stone !== undefined && stone !== null && typeof stone !== 'string')
    return throwWrongShape({ field: 'stone', was: stone });

  return new DriveBlockerState({
    count: (count as number | null | undefined) ?? 0,
    stone: (stone as string | null | undefined) ?? null,
    brain: asBrainInheritance({ was: brain, throwWrongShape }),
  });
};

/**
 * .what = the `brain` field's own shape check — the attribution record, or the honest null
 * .why = its two strings must move together: a `{ slug }` with no `stone` would record an
 *        attribution that traces to no stone (`rule.forbid.failhide`)
 *
 * .note = ABSENT degrades to null (an older writer's shape); WRONG-TYPED fails loud, as the
 *         scalar fields do. it takes the thrower, so one remedy stays one string
 */
const asBrainInheritance = (input: {
  was: unknown;
  throwWrongShape: (detail: { field: string; was: unknown }) => never;
}): DriveBrainInheritance | null => {
  const { was, throwWrongShape } = input;

  if (was === undefined || was === null) return null;
  if (typeof was !== 'object' || Array.isArray(was))
    return throwWrongShape({ field: 'brain', was });

  // an absent `effort` is an older writer's shape, and reads as null
  const { slug, effort = null, stone } = was as Record<string, unknown>;
  if (slug !== null && typeof slug !== 'string')
    return throwWrongShape({ field: 'brain.slug', was: slug });
  if (effort !== null && typeof effort !== 'string')
    return throwWrongShape({ field: 'brain.effort', was: effort });
  if (slug === null && effort === null)
    return throwWrongShape({ field: 'brain', was });
  if (typeof stone !== 'string')
    return throwWrongShape({ field: 'brain.stone', was: stone });

  return new DriveBrainInheritance({ slug, effort, stone });
};
