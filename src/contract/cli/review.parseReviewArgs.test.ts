import { given, then, when } from 'test-fns';

import { parseReviewArgs } from './review';

/**
 * .what = unit test for the review CLI arg parser, focused on --conversation
 * .why = the guard expands $conversation to ONE comma-joined token; the CLI must
 *        split it back into an array of filepaths. this is the exact seam the
 *        comma-join + absolute-path fixes touch, so its contract is clamped here
 *        without an expensive end-to-end brain round-trip (r9.3)
 *
 * argv shape mirrors a real invocation: [node, entrypoint, ...flags]
 */
const asArgv = (flags: string[]): string[] => ['node', 'review.js', ...flags];

describe('parseReviewArgs', () => {
  given('[case1] a --conversation flag with a comma-joined token', () => {
    when('[t0] parsed', () => {
      then('splits the token into an array of filepaths', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--conversation',
            '.reviews/peer/a.given.by_peer.md,.reviews/peer/a.taken.by_self.md',
          ]),
        );
        expect(options.conversation).toEqual([
          '.reviews/peer/a.given.by_peer.md',
          '.reviews/peer/a.taken.by_self.md',
        ]);
      });
    });
  });

  given('[case2] a single-file --conversation token', () => {
    when('[t0] parsed', () => {
      then('yields a one-element array', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--conversation', '.reviews/peer/x.md']),
        );
        expect(options.conversation).toEqual(['.reviews/peer/x.md']);
      });
    });
  });

  given('[case3] no --conversation flag (first iteration)', () => {
    when('[t0] parsed', () => {
      then('conversation is undefined, never an empty-string array', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.conversation).toBeUndefined();
      });
    });
  });

  given('[case4] --conversation alongside --refs', () => {
    when('[t0] parsed', () => {
      then('the two flags parse into separate arrays, no collision', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--refs',
            'refs/context.md',
            '--conversation',
            '.reviews/peer/a.md,.reviews/peer/b.md',
          ]),
        );
        expect(options.refs).toEqual(['refs/context.md']);
        expect(options.conversation).toEqual([
          '.reviews/peer/a.md',
          '.reviews/peer/b.md',
        ]);
      });
    });
  });

  given('[case5] a single --optional flag', () => {
    when('[t0] parsed', () => {
      then('accumulates the supply name into an array', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--optional', 'rules']),
        );
        expect(options.optional).toEqual(['rules']);
      });
    });
  });

  given('[case6] a repeated --optional flag', () => {
    when('[t0] parsed', () => {
      then('accumulates every supply name in order', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--optional',
            'rules',
            '--optional',
            'refs',
          ]),
        );
        expect(options.optional).toEqual(['rules', 'refs']);
      });
    });
  });

  given('[case7] no --optional flag', () => {
    when('[t0] parsed', () => {
      then('optional is undefined, never an empty array', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.optional).toBeUndefined();
      });
    });
  });

  given('[case8] a bare --optional with no supply value', () => {
    when('[t0] parsed (next token is another flag)', () => {
      then(
        'optional is a present-but-empty array (so review() can fail loud)',
        () => {
          const options = parseReviewArgs(
            asArgv(['--optional', '--rules', 'r.md']),
          );
          expect(options.optional).toEqual([]);
        },
      );
    });
  });
});
