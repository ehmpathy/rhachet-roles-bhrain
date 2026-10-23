import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = the round buckets of ONE stone — the latest — in round order
 * .why = a trend needs a series whose samples are comparable, and `byRound` is
 *        not one. its key is `${stone} i${NNN}`, so a lexicographic sort runs
 *        from the earliest stone's first round to the latest stone's last, and
 *        a trend read off its endpoints compares two different corpora.
 *
 * 🔴 measured on this tree, 2026-10-01: the cross-stone endpoints reported
 *     `input ↑ 952.6%` and `cache ↓ 35.1pp` — two red verdicts, on a tree whose
 *     within-stone series over the same corpus ran 13.7% → 44.7% cache with
 *     input down 58%. the vision stone reviews a handful of markdown files and
 *     the execution stone reviews the source tree, so an input-per-run figure
 *     that rises ten-fold between them is a change of SUBJECT, never a
 *     regression in a lever.
 *
 * .why the LATEST stone — the question a driver asks of a trend is "did my last
 *      repair move the levers", and that question is about the stone in flight.
 *      an older stone's series is settled history; it cannot be acted on.
 *
 * .note = the stone is read off the key rather than off an identity field,
 *         because a bucket is a fold over many runs and keeps no identity. the
 *         key's shape is `asRoundKey`'s, and `[case3]` pins the pair together so
 *         a change to that format cannot silently empty this series.
 */
export const getAllBucketsOfLatestStone = <
  TBucket extends { key: string },
>(input: {
  /** `byRound`, key-ordered, with any absent-identity row already dropped */
  buckets: TBucket[];
}): { stone: string | null; buckets: TBucket[] } => {
  // each bucket with the stone its key names; a key that names none is dropped
  const keyed = asBucketsKeyedByStone({ buckets: input.buckets });

  // the latest stone, then its buckets
  const stone = getOneStoneLatest({
    stones: keyed.map((entry) => entry.stone),
  });
  if (stone === null) return { stone: null, buckets: [] };
  return {
    stone,
    buckets: keyed
      .filter((entry) => entry.stone === stone)
      .map((entry) => entry.bucket),
  };
};

/**
 * .what = the stone a round key names, or null where the key names none
 * .why = the key is `${stone} i${NNN}`; a stone may hold dots and dashes, so the
 *        split is on the LAST ` i` run, never the first
 */
const asStoneOfRoundKey = (input: { key: string }): string | null => {
  const match = /^(.*) i\d+$/.exec(input.key);
  return match ? match[1]! : null;
};

/**
 * .what = each bucket paired with the stone its key names; a bucket whose key
 *         names no stone is dropped
 * .why = the stone projection has one home, so the caller reads as
 *        "keyed → latest stone → its buckets"
 */
const asBucketsKeyedByStone = <TBucket extends { key: string }>(input: {
  buckets: TBucket[];
}): { bucket: TBucket; stone: string }[] =>
  input.buckets.flatMap((bucket) => {
    const stone = asStoneOfRoundKey({ key: bucket.key });
    return stone === null ? [] : [{ bucket, stone }];
  });

/**
 * .what = the latest stone of a list, or null where the list is empty
 * .why = the latest by the same comparison the buckets were sorted by
 *        (`compareStrings`, code-unit order), so the window this picks is the one
 *        a reader sees last in the rendered axis, on every host
 */
const getOneStoneLatest = (input: { stones: string[] }): string | null =>
  input.stones.reduce<string | null>(
    (latest, candidate) =>
      latest === null || compareStrings(candidate, latest) > 0
        ? candidate
        : latest,
    null,
  );
