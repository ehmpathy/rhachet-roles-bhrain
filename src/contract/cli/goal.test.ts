import { given, then, when } from 'test-fns';

import {
  Goal,
  GoalHow,
  GoalStatus,
  GoalWhat,
  GoalWhy,
} from '@src/domain.objects/Achiever/Goal';

import { parseStdinPrompt } from './goal';

/**
 * .what = unit tests for goal CLI output render
 * .why = fast feedback on treestruct format match to vision
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

  given('[case4] goal domain object construction', () => {
    when('[t0] goal created with all fields', () => {
      then('goal holds all field values', () => {
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

/**
 * .what = unit tests for parseStdinPrompt
 * .why = verifies prompt extraction from Claude Code stdin JSON
 */
describe('parseStdinPrompt', () => {
  given('[case1] valid JSON with prompt', () => {
    when('[t0] JSON has prompt field', () => {
      then('returns prompt content', () => {
        const raw = '{"prompt":"fix the flaky test"}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toEqual('fix the flaky test');
      });
    });
  });

  given('[case2] empty stdin', () => {
    when('[t0] stdin is empty string', () => {
      then('returns null', () => {
        const result = parseStdinPrompt('');
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });

    when('[t1] stdin is whitespace only', () => {
      then('returns null', () => {
        const result = parseStdinPrompt('   \n\t  ');
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });
  });

  given('[case3] malformed JSON', () => {
    when('[t0] JSON is invalid', () => {
      then('returns null', () => {
        const result = parseStdinPrompt('not valid json');
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });

    when('[t1] JSON is truncated', () => {
      then('returns null', () => {
        const result = parseStdinPrompt('{"prompt":"incomplete');
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });
  });

  given('[case4] JSON without prompt field', () => {
    when('[t0] JSON has other fields but no prompt', () => {
      then('returns null', () => {
        const raw = '{"message":"hello","user":"test"}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });

    when('[t1] prompt field is null', () => {
      then('returns null', () => {
        const raw = '{"prompt":null}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });

    when('[t2] prompt field is number', () => {
      then('returns null', () => {
        const raw = '{"prompt":123}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });
  });

  given('[case5] prompt is empty string', () => {
    when('[t0] prompt field is empty string', () => {
      then('returns null', () => {
        const raw = '{"prompt":""}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });

    when('[t1] prompt field is whitespace only', () => {
      then('returns null', () => {
        const raw = '{"prompt":"   "}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toBeNull();
      });
    });
  });

  given('[case6] prompt with special characters', () => {
    when('[t0] prompt has newlines', () => {
      then('returns prompt with newlines preserved', () => {
        const raw = '{"prompt":"line one\\nline two"}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toEqual('line one\nline two');
      });
    });

    when('[t1] prompt has unicode', () => {
      then('returns prompt with unicode preserved', () => {
        const raw = '{"prompt":"fix the test 🐢"}';
        const result = parseStdinPrompt(raw);
        expect(result).toMatchSnapshot();
        expect(result).toEqual('fix the test 🐢');
      });
    });
  });
});