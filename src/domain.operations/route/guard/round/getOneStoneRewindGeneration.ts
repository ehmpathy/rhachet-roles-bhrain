import { getAllPassageReportsRaw } from '../../passage/getAllPassageReportsRaw';

/**
 * .what = a stone's rewind generation — how many times it has been rewound
 * .why = the watermark a guard round checks before each write. a round reads it at its
 *        start; a rewind bumps it before it deletes aught; so a round that sees a
 *        different value at a write knows a rewind superseded it, and discards the write
 *
 * .note = derived from passage.jsonl, the route's one append-only passage ledger: the
 *         count of this stone's `rewound` rows. a rewind already appends one row per
 *         stone it clears, so the generation needs no store of its own
 *         (setStoneRewindGeneration is the one writer, under the stone's hold)
 */
export const getOneStoneRewindGeneration = async (input: {
  route: string;
  stone: string;
}): Promise<number> => {
  const reports = await getAllPassageReportsRaw({ route: input.route });
  return reports.filter(
    (report) => report.stone === input.stone && report.status === 'rewound',
  ).length;
};
