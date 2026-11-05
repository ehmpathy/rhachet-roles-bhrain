import { given, then, when } from 'test-fns';

import { asPromptTail } from './asPromptTail';

/**
 * .what = the tail fields a case does not turn on
 * .why = each case names only the fields its assertions read
 */
const TAIL_BASE = {
  rulesSection: '### rules/rule.forbid.x.md\nforbid x',
  refsSection: null,
  targetSectionNarrow: null,
  conversationSection: null,
};

describe('asPromptTail', () => {
  given('[case1] a partition run with targets it reads as context only', () => {
    const tail = asPromptTail({
      ...TAIL_BASE,
      targetSectionNarrow: '### src/a.ts\n...',
      targetsAsContext: ['src/types.ts'],
      conversationSection: '[REPAIR] fixed',
    });

    when('[t0] the tail is rendered', () => {
      then(
        '🔴 the context-only note trails the own target block, so the shared prefix survives',
        () => {
          expect(tail.lastIndexOf('</target>')).toBeLessThan(
            tail.indexOf('## context only'),
          );
        },
      );

      then(
        '🔴 the rubric leads the own target block, so the partitions of a lane share it',
        () => {
          expect(tail.indexOf('<rules>')).toBeLessThan(
            tail.indexOf('<target>'),
          );
          expect(tail.indexOf('<target>')).toBeLessThan(
            tail.indexOf('### src/a.ts'),
          );
        },
      );

      then(
        'each context-only target is named, and the reviewer told not to flag it',
        () => {
          expect(tail).toContain('- src/types.ts');
          expect(tail).toContain('do not raise');
        },
      );

      then(
        '🔴 the conversation leads the own target block, so the partitions of a lane share it too',
        () => {
          // the lane's conversation rides every partition byte for byte (share N); the own
          // band rides one (share 1) — breadth is the first key
          // (rule.forbid.shared-bytes-behind-narrow-bytes)
          expect(tail.indexOf('</conversation>')).toBeLessThan(
            tail.indexOf('### src/a.ts'),
          );
          expect(tail.indexOf('</rules>')).toBeLessThan(
            tail.indexOf('<conversation>'),
          );
        },
      );

      then(
        'the context-only note trails the conversation, as narrow bytes',
        () => {
          expect(tail.indexOf('</conversation>')).toBeLessThan(
            tail.indexOf('## context only'),
          );
        },
      );

      then('the tail matches the snapshot', () => {
        expect(tail).toContain(
          '## context only (ANOTHER PARTITION GRADES THESE — READ THEM, DO NOT FLAG)',
        );
        expect(tail).toContain(
          '<conversation>\n[REPAIR] fixed\n</conversation>',
        );
        expect(tail.indexOf('</conversation>')).toBeLessThan(
          tail.indexOf('## now review'),
        );
        expect(tail).toMatchSnapshot();
      });
    });
  });

  given('[case2] a whole run, no context-only targets', () => {
    when('[t0] the tail is rendered', () => {
      const tail = asPromptTail({
        ...TAIL_BASE,
        targetsAsContext: [],
      });

      then('no target block is drawn — every target rides the head', () => {
        // a block opens on a line of its own; the closer names the tag mid-line
        expect(tail).not.toContain('\n<target>\n');
      });

      then('🔴 it ends on the closer, though no conversation rides', () => {
        expect(tail.trimEnd().endsWith('then report on the target.')).toBe(
          true,
        );
        expect(tail).toContain('## now review');
      });

      then('no context-only note is drawn', () => {
        expect(tail).not.toContain('## context only');
        expect(tail).not.toContain('<conversation>');
      });

      then('no peer note is drawn', () => {
        expect(tail).not.toContain('## peer partitions');
      });

      then('the tail opens with the rubric', () => {
        expect(tail.startsWith('\n## rules')).toBe(true);
        expect(tail).toMatchSnapshot();
      });
    });
  });

  given('[case3] 🔴 a partition run whose lane has peer partitions', () => {
    when('[t0] the tail is rendered', () => {
      const tail = asPromptTail({
        ...TAIL_BASE,
        targetSectionNarrow: '### src/route/a.ts',
        targetsAsContext: [],
        partitionPeers: [
          { name: 'git', globs: ['src/git/**'] },
          { name: 'review', globs: ['src/review/**', 'blackbox/review*'] },
        ],
        conversationSection: '[REPAIR] fixed',
      });

      then('each peer is named with its globs', () => {
        expect(tail).toContain('- git: src/git/**');
        expect(tail).toContain('- review: src/review/** blackbox/review*');
      });

      then(
        'the reviewer is told a file absent from its target is no evidence of absence',
        () => {
          expect(tail).toContain(
            'a file absent from your <target> is NOT evidence that the file is absent',
          );
        },
      );

      then(
        '🔴 the reviewer is told a slice owes no quota of concerns, so a finer split does not raise the tally',
        () => {
          expect(tail).toContain(
            'a slice owes no quota of concerns. zero blockers and zero nitpicks is a valid verdict',
          );
        },
      );

      then(
        '🔴 the peer note trails the target, so the shared prefix survives',
        () => {
          expect(tail.lastIndexOf('</target>')).toBeLessThan(
            tail.indexOf('## peer partitions'),
          );
          // the peer list names the OTHER partitions, so it differs per partition — a
          // narrow block, behind the shared conversation
          expect(tail.indexOf('</conversation>')).toBeLessThan(
            tail.indexOf('## peer partitions'),
          );
        },
      );

      then('the tail matches the snapshot', () => {
        expect(tail).toContain('## peer partitions');
        expect(tail).toMatchSnapshot();
      });
    });
  });

  given('[case4] the closer names only the sections the prompt carries', () => {
    when('[t0] the rubric cites no refs', () => {
      const tail = asPromptTail({ ...TAIL_BASE });

      then(
        '🔴 it names the rules alone, never a refs section that is absent',
        () => {
          expect(tail).toContain('the rules above are the rubric.');
          expect(tail).not.toContain('rules and refs');
        },
      );
    });

    when('[t1] the rubric cites refs', () => {
      const tail = asPromptTail({ ...TAIL_BASE, refsSection: '### a.md\nref' });

      then('it names both', () => {
        expect(tail).toContain('the rules and refs above are the rubric.');
      });
    });

    when('[t2] a conversation rides', () => {
      const tail = asPromptTail({
        ...TAIL_BASE,
        conversationSection: '[REPAIR] fixed',
      });

      then('🔴 it keeps the prior layout closer, byte for byte', () => {
        // the verdict bar is content equality; this text predates the cure
        expect(tail).toContain(
          'the conversation above is CONTEXT. the <target> section above it is what you review.',
        );
        expect(tail.trimEnd().endsWith('then report on the target.')).toBe(
          true,
        );
      });
    });
  });
});
