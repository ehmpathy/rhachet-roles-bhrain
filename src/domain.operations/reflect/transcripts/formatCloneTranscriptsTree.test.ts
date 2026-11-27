import { given, then, when } from 'test-fns';

import { formatCloneTranscriptsTree } from './formatCloneTranscriptsTree';
import type { CloneTranscript } from './getAllCloneTranscripts';

const FORKED: CloneTranscript = {
  actor: 'hash=affc8cb5',
  configDir: '/repo/.agent/.actors/actor.via.hash=affc8cb5/brain/.claude',
  slug: '-repo',
  session: '28230521-39ee-4813-8d61-8680dbeb2a41',
  path: '/repo/.agent/.actors/actor.via.hash=affc8cb5/brain/.claude/projects/-repo/28230521-39ee-4813-8d61-8680dbeb2a41.jsonl',
  bytes: 138_412_032,
  stats: {
    entries: 38_085,
    since: '2026-11-23',
    until: '2026-11-27',
    prompts: 122,
    promptLast: {
      at: '2026-11-26',
      text: 'pave a tool to transform timestamps\ninto a form a human can read, so the logs read at a glance in every pane',
    },
  },
  fault: null,
};

const TORN: CloneTranscript = {
  ...FORKED,
  actor: 'human',
  configDir: '/home/me/.claude',
  session: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  bytes: 2048,
  stats: null,
  fault: 'EACCES: permission denied',
};

describe('formatCloneTranscriptsTree', () => {
  given(
    '[case1] a forked session and a transcript that could not be read',
    () => {
      when('[t0] rendered for this tree', () => {
        const tree = formatCloneTranscriptsTree({
          shown: [FORKED, TORN],
          hiddenBelowMinPrompts: 410,
          hiddenPastLimit: 6,
          scope: 'tree',
          minPrompts: 2,
          session: null,
        });
        then('the resume line names the actor config dir', () => {
          expect(tree).toContain(
            "resume: CLAUDE_CONFIG_DIR='/repo/.agent/.actors/actor.via.hash=affc8cb5/brain/.claude' claude --resume 28230521-39ee-4813-8d61-8680dbeb2a41",
          );
        });
        then('the last prompt is one line, cut at 80 chars', () => {
          expect(tree).toContain(
            'prompt last: 2026-11-26 · "pave a tool to transform timestamps into a form a human can read, so the logs..."',
          );
        });
        then('the fault shows in place of stats', () => {
          expect(tree).toContain('fault: EACCES: permission denied');
        });
        then('the hidden counts are named', () => {
          expect(tree).toContain(
            'hidden: 410 under 2 prompts · 6 past the limit',
          );
        });
        then('it matches the snapshot', () => {
          expect(tree).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] no session left after the filters', () => {
    when('[t0] rendered', () => {
      const tree = formatCloneTranscriptsTree({
        shown: [],
        hiddenBelowMinPrompts: 3,
        hiddenPastLimit: 0,
        scope: 'tree',
        minPrompts: 2,
        session: null,
      });
      then('it names how to widen the search', () => {
        expect(tree).toContain('no session found');
        expect(tree).toContain('widen with --all, or lower --min-prompts');
      });
      then('it matches the snapshot', () => {
        expect(tree).toMatchSnapshot();
      });
    });
  });
});
