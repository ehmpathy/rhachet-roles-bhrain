/**
 * .what = maps a `when.repeatably` test name onto its attempt-1 form
 * .why = test-fns appends `, attempt N` to each attempt's name, so a snapshot keyed by name
 *        differs per attempt. a later attempt must check the attempt-1 baseline, never a key
 *        that ci cannot write (`snapshotsHoldOnlyFirstAttemptKeys` keeps the snap files so)
 */
export const asSnapshotTestNameOfFirstAttempt = (input: {
  testName: string;
}): string =>
  input.testName.replace(
    /, attempt \d+(?= (?:given|when|then): )/g,
    ', attempt 1',
  );
