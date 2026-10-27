import { given, then, when } from 'test-fns';

import { asStatusLineCacheDropFaultRow } from './asStatusLineCacheDropFaultRow';

const TEST_CASES: {
  description: string;
  given: { code: string };
  expect: { codeShown: string };
}[] = [
  {
    description:
      'a permission fault names its code, the lag bound, and the fix',
    given: { code: 'EACCES' },
    expect: { codeShown: '(EACCES)' },
  },
  {
    description: 'a busy-file fault names its code, the lag bound, and the fix',
    given: { code: 'EBUSY' },
    expect: { codeShown: '(EBUSY)' },
  },
];

describe('asStatusLineCacheDropFaultRow', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the drop fault row is rendered', () => {
        then('it names the code, the lag bound, and the fix', () => {
          const row = asStatusLineCacheDropFaultRow(thisCase.given);
          expect(
            row.startsWith(
              '[route.bind.set] warn: status line cache drop failed',
            ),
          ).toBe(true);
          expect(row).toContain(thisCase.expect.codeShown);
          expect(row).toContain('the line may lag the bind for up to 30s');
          expect(row).toContain(
            'fix: remove .agent/.cache/repo=bhrain/role=driver/skill=route.status.line/',
          );
          expect(row).toMatchSnapshot();
        });
      });
    }),
  );
});
