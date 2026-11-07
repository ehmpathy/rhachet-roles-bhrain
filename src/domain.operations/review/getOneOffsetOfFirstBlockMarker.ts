/**
 * .what = the offset of the earliest of a set of block headers at or after a cursor, or -1
 *         where none sits
 * .why = the end of the output contract, in either layout: the target opens the first
 *        block in one, the rubric in the other. the earliest one is the cut
 *
 * .note = the caller seeks from the output contract, never from the head's start — the
 *         preamble carries caller-supplied goal text, and a goal that quotes `## rules` or
 *         `## target` would otherwise capture the cut
 * .note = the markers are an input, so this file imports none: the list lives beside the
 *         headers it names (`MARKERS_OF_FIRST_BLOCK`, in `getOneHeadMarkerOffsets`)
 */
export const getOneOffsetOfFirstBlockMarker = (input: {
  text: string;
  from: number;
  markers: string[];
}): number => {
  const offsets = input.markers
    .map((marker) => input.text.indexOf(marker, input.from))
    .filter((at) => at >= 0);
  return offsets.length > 0 ? Math.min(...offsets) : -1;
};
