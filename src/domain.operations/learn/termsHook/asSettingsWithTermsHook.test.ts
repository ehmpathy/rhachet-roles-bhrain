import { asSettingsWithoutTermsHook } from './asSettingsWithoutTermsHook';
import { asSettingsWithTermsHook } from './asSettingsWithTermsHook';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';
import {
  getOneTermsHookState,
  type TermsHookStatus,
} from './getOneTermsHookState';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

/**
 * .what = the entry `enable` writes, as a block
 */
const BLOCK_DECLARED = {
  matcher: '*',
  hooks: [{ ...TERMS_HOOK_DECLARED.hook }],
};

/**
 * .what = a peer Stop hook the toggle must never touch
 */
const BLOCK_DRIVER = {
  matcher: '*',
  hooks: [
    {
      type: 'command',
      command: './node_modules/.bin/rhx route.drive --when hook.onStop',
      timeout: 60,
      author: 'repo=bhrain/role=driver',
    },
  ],
};

/**
 * .what = a hand copy of the withdrawn hook, under the learner's role author
 */
const HOOK_HAND_COPY = {
  type: 'command',
  command: './node_modules/.bin/rhx learn.domain.terms --when hook.onStop',
  timeout: 5,
  author: 'repo=bhrain/role=learner',
};

const TEST_CASES: {
  description: string;
  given: { settings: ClaudeSettingsOfRepo | null };
  expect: {
    stateBefore: { status: TermsHookStatus; found: number };
    withHook: ClaudeSettingsOfRepo;
    withoutHook: ClaudeSettingsOfRepo;
  };
}[] = [
  {
    description:
      'an absent file: enable writes one entry; disable has naught to drop',
    given: { settings: null },
    expect: {
      stateBefore: { status: 'off', found: 0 },
      withHook: { hooks: { Stop: [BLOCK_DECLARED] } },
      withoutHook: {},
    },
  },
  {
    description: 'a peer Stop hook and other keys: both are kept, in order',
    given: {
      settings: {
        permissions: { allow: ['Bash(echo:*)'] },
        hooks: { Stop: [BLOCK_DRIVER] },
      },
    },
    expect: {
      stateBefore: { status: 'off', found: 0 },
      withHook: {
        permissions: { allow: ['Bash(echo:*)'] },
        hooks: { Stop: [BLOCK_DRIVER, BLOCK_DECLARED] },
      },
      withoutHook: {
        permissions: { allow: ['Bash(echo:*)'] },
        hooks: { Stop: [BLOCK_DRIVER] },
      },
    },
  },
  {
    description:
      'the declared entry already present: current, and enable converges to the same',
    given: { settings: { hooks: { Stop: [BLOCK_DRIVER, BLOCK_DECLARED] } } },
    expect: {
      stateBefore: { status: 'current', found: 1 },
      withHook: { hooks: { Stop: [BLOCK_DRIVER, BLOCK_DECLARED] } },
      withoutHook: { hooks: { Stop: [BLOCK_DRIVER] } },
    },
  },
  {
    description:
      'a hand copy inside a shared block: drift; enable replaces it, disable drops only it',
    given: {
      settings: {
        hooks: {
          Stop: [
            { matcher: '*', hooks: [HOOK_HAND_COPY, ...BLOCK_DRIVER.hooks] },
          ],
        },
      },
    },
    expect: {
      stateBefore: { status: 'drifted', found: 1 },
      withHook: { hooks: { Stop: [BLOCK_DRIVER, BLOCK_DECLARED] } },
      withoutHook: { hooks: { Stop: [BLOCK_DRIVER] } },
    },
  },
  {
    description:
      'two copies: drift; disable drops both and the events they leave empty',
    given: {
      settings: {
        hooks: {
          Stop: [BLOCK_DECLARED, { matcher: '*', hooks: [HOOK_HAND_COPY] }],
        },
      },
    },
    expect: {
      stateBefore: { status: 'drifted', found: 2 },
      withHook: { hooks: { Stop: [BLOCK_DECLARED] } },
      withoutHook: { hooks: {} },
    },
  },
  {
    description:
      'an empty event and an empty block the toggle did not empty: both are kept as found',
    given: {
      settings: {
        hooks: {
          SessionStart: [],
          PreToolUse: [{ matcher: 'Bash', hooks: [] }],
          Stop: [{ matcher: '*', hooks: [HOOK_HAND_COPY] }],
        },
      },
    },
    expect: {
      stateBefore: { status: 'drifted', found: 1 },
      withHook: {
        hooks: {
          SessionStart: [],
          PreToolUse: [{ matcher: 'Bash', hooks: [] }],
          Stop: [BLOCK_DECLARED],
        },
      },
      withoutHook: {
        hooks: {
          SessionStart: [],
          PreToolUse: [{ matcher: 'Bash', hooks: [] }],
        },
      },
    },
  },
];

// one subject per describe, over the same corpus, so a red case names the subject that broke
describe('getOneTermsHookState', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      const state = getOneTermsHookState({ settings: thisCase.given.settings });
      expect({ status: state.status, found: state.found.length }).toEqual(
        thisCase.expect.stateBefore,
      );
    });
  });
});

describe('asSettingsWithTermsHook', () => {
  TEST_CASES.forEach((thisCase) => {
    test(`${thisCase.description} — converges to exactly one declared entry`, () => {
      const withHook = asSettingsWithTermsHook({
        settings: thisCase.given.settings,
      });
      expect(withHook).toEqual(thisCase.expect.withHook);
      expect(getOneTermsHookState({ settings: withHook }).status).toEqual(
        'current',
      );
    });
  });
});

describe('asSettingsWithoutTermsHook', () => {
  TEST_CASES.forEach((thisCase) => {
    test(`${thisCase.description} — leaves no stop that runs the term hook`, () => {
      const withoutHook = asSettingsWithoutTermsHook({
        settings: thisCase.given.settings,
      });
      expect(withoutHook).toEqual(thisCase.expect.withoutHook);
      expect(getOneTermsHookState({ settings: withoutHook }).status).toEqual(
        'off',
      );
    });
  });
});
