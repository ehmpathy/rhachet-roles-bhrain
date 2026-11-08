import type { ClaudeHookOfRepo } from './ClaudeSettingsOfRepo';
import { isTermsHookCommand } from './isTermsHookCommand';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

const TEST_CASES: {
  description: string;
  given: { hook: ClaudeHookOfRepo };
  expect: boolean;
}[] = [
  {
    description: 'the declared command',
    given: { hook: { command: TERMS_HOOK_DECLARED.command } },
    expect: true,
  },
  {
    description: 'a hand copy via the local bin',
    given: {
      hook: {
        command:
          './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
      },
    },
    expect: true,
  },
  {
    description: 'an npx body',
    given: {
      hook: { command: 'npx rhx learn.domain.terms --when hook.onStop' },
    },
    expect: true,
  },
  {
    description: 'an unrelated stop hook',
    given: {
      hook: {
        command: './node_modules/.bin/rhx route.drive --when hook.onStop',
      },
    },
    expect: false,
  },
  {
    description: 'the term face on another moment',
    given: { hook: { command: 'rhx learn.domain.terms --when hook.onBoot' } },
    expect: false,
  },
  { description: 'no command', given: { hook: {} }, expect: false },
];

describe('isTermsHookCommand', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(isTermsHookCommand(thisCase.given)).toEqual(thisCase.expect);
    });
  });
});
