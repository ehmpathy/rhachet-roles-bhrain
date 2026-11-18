import type {
  ClaudeHookOfRepo,
  ClaudeSettingsOfRepo,
} from './ClaudeSettingsOfRepo';
import {
  getOneTermsHookState,
  type TermsHookStatus,
} from './getOneTermsHookState';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

const DECLARED: ClaudeHookOfRepo = { ...TERMS_HOOK_DECLARED.hook };
const EXTRA_KEY: ClaudeHookOfRepo = { ...DECLARED, statusMessage: 'hi' };
const OLDER: ClaudeHookOfRepo = { ...DECLARED, timeout: 30 };
const HAND: ClaudeHookOfRepo = {
  type: 'command',
  command: './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
  author: 'repo=bhrain/role=learner',
};
const DRIVER: ClaudeHookOfRepo = {
  type: 'command',
  command: './node_modules/.bin/rhx route.drive --when hook.onStop',
  author: 'repo=bhrain/role=driver',
};

const asSettings = (input: {
  hooks: ClaudeHookOfRepo[];
}): ClaudeSettingsOfRepo => ({
  hooks: { Stop: [{ matcher: '*', hooks: input.hooks }] },
});

const TEST_CASES: {
  description: string;
  settings: ClaudeSettingsOfRepo | null;
  expected: { status: TermsHookStatus; drift: number };
}[] = [
  {
    description: 'no file is off, with no drift',
    settings: null,
    expected: { status: 'off', drift: 0 },
  },
  {
    description: 'only a peer hook is off, with no drift',
    settings: asSettings({ hooks: [DRIVER] }),
    expected: { status: 'off', drift: 0 },
  },
  {
    description: 'the one declared entry is current',
    settings: asSettings({ hooks: [DRIVER, DECLARED] }),
    expected: { status: 'current', drift: 0 },
  },
  {
    description:
      'the declared entry with a foreign extra key is a drift of one',
    settings: asSettings({ hooks: [EXTRA_KEY] }),
    expected: { status: 'drifted', drift: 1 },
  },
  {
    description: 'two byte-identical declared copies are a drift of one',
    settings: asSettings({ hooks: [DECLARED, DECLARED] }),
    expected: { status: 'drifted', drift: 1 },
  },
  {
    description: 'the declared entry beside a hand copy is a drift of one',
    settings: asSettings({ hooks: [DECLARED, HAND] }),
    expected: { status: 'drifted', drift: 1 },
  },
  {
    description:
      'an older body and a hand copy, no declared one, are a drift of two',
    settings: asSettings({ hooks: [OLDER, HAND, DRIVER] }),
    expected: { status: 'drifted', drift: 2 },
  },
];

describe('getOneTermsHookState', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      const state = getOneTermsHookState({ settings: thisCase.settings });
      expect({ status: state.status, drift: state.drift }).toEqual(
        thisCase.expected,
      );
    });
  });
});
