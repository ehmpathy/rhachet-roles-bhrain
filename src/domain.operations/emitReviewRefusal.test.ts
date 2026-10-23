import { given, then, when } from 'test-fns';

import { emitReviewRefusal } from './emitReviewRefusal';

/**
 * .what = captures every stderr line one refusal emits
 * .why = the frame is the contract: the owl header, the qualified class, the detail
 *        tree, and the blank line that closes it. a spy reads the exact bytes
 */
const asStderrOf = (input: Parameters<typeof emitReviewRefusal>[0]): string => {
  const lines: string[] = [];
  const spy = jest
    .spyOn(console, 'error')
    .mockImplementation((line: string) => {
      lines.push(line);
    });
  try {
    emitReviewRefusal(input);
  } finally {
    spy.mockRestore();
  }
  return lines.join('\n');
};

describe('emitReviewRefusal', () => {
  given('[case1] a constraint refusal', () => {
    when('[t0] it is emitted', () => {
      then(
        'the caller is named the party to act, and the block renders',
        () => {
          const stderr = asStderrOf({
            kind: 'constraint',
            headline: '--limit is not a flag "--of tree" takes',
            lines: ['   └─ fix: drop --limit'],
          });
          expect(stderr).toContain('✋ ConstraintError: --limit');
          expect(stderr).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] a malfunction refusal', () => {
    when('[t0] it is emitted', () => {
      then(
        'the system is named the party to act, and the block renders',
        () => {
          const stderr = asStderrOf({
            kind: 'malfunction',
            headline: 'prime: the prefix poke could not run — spawn EMFILE',
            lines: [],
          });
          expect(stderr).toContain(
            '💥 MalfunctionError: prime: the prefix poke could not run',
          );
          expect(stderr).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] a warn notice', () => {
    when('[t0] it is emitted', () => {
      then('no error class is worn, and the run-goes-on header leads', () => {
        const stderr = asStderrOf({
          kind: 'warn',
          headline: 'prime: skipped — the shared prefix is held by one lane',
          lines: ['   └─ reviewer: arch'],
        });
        expect(stderr).not.toContain('Error:');
        expect(stderr).toContain('🦉 heads up, the run goes on');
        expect(stderr).toMatchSnapshot();
      });
    });
  });
});
