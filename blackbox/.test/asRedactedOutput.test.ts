import { asRedactedOutput } from './asRedactedOutput';

const TEST_CASES = [
  {
    description: 'a review log dir masks to its stable stem',
    given: {
      raw: 'logs: .log/bhrain/review/2026-10-12T03-06-39-705Z.pid3296861.180c74b6\n',
    },
    expect: { text: 'logs: .log/bhrain/review/<TIMESTAMP>\n' },
  },
  {
    description: 'a genTempDir symlink path masks whole',
    given: {
      raw: 'at /tmp/x/.temp/genTempDir.symlink/2026-10-12.abc/route/1.vision.stone ok',
    },
    expect: { text: 'at <TEMP_PATH> ok' },
  },
  {
    description: 'both masks apply on one line',
    given: {
      raw: '/tmp/genTempDir.symlink/a/b and .log/bhrain/review/x',
    },
    expect: { text: '<TEMP_PATH> and .log/bhrain/review/<TIMESTAMP>' },
  },
  {
    description: 'text with neither path is returned unchanged',
    given: { raw: '✋ ConstraintError: --rules glob found nada\n' },
    expect: { text: '✋ ConstraintError: --rules glob found nada\n' },
  },
];

describe('asRedactedOutput', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asRedactedOutput(thisCase.given.raw)).toEqual(
        thisCase.expect.text,
      );
    }),
  );
});
