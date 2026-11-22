import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = parts a log directory name into its three fields
 *
 * .why  = `genLogDirName.test.ts` recovered them by positional split —
 *         `name.split('.pid')[0]` for the stamp, `name.split('.pid<pid>.')[1]`
 *         for the uuid. that reads the grammar by position rather than by
 *         shape, so it is decode-friction (`rule.forbid.named-transformers`,
 *         raised i021/r3, i026/r1+r3, i028/r3, i032/r6)
 *
 * 🔴 .why it REFUSES rather than returns undefined = the positional split's
 *     real defect was not that it was hard to read — it was that a grammar
 *     change would flip the split SILENTLY and the assertion would read green
 *     for the wrong reason. `[1]` of a failed split is `undefined`, and
 *     `expect(undefined).toMatch(...)` is the only line that would have caught
 *     it. an anchored regex plus a loud throw converts that silent pass into a
 *     red test, which is the whole point of the extraction
 *
 * ⚠️ .the grammar's OWNER is `genLogDirName.ts`, never this file. this is the
 *     reader; that is the writer. they can still drift — what changed is that a
 *     drift is now LOUD here rather than absorbed
 *
 * .why a test asset = no production caller parts this name. `stepReview` hands
 *        the whole string to a driver as a path, so a parser at `src/` would be
 *        a production shape written for a test
 */
export const asLogDirNameParts = (input: {
  /** one name, exactly as `genLogDirName` minted it */
  name: string;
}): { stamp: string; pid: string; uuid: string } => {
  const matched = LOG_DIR_NAME.exec(input.name);
  if (!matched?.groups)
    throw new UnexpectedCodePathError(
      `log dir name does not match the grammar genLogDirName mints: ${input.name}`,
      { name: input.name, grammar: LOG_DIR_NAME.source },
    );

  const { stamp, pid, uuid } = matched.groups;
  return { stamp: stamp!, pid: pid!, uuid: uuid! };
};

/**
 * .what = the grammar `genLogDirName` mints — anchored at BOTH ends
 * .why  = anchored at the head so a prefix cannot slip past, and at the tail so
 *         a new field appended later fails loud here rather than lands silently
 *         inside `uuid`
 */
const LOG_DIR_NAME =
  /^(?<stamp>\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.pid(?<pid>\d+)\.(?<uuid>[0-9a-f-]+)$/;
