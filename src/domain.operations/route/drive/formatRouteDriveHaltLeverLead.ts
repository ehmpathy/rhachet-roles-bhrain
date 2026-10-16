import {
  formatReviewsMeterLines,
  type GuardPeerMeterStatus,
} from '../guard/tree/formatGuardTree';

/**
 * .what = the block a route.drive halt renders between its reason and its remedies — the
 *         reviews-meter section, its spacer, and the lever-head line the remedies hang under
 * .why = the budget and the mixed halts built this block byte for byte, each with the same
 *        meter parameters, the same guarded spacer, and the same lever-head copy. hand-built in
 *        both, a reword of the spacer, the indent, or the phrase had two homes and would drift
 *        (rule.forbid.duplicate-format-tree-operations). one builder, one home — the same move
 *        `formatRouteDriveHeaderLines` made for the header above it.
 *
 * .note = `leverHead` names WHO owns the remedies below. `human` is the ordinary halt: the
 *         driver's own lever leads, and a human follows. `driver` is the concession halt,
 *         which names no human at all, so a "then ask a human" half would be false.
 *
 * .note = `leverBranch` is the halt's own tree position: `└─` where the remedies close the
 *         halt, `├─` where a passage command still follows them.
 *
 * .note = the spacer belongs to the reviews section, so it goes when the section goes.
 *         `formatReviewsMeterLines` returns [] on an empty meter set, and an unconditional
 *         spacer would strand a bare connector above the lever head (r7 nitpick.1, i016).
 */
export const formatRouteDriveHaltLeverLead = (input: {
  meters: GuardPeerMeterStatus[];
  leverHead: 'human' | 'driver';
  leverBranch: '├─' | '└─';
}): string[] => {
  // the reviews section, via the one meter formatter every halt reads
  const meterLines = formatReviewsMeterLines({
    meters: input.meters,
    baseIndent: '      ',
    sectionIndent: '│  ',
    includeHeader: true,
    headerPrefix: '├─',
  });
  const spacerLines = meterLines.length > 0 ? [`      │`] : [];

  // the lever head names who owns the remedies that hang beneath it
  const leverHeadText =
    input.leverHead === 'human'
      ? 'spend your own lever first, then ask a human'
      : 'what to do — no human needed';

  return [
    ...meterLines,
    ...spacerLines,
    `      ${input.leverBranch} ${leverHeadText}`,
  ];
};
