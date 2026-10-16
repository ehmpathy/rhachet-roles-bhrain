import { given, then, when } from 'test-fns';

import { asPromptTailVariable } from './asPromptTailVariable';

describe('asPromptTailVariable', () => {
  given('[case1] a partition run with targets it reads as context only', () => {
    const tail = asPromptTailVariable({
      targetSection: '### src/types.ts\n...\n### src/a.ts\n...',
      targetsAsContext: ['src/types.ts'],
      conversationSection: '[REPAIR] fixed',
    });

    when('[t0] the tail is rendered', () => {
      then(
        '🔴 the context-only note trails the target block, so the shared prefix survives',
        () => {
          expect(tail.indexOf('</target>')).toBeLessThan(
            tail.indexOf('## context only'),
          );
          expect(tail.indexOf('<target>')).toBeLessThan(
            tail.indexOf('### src/types.ts'),
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

      then('the note sits ahead of the conversation', () => {
        expect(tail.indexOf('## context only')).toBeLessThan(
          tail.indexOf('<conversation>'),
        );
      });

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
      const tail = asPromptTailVariable({
        targetSection: '### src/a.ts',
        targetsAsContext: [],
        conversationSection: null,
      });

      then('no context-only note is drawn', () => {
        expect(tail).not.toContain('## context only');
        expect(tail).not.toContain('<conversation>');
      });

      then('no peer note is drawn', () => {
        expect(tail).not.toContain('## peer partitions');
      });

      then('the tail matches the snapshot', () => {
        expect(tail).toContain('### src/a.ts');
        expect(tail).toMatchSnapshot();
      });
    });
  });

  given('[case3] 🔴 a partition run whose lane has peer partitions', () => {
    when('[t0] the tail is rendered', () => {
      const tail = asPromptTailVariable({
        targetSection: '### src/route/a.ts',
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
          expect(tail.indexOf('</target>')).toBeLessThan(
            tail.indexOf('## peer partitions'),
          );
          expect(tail.indexOf('## peer partitions')).toBeLessThan(
            tail.indexOf('<conversation>'),
          );
        },
      );

      then('the tail matches the snapshot', () => {
        expect(tail).toContain('## peer partitions');
        expect(tail).toMatchSnapshot();
      });
    });
  });
});
