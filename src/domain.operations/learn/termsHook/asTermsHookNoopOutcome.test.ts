import { asTermsHookNoopOutcome } from './asTermsHookNoopOutcome';
import type { TermsHookStatus } from './getOneTermsHookState';

const TEST_CASES: {
  description: string;
  mode: 'on' | 'off';
  status: TermsHookStatus;
  expected: 'already-enabled' | 'already-disabled' | null;
}[] = [
  {
    description: 'set on over the current entry is a no-op',
    mode: 'on',
    status: 'current',
    expected: 'already-enabled',
  },
  {
    description: 'set on over drift owes a write',
    mode: 'on',
    status: 'drifted',
    expected: null,
  },
  {
    description: 'set on over no entry owes a write',
    mode: 'on',
    status: 'off',
    expected: null,
  },
  {
    description: 'set off over no entry is a no-op',
    mode: 'off',
    status: 'off',
    expected: 'already-disabled',
  },
  {
    description: 'set off over the current entry owes a write',
    mode: 'off',
    status: 'current',
    expected: null,
  },
  {
    description: 'set off over drift owes a write',
    mode: 'off',
    status: 'drifted',
    expected: null,
  },
];

describe('asTermsHookNoopOutcome', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(
        asTermsHookNoopOutcome({
          mode: thisCase.mode,
          status: thisCase.status,
        }),
      ).toEqual(thisCase.expected);
    });
  });
});
