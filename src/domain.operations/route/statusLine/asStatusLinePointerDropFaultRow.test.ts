import { given, then, when } from 'test-fns';

import { asStatusLinePointerDropFaultRow } from './asStatusLinePointerDropFaultRow';

const POINTER_PATH =
  '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=feat.x.route';

const TEST_CASES: {
  description: string;
  given: { code: string; pointerPath: string };
  expect: { codeShown: string };
}[] = [
  {
    description: 'a permission fault names its code and the path to remove',
    given: { code: 'EACCES', pointerPath: POINTER_PATH },
    expect: { codeShown: '(EACCES)' },
  },
  {
    description: 'a busy-file fault names its code and the path to remove',
    given: { code: 'EBUSY', pointerPath: POINTER_PATH },
    expect: { codeShown: '(EBUSY)' },
  },
];

describe('asStatusLinePointerDropFaultRow', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the pointer drop fault row is rendered', () => {
        then('it names the code and the fix', () => {
          const row = asStatusLinePointerDropFaultRow(thisCase.given);
          expect(
            row.startsWith(
              '[route.bind.del] warn: status line pointer drop failed',
            ),
          ).toBe(true);
          expect(row).toContain(thisCase.expect.codeShown);
          expect(row).toContain(`fix: remove ${POINTER_PATH}`);
          expect(row).toMatchSnapshot();
        });
      });
    }),
  );
});
