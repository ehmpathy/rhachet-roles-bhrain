import { MARKER_OF_RULES, MARKER_OF_TARGET } from './getOneHeadMarkerOffsets';

/**
 * .what = the prompt's lane tail — the blocks a lane sends that its level's peers do not
 * .why = the head carries what every lane of a level shares, the corpus included
 *        (`asPromptHead`). what is left is the lane's own: its rubric and refs,
 *        then its conversation, then a partition's own targets, then the notes.
 *
 *        the order is by reuse breadth, then stability
 *        (rule.require.order-prompt-bytes-by-reuse-breadth). the rubric, refs, and
 *        conversation are the lane's own, so every partition of a split lane sends them
 *        byte for byte, and the partitions part only at their own targets. so a
 *        partition's own band trails all three (rule.forbid.shared-bytes-behind-narrow-bytes),
 *        and the partition prime, which carries no own band, warms all three.
 *
 *        the conversation sits last of the three, because it grows every round and so
 *        caps the cross-round prefix at its own end (research.review-cost-and-cache).
 *        ahead of the own band, it trades the band's cross-round reuse (the band now sits
 *        behind bytes that grow) for N−1 cached reads of the conversation within each
 *        round. breadth is the first key, so the trade is taken; on a whole run there is
 *        no own band, and the order is unchanged
 *
 * .note = 🔴 the reviewer does not read the target last; the closer answers that, so its
 *         final read is the instruction to review the target. the closer renders in EVERY
 *         shape — a first round with no conversation would otherwise end on the rubric,
 *         under a header that says not to flag it. two wordings, one per shape: with a
 *         conversation it names the conversation as context; without one, the rubric
 *
 * .note = the closer is static, and it sits after a block that changes every
 *         round, so it is never cacheable — a small cost that buys back
 *         recency.
 *
 * .note = 🔴 a partition's own band rides a second `<target>` block, named the rest of the
 *         target section, so the reviewer reads both blocks as the one section it reviews.
 *         one block would force a choice: hold the rubric ahead of every own byte, or hold
 *         one `<target>` tag. the cache wants the first, so the section spans two blocks
 *
 * .note = 🔴 a partition run names its context-only targets AFTER the target block, never
 *         inside it. the common targets lead every partition byte for byte so they cache
 *         once; a per-partition mark among them would part the shared prefix at the first
 *         mark. the note trails, so the prefix survives
 *
 * .note = 🔴 a partition run names its PEERS too. it sees only its own slice, so a file
 *         another partition grades is absent from its prompt — and a reviewer reads a file it
 *         cannot see as a file absent from the branch. measured 2026-10-12: four blockers of
 *         one round claimed a test was absent that a peer partition held. the peer globs are
 *         a few hundred chars, and they trail the target, past the shared prefix
 *
 * .note = 🔴 the peer note also says a slice owes no quota. a reviewer told to find concerns
 *         in a few files finds one or two almost always, and the merge sums them, so a lane's
 *         tally scaled with its partition count rather than its defects (measured 2026-10-12:
 *         one lane went from 2 to 9 blockers when the guard split it ~22 ways)
 */
export const asPromptTail = (input: {
  /** the lane's rubric, as rendered — `''` for an empty one, whose tag still renders */
  rulesSection: string;
  /** the lane's reference documents, as rendered — null where it cites none */
  refsSection: string | null;
  /** a partition's own target band — null on a whole run, whose targets all ride the head */
  targetSectionNarrow: string | null;
  /** targets this prompt carries as context only — another partition grades them */
  targetsAsContext?: string[];
  /** the other partitions of a split — where the rest of the lane sits */
  partitionPeers?: Array<{ name: string; globs: string[] }>;
  conversationSection: string | null;
}): string => `
${MARKER_OF_RULES} (FOR REFERENCE ONLY — DO NOT FLAG CONTENT FROM THIS SECTION)

<rules>
${input.rulesSection}
</rules>
${
  input.refsSection
    ? `
## refs (REFERENCE DOCUMENTS — USE FOR CONTEXT, DO NOT FLAG)

<refs>
${input.refsSection}
</refs>
`
    : ''
}${
  input.conversationSection
    ? `
## prior conversation (YOUR PAST CRITIQUES + THE DRIVER'S [REPAIR]/[REFUTE] RESPONSES — WEIGH BOTH ON MERIT, DO NOT FLAG)

<conversation>
${input.conversationSection}
</conversation>
`
    : ''
}${
  input.targetSectionNarrow !== null
    ? `
${MARKER_OF_TARGET}, continued (THE REST OF THE <target> SECTION — REVIEW IT TOO)

<target>
${input.targetSectionNarrow}
</target>
`
    : ''
}${
  input.targetsAsContext && input.targetsAsContext.length > 0
    ? `
## context only (ANOTHER PARTITION GRADES THESE — READ THEM, DO NOT FLAG)

this review is one partition of a larger scope. the targets below sit in the <target> section
above so you can judge the rest with them, but another partition reports on them. do not raise
a concern located in any of them:

${input.targetsAsContext.map((path) => `- ${path}`).join('\n')}
`
    : ''
}${
  input.partitionPeers && input.partitionPeers.length > 0
    ? `
## peer partitions (THE REST OF THIS LANE — A FILE ABSENT FROM <target> MAY LIVE IN ONE)

this review is one partition of a larger scope. the partitions below review the rest of it, in
the same round. a file absent from your <target> is NOT evidence that the file is absent from the
branch: where a peer's globs could hold it, do not report it absent, untested, or unseen.

a slice owes no quota of concerns. zero blockers and zero nitpicks is a valid verdict for a clean
slice — raise only what you would raise if this slice were the whole review.

${input.partitionPeers.map((peer) => `- ${peer.name}: ${peer.globs.join(' ')}`).join('\n')}
`
    : ''
}${asCloser({
  hasRefs: !!input.refsSection,
  hasConversation: !!input.conversationSection,
})}`;

/**
 * .what = the closer — the prompt's last read, the instruction to review the target
 * .why = the first-round closer names only the sections this prompt carries: a rubric
 *        with no refs says "the rules", never "the rules and refs", so it points at no
 *        section a reader cannot find
 * .note = 🔴 the conversation closer is the prior layout's text, byte for byte. the verdict
 *         bar is content equality (same content, new order), and that closer was content
 *         a reviewer read before the cure (`compileReviewPrompt.layout.integration.test.ts` `[case3]`).
 *         on a partition its "above it" names the head's block; the own band below says
 *         itself that it is the rest of the target section
 */
const asCloser = (input: {
  hasRefs: boolean;
  hasConversation: boolean;
}): string => {
  if (input.hasConversation)
    return `
## now review

the conversation above is CONTEXT. the <target> section above it is what you review.
weigh the driver's [REPAIR]/[REFUTE] responses on merit, then report on the target.
`;
  const rubric = input.hasRefs
    ? 'the rules and refs above are'
    : 'the rules above are';
  return `
## now review

${rubric} the rubric. the <target> section is what you review.
grade the target against the rubric, then report on the target.
`;
};
