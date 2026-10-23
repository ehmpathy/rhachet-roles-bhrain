/**
 * .what = each level member's declared slot within its level, keyed by its declared index,
 *         beside the level's size
 * .why = the emit path buffers a settled block and releases it in declared order against
 *        this roster; `total` lets the tail status line report how many are left
 *
 * .note = the slot is the member's position in the declared roster, never its settle order
 */
export const asLevelSlotByIndex = (input: {
  members: { index: number }[];
}): Map<number, { index: number; total: number }> =>
  new Map(
    input.members.map((member, slot) => [
      member.index,
      { index: slot, total: input.members.length },
    ]),
  );
