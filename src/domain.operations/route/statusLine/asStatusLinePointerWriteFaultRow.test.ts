import { given, then, when } from 'test-fns';

import { asStatusLinePointerWriteFaultRow } from './asStatusLinePointerWriteFaultRow';

const POINTER_PATH =
  '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=feat.x.route';

const TEST_CASES: {
  description: string;
  given: { code: string; pointerPath: string };
  expect: { codeShown: string };
}[] = [
  {
    description: 'a permission fault names its code, the path, and the fix',
    given: { code: 'EACCES', pointerPath: POINTER_PATH },
    expect: { codeShown: '(EACCES)' },
  },
  {
    description: 'a full disk names its code, the path, and the fix',
    given: { code: 'ENOSPC', pointerPath: POINTER_PATH },
    expect: { codeShown: '(ENOSPC)' },
  },
];

describe('asStatusLinePointerWriteFaultRow', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the pointer write fault row is rendered', () => {
        then('it names the code, the path, and the fix', () => {
          const row = asStatusLinePointerWriteFaultRow(thisCase.given);
          expect(
            row.startsWith('[route.status.line] fault: pointer write failed'),
          ).toBe(true);
          expect(row).toContain(thisCase.expect.codeShown);
          expect(row).toContain(`at ${POINTER_PATH}`);
          expect(row).toContain('fix: repair the cause, then rhx route.drive');
          expect(row).toMatchSnapshot();
        });
      });
    }),
  );
});
