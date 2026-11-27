/**
 * .what = the text of a human message typed mid-turn, or null if the entry is not one
 * .why = a message a human sends while the assistant works never becomes a `type: "user"`
 *        entry: it lands as a `queued_command` attachment, absorbed into the turn in flight.
 *        a reader that counts only user entries reports the human as silent while they talk
 *
 * .note = `isHumanTurn` covers the turns a human opens; this covers the ones they interject.
 *         kept apart so its callers (the token report, the telepath) keep their own contract
 */
export const asQueuedHumanPromptText = (entry: {
  type?: unknown;
  attachment?: unknown;
}): string | null => {
  if (entry.type !== 'attachment') return null;
  const attachment = entry.attachment as
    | {
        type?: unknown;
        humanTurn?: unknown;
        origin?: { kind?: unknown };
        prompt?: unknown;
      }
    | undefined;
  if (attachment?.type !== 'queued_command') return null;
  const isHuman =
    attachment.humanTurn === true || attachment.origin?.kind === 'human';
  if (!isHuman || typeof attachment.prompt !== 'string') return null;
  const text = attachment.prompt.trim();
  return text || null;
};
