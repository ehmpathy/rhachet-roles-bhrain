import { given, then, when } from 'test-fns';

import { asCloneTranscriptsRanked } from './asCloneTranscriptsRanked';
import type { CloneTranscript } from './getAllCloneTranscripts';

/**
 * .what = one transcript row with the stats a rank reads
 */
const genTranscript = (input: {
  session: string;
  actor?: string;
  prompts: number;
  promptLastAt: string | null;
  until?: string;
  fault?: string;
}): CloneTranscript => ({
  actor: input.actor ?? 'hash=aaaa',
  configDir: '/repo/.agent/.actors/actor.via.hash=aaaa/brain/.claude',
  slug: '-repo',
  session: input.session,
  path: `/repo/${input.session}.jsonl`,
  bytes: 1024,
  stats: input.fault
    ? null
    : {
        entries: input.prompts * 2,
        since: '2026-11-01',
        until: input.until ?? input.promptLastAt ?? '2026-11-01',
        prompts: input.prompts,
        promptLast: input.promptLastAt
          ? { at: input.promptLastAt, text: 'ask' }
          : null,
      },
  fault: input.fault ?? null,
});

describe('asCloneTranscriptsRanked', () => {
  given('[case1] sessions of a fork and of one-shot brain calls', () => {
    const transcripts = [
      genTranscript({
        session: 'judge-1',
        prompts: 1,
        promptLastAt: '2026-11-04',
      }),
      genTranscript({
        session: 'older',
        prompts: 5,
        promptLastAt: '2026-11-02',
      }),
      genTranscript({
        session: 'forked',
        actor: 'hash=bbbb',
        prompts: 122,
        promptLastAt: '2026-11-05',
      }),
      genTranscript({
        session: 'forked',
        actor: 'repo=ambient',
        prompts: 27,
        promptLastAt: '2026-11-03',
        until: '2026-11-06',
      }),
    ];

    when('[t0] ranked with the default floor of 2 prompts', () => {
      const ranked = asCloneTranscriptsRanked({
        transcripts,
        minPrompts: 2,
        limit: 10,
      });
      then('the newest human prompt leads, not the newest write', () => {
        expect(ranked.shown.map((t) => `${t.session}@${t.actor}`)).toEqual([
          'forked@hash=bbbb',
          'forked@repo=ambient',
          'older@hash=aaaa',
        ]);
      });
      then('the one-shot call is hidden and counted', () => {
        expect(ranked.hiddenBelowMinPrompts).toEqual(1);
        expect(ranked.hiddenPastLimit).toEqual(0);
      });
    });

    when('[t1] ranked with a limit of 1', () => {
      const ranked = asCloneTranscriptsRanked({
        transcripts,
        minPrompts: 2,
        limit: 1,
      });
      then('it shows one and counts the rest past the limit', () => {
        expect(ranked.shown.map((t) => t.session)).toEqual(['forked']);
        expect(ranked.hiddenPastLimit).toEqual(2);
      });
    });
  });

  given('[case2] a transcript that could not be read', () => {
    const transcripts = [
      genTranscript({
        session: 'torn',
        prompts: 0,
        promptLastAt: null,
        fault: 'EACCES',
      }),
    ];
    when('[t0] ranked above its prompt count', () => {
      const ranked = asCloneTranscriptsRanked({
        transcripts,
        minPrompts: 2,
        limit: 10,
      });
      then('the fault is shown, never hidden', () => {
        expect(ranked.shown.map((t) => t.session)).toEqual(['torn']);
        expect(ranked.hiddenBelowMinPrompts).toEqual(0);
      });
    });
  });
});
