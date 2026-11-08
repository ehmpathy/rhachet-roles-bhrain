import { asTermsHookNoopOutcome } from './asTermsHookNoopOutcome';
import type { TermsHookStatus } from './getOneTermsHookState';

const TEST_CASES: {
  description: string;
  mode: 'enable' | 'disable';
  status: TermsHookStatus;
  expected: 'already-enabled' | 'already-disabled' | null;
}[] = [
  {
    description: 'enable on the current entry is a no-op',
    mode: 'enable',
    status: 'current',
    expected: 'already-enabled',
  },
  {
    description: 'enable on drift owes a write',
    mode: 'enable',
    status: 'drifted',
    expected: null,
  },
  {
    description: 'enable on no entry owes a write',
    mode: 'enable',
    status: 'off',
    expected: null,
  },
  {
    description: 'disable on no entry is a no-op',
    mode: 'disable',
    status: 'off',
    expected: 'already-disabled',
  },
  {
    description: 'disable on the current entry owes a write',
    mode: 'disable',
    status: 'current',
    expected: null,
  },
  {
    description: 'disable on drift owes a write',
    mode: 'disable',
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
