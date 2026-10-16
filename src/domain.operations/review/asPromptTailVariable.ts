/**
 * .what = the prompt's variable tail — the blocks that differ between rounds
 * .why = the target leads and the conversation follows, because the
 *        conversation grows every round and so caps the shared prefix at its
 *        own end. behind it, not one byte of the target is ever cacheable —
 *        however stable that target is, and the loss widens with the
 *        conversation's growth alone, never with corpus size.
 *        `getAllTargetsByCacheStability` is what makes the lead worth it: it
 *        sorts the repaired files to the end, so the prefix runs through every
 *        untouched file before it parts (research.review-cost-and-cache).
 *
 * .note = this order trades a measured cache gain against an attention
 *         cost — the reviewer no longer reads the target last. the closer
 *         below answers that directly.
 *
 * .note = the closer is static, and it sits after a block that changes every
 *         round, so it is never cacheable — a small cost that buys back
 *         recency.
 *
 * .note = 🔴 a partition run names its context-only targets AFTER the target block, never
 *         inside it. the common targets lead every partition byte for byte so they cache
 *         once; a per-partition mark among them would part the shared prefix at the first
 *         mark. the note trails, so the prefix survives (seed S44)
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
export const asPromptTailVariable = (input: {
  targetSection: string;
  /** targets this prompt carries as context only — another partition grades them */
  targetsAsContext?: string[];
  /** the other partitions of a split — where the rest of the lane sits */
  partitionPeers?: Array<{ name: string; globs: string[] }>;
  conversationSection: string | null;
}): string => `
## target (REVIEW THIS SECTION ONLY)

<target>
${input.targetSection}
</target>
${
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
}${
  input.conversationSection
    ? `
## prior conversation (YOUR PAST CRITIQUES + THE DRIVER'S [REPAIR]/[REFUTE] RESPONSES — WEIGH BOTH ON MERIT, DO NOT FLAG)

<conversation>
${input.conversationSection}
</conversation>

## now review

the conversation above is CONTEXT. the <target> section above it is what you review.
weigh the driver's [REPAIR]/[REFUTE] responses on merit, then report on the target.
`
    : ''
}`;
