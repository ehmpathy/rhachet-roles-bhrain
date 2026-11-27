import type { CloneTranscript } from './getAllCloneTranscripts';

/**
 * .what = the transcripts a human asked to see, newest human prompt first, and the count
 *         each filter hid
 * .why = a repo holds hundreds of sessions, most of them one-prompt brain calls (a judge, a
 *        poke); the session a human spoke to is the one with the newest human prompt
 * .note = a transcript with a fault always shows: a read that failed is never hidden
 * .note = ties fall to the last activity, then the session id, so one input ranks one way
 */
export const asCloneTranscriptsRanked = (input: {
  transcripts: CloneTranscript[];
  minPrompts: number;
  limit: number;
}): {
  shown: CloneTranscript[];
  hiddenBelowMinPrompts: number;
  hiddenPastLimit: number;
} => {
  const kept = input.transcripts.filter(
    (transcript) =>
      transcript.fault !== null ||
      (transcript.stats?.prompts ?? 0) >= input.minPrompts,
  );
  const ranked = [...kept].sort(
    (a, b) =>
      (b.stats?.promptLast?.at ?? '').localeCompare(
        a.stats?.promptLast?.at ?? '',
      ) ||
      (b.stats?.until ?? '').localeCompare(a.stats?.until ?? '') ||
      a.session.localeCompare(b.session) ||
      a.actor.localeCompare(b.actor),
  );
  return {
    shown: ranked.slice(0, input.limit),
    hiddenBelowMinPrompts: input.transcripts.length - kept.length,
    hiddenPastLimit: Math.max(0, ranked.length - input.limit),
  };
};
