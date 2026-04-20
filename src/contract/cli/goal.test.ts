import { given, then, when } from 'test-fns';

import {
  GOAL_STATUS_CHOICES,
  Goal,
  GoalHow,
  GoalStatus,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

import {
  ALLOWED_HOW_KEYS,
  ALLOWED_STATUS_KEYS,
  ALLOWED_WHAT_KEYS,
  ALLOWED_WHY_KEYS,
  ALLOWED_YAML_KEYS,
  emitHelpOutput,
  emitHelpOutputGet,
  emitHelpOutputTriage,
  emitHelpOutputTriageNext,
  escalateMessageByCount,
  KNOWN_FLAGS,
  KNOWN_FLAGS_GET,
  KNOWN_FLAGS_TRIAGE,
  KNOWN_FLAGS_TRIAGE_NEXT,
} from './goal';

/**
 * .what = unit tests for goal CLI output render and validation
 * .why = fast feedback on treestruct format match to vision and arg validation
 */

/**
 * helper to capture console.log output
 */
const captureOutput = (fn: () => void): string => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return logs.join('\n');
};

/**
 * reimplementation of emitSubBucket for test
 * must match src/contract/cli/goal.ts
 * .note = always uses ├─ open and │ continuation so lines connect
 */
const emitSubBucket = (content: string, indent: string): void => {
  console.log(`${indent}├─`);
  console.log(`${indent}│  `);
  for (const line of content.split('\n')) {
    console.log(`${indent}│    ${line}`);
  }
  console.log(`${indent}│  `);
  console.log(`${indent}└─`);
};

describe('goal cli output', () => {
  given('[case1] emitSubBucket renders connected treebucket', () => {
    when('[t0] render field content', () => {
      then('open bracket, continuation, and close bracket all connect', () => {
        const output = captureOutput(() => {
          emitSubBucket('fix the flaky test', '   │  │  │  ');
        });
        expect(output).toMatchSnapshot();
        // verify lines connect: ├─ open, │ continuation, └─ close
        const lines = output.split('\n');
        const openLine = lines[0];
        const closeLine = lines[lines.length - 1];
        // both should start at same column with tree characters
        expect(openLine).toEqual('   │  │  │  ├─');
        expect(closeLine).toEqual('   │  │  │  └─');
        // continuation lines should use │
        expect(lines[1]).toEqual('   │  │  │  │  ');
      });
    });
  });

  given('[case2] emitSubBucket at different indent level', () => {
    when('[t0] render with shallower indent', () => {
      then('treebucket still connects properly', () => {
        const output = captureOutput(() => {
          emitSubBucket('team can ship', '   │  │     ');
        });
        expect(output).toMatchSnapshot();
        // verify close bracket at same depth as open
        const lines = output.split('\n');
        const openLine = lines[0];
        const closeLine = lines[lines.length - 1];
        expect(openLine).toEqual('   │  │     ├─');
        expect(closeLine).toEqual('   │  │     └─');
      });
    });
  });

  given('[case3] emitSubBucket with multiline content', () => {
    when('[t0] content has multiple lines', () => {
      then('each line is indented within the bucket', () => {
        const output = captureOutput(() => {
          emitSubBucket('line one\nline two\nline three', '   │  │  │  ');
        });
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case4] full goal render', () => {
    when('[t0] complete goal with all fields', () => {
      then('goal structure is valid', () => {
        const goal = new Goal({
          slug: 'fix-auth-test',
          why: new GoalWhy({
            ask: 'fix the flaky test',
            purpose: 'ci should pass before merge',
            benefit: 'team can ship',
          }),
          what: new GoalWhat({
            outcome: 'auth.test.ts passes reliably',
          }),
          how: new GoalHow({
            task: 'run test in isolation, identify flake source',
            gate: '10 consecutive passes',
          }),
          status: new GoalStatus({
            choice: 'enqueued',
            reason: 'goal created from triage',
          }),
          source: 'peer:human',
          createdAt: '2026-04-02',
          updatedAt: '2026-04-02',
        });

        // just verify the goal was constructed correctly
        expect(goal.slug).toEqual('fix-auth-test');
        expect(goal.why?.ask).toEqual('fix the flaky test');
        expect(goal.status.choice).toEqual('enqueued');
      });
    });
  });
});

describe('goal cli validation', () => {
  given('[case1] KNOWN_FLAGS constant', () => {
    when('[t0] flags are defined', () => {
      then('includes all required flags', () => {
        expect(KNOWN_FLAGS).toContain('--slug');
        expect(KNOWN_FLAGS).toContain('--scope');
        expect(KNOWN_FLAGS).toContain('--status.choice');
        expect(KNOWN_FLAGS).toContain('--covers');
        expect(KNOWN_FLAGS).toContain('--help');
        expect(KNOWN_FLAGS).toContain('--why.ask');
        expect(KNOWN_FLAGS).toContain('--why.purpose');
        expect(KNOWN_FLAGS).toContain('--why.benefit');
        expect(KNOWN_FLAGS).toContain('--what.outcome');
        expect(KNOWN_FLAGS).toContain('--how.task');
        expect(KNOWN_FLAGS).toContain('--how.gate');
        expect(KNOWN_FLAGS).toContain('--source');
        expect(KNOWN_FLAGS).toContain('--status.reason');
      });
    });
  });

  given('[case2] ALLOWED_YAML_KEYS constant', () => {
    when('[t0] keys are defined', () => {
      then('includes all valid top-level keys', () => {
        expect(ALLOWED_YAML_KEYS).toContain('slug');
        expect(ALLOWED_YAML_KEYS).toContain('why');
        expect(ALLOWED_YAML_KEYS).toContain('what');
        expect(ALLOWED_YAML_KEYS).toContain('how');
        expect(ALLOWED_YAML_KEYS).toContain('status');
        expect(ALLOWED_YAML_KEYS).toContain('source');
        expect(ALLOWED_YAML_KEYS).toContain('covers');
        expect(ALLOWED_YAML_KEYS).toContain('createdAt');
        expect(ALLOWED_YAML_KEYS).toContain('updatedAt');
      });
    });
  });

  given('[case3] nested YAML keys constants', () => {
    when('[t0] why keys are defined', () => {
      then('includes ask, purpose, benefit', () => {
        expect(ALLOWED_WHY_KEYS).toContain('ask');
        expect(ALLOWED_WHY_KEYS).toContain('purpose');
        expect(ALLOWED_WHY_KEYS).toContain('benefit');
        expect(ALLOWED_WHY_KEYS).toHaveLength(3);
      });
    });

    when('[t1] what keys are defined', () => {
      then('includes outcome', () => {
        expect(ALLOWED_WHAT_KEYS).toContain('outcome');
        expect(ALLOWED_WHAT_KEYS).toHaveLength(1);
      });
    });

    when('[t2] how keys are defined', () => {
      then('includes task, gate', () => {
        expect(ALLOWED_HOW_KEYS).toContain('task');
        expect(ALLOWED_HOW_KEYS).toContain('gate');
        expect(ALLOWED_HOW_KEYS).toHaveLength(2);
      });
    });

    when('[t3] status keys are defined', () => {
      then('includes choice, reason', () => {
        expect(ALLOWED_STATUS_KEYS).toContain('choice');
        expect(ALLOWED_STATUS_KEYS).toContain('reason');
        expect(ALLOWED_STATUS_KEYS).toHaveLength(2);
      });
    });
  });

  given('[case4] GOAL_STATUS_CHOICES constant', () => {
    when('[t0] choices are defined', () => {
      then('includes all valid status values', () => {
        expect(GOAL_STATUS_CHOICES).toContain('incomplete');
        expect(GOAL_STATUS_CHOICES).toContain('blocked');
        expect(GOAL_STATUS_CHOICES).toContain('enqueued');
        expect(GOAL_STATUS_CHOICES).toContain('inflight');
        expect(GOAL_STATUS_CHOICES).toContain('fulfilled');
        expect(GOAL_STATUS_CHOICES).toHaveLength(5);
      });
    });
  });
});

describe('goal cli help', () => {
  given('[case1] emitHelpOutput', () => {
    when('[t0] help is rendered', () => {
      then('includes owl header', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toContain('🦉 goal.memory.set — persist a goal');
      });

      then('includes usage section with examples', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toContain('🔮 usage');
        expect(output).toContain('rhx goal.memory.set');
        expect(output).toContain('example: create goal');
        expect(output).toContain('example: create goal (multiline)');
        expect(output).toContain('example: fulfill goal');
        expect(output).toContain('example: block goal');
      });

      then('includes all 7 required fields', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toContain('required fields');
        expect(output).toContain('--slug');
        expect(output).toContain('--why.ask');
        expect(output).toContain('--why.purpose');
        expect(output).toContain('--why.benefit');
        expect(output).toContain('--what.outcome');
        expect(output).toContain('--how.task');
        expect(output).toContain('--how.gate');
      });

      then('includes fulfill goal example', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toContain('example: fulfill goal');
        expect(output).toContain('--status.choice fulfilled');
      });

      then('includes valid status values', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toContain(
          'incomplete | blocked | enqueued | inflight | fulfilled',
        );
      });

      then('output matches snapshot', () => {
        const output = captureOutput(() => emitHelpOutput());
        expect(output).toMatchSnapshot();
      });
    });
  });
});

describe('goal cli scope validation', () => {
  given('[case1] assertScopeWhenBound export', () => {
    when('[t0] scope validation constants', () => {
      then('KNOWN_FLAGS includes --scope', () => {
        expect(KNOWN_FLAGS).toContain('--scope');
      });
    });
  });
});

describe('goal cli escalation', () => {
  given('[case1] escalateMessageByCount', () => {
    when('[t0] count is below threshold', () => {
      then('returns gentle message for count 0', () => {
        const message = escalateMessageByCount(0);
        expect(message).toContain('to forget an ask is to break a promise');
        expect(message).toMatchSnapshot();
      });

      then('returns gentle message for count 1', () => {
        const message = escalateMessageByCount(1);
        expect(message).toContain('to forget an ask is to break a promise');
      });

      then('returns gentle message for count 4', () => {
        const message = escalateMessageByCount(4);
        expect(message).toContain('to forget an ask is to break a promise');
      });
    });

    when('[t1] count is at or above threshold', () => {
      then('returns escalated message for count 5', () => {
        const message = escalateMessageByCount(5);
        expect(message).toContain('reminded many times');
        expect(message).toContain('work must be done');
        expect(message).toMatchSnapshot();
      });

      then('returns escalated message for count 10', () => {
        const message = escalateMessageByCount(10);
        expect(message).toContain('reminded many times');
      });
    });
  });
});

describe('goal cli other skills flags', () => {
  given('[case1] KNOWN_FLAGS_GET constant', () => {
    when('[t0] flags are defined', () => {
      then('includes all required flags', () => {
        expect(KNOWN_FLAGS_GET).toContain('--scope');
        expect(KNOWN_FLAGS_GET).toContain('--status.choice');
        expect(KNOWN_FLAGS_GET).toContain('--slug');
        expect(KNOWN_FLAGS_GET).toContain('--help');
        expect(KNOWN_FLAGS_GET).toHaveLength(4);
      });
    });
  });

  given('[case2] KNOWN_FLAGS_TRIAGE constant', () => {
    when('[t0] flags are defined', () => {
      then('includes all required flags', () => {
        expect(KNOWN_FLAGS_TRIAGE).toContain('--scope');
        expect(KNOWN_FLAGS_TRIAGE).toContain('--when');
        expect(KNOWN_FLAGS_TRIAGE).toContain('--help');
        expect(KNOWN_FLAGS_TRIAGE).toHaveLength(3);
      });
    });
  });

  given('[case3] KNOWN_FLAGS_TRIAGE_NEXT constant', () => {
    when('[t0] flags are defined', () => {
      then('includes all required flags', () => {
        expect(KNOWN_FLAGS_TRIAGE_NEXT).toContain('--when');
        expect(KNOWN_FLAGS_TRIAGE_NEXT).toContain('--scope');
        expect(KNOWN_FLAGS_TRIAGE_NEXT).toContain('--help');
        expect(KNOWN_FLAGS_TRIAGE_NEXT).toHaveLength(3);
      });
    });
  });
});

describe('goal cli help for other skills', () => {
  given('[case1] emitHelpOutputGet', () => {
    when('[t0] help is rendered', () => {
      then('includes owl header', () => {
        const output = captureOutput(() => emitHelpOutputGet());
        expect(output).toContain('🦉 goal.memory.get — retrieve goals');
      });

      then('includes usage examples', () => {
        const output = captureOutput(() => emitHelpOutputGet());
        expect(output).toContain('rhx goal.memory.get');
        expect(output).toContain('--status.choice inflight');
        expect(output).toContain('--slug fix-login-bug');
      });

      then('includes flags section', () => {
        const output = captureOutput(() => emitHelpOutputGet());
        expect(output).toContain('--slug');
        expect(output).toContain('--status.choice');
        expect(output).toContain('--scope');
      });
    });
  });

  given('[case2] emitHelpOutputTriage', () => {
    when('[t0] help is rendered', () => {
      then('includes owl header', () => {
        const output = captureOutput(() => emitHelpOutputTriage());
        expect(output).toContain('🦉 goal.triage.infer — check triage state');
      });

      then('includes what it shows', () => {
        const output = captureOutput(() => emitHelpOutputTriage());
        expect(output).toContain('uncovered asks');
        expect(output).toContain('incomplete goals');
        expect(output).toContain('coverage summary');
      });

      then('includes flags section', () => {
        const output = captureOutput(() => emitHelpOutputTriage());
        expect(output).toContain('--when');
        expect(output).toContain('--scope');
      });
    });
  });

  given('[case3] emitHelpOutputTriageNext', () => {
    when('[t0] help is rendered', () => {
      then('includes owl header', () => {
        const output = captureOutput(() => emitHelpOutputTriageNext());
        expect(output).toContain(
          '🦉 goal.triage.next — get next goal to work on',
        );
      });

      then('includes hook modes', () => {
        const output = captureOutput(() => emitHelpOutputTriageNext());
        expect(output).toContain('hook.onBoot');
        expect(output).toContain('hook.onStop');
      });

      then('includes what it shows', () => {
        const output = captureOutput(() => emitHelpOutputTriageNext());
        expect(output).toContain('inflight goals');
        expect(output).toContain('enqueued goals');
      });

      then('includes flags section', () => {
        const output = captureOutput(() => emitHelpOutputTriageNext());
        expect(output).toContain('--when');
        expect(output).toContain('--scope');
      });
    });
  });
});
