import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the body of a split review's merged report — one section per partition
 * .why = the guard reads ONE report per lane, and the driver answers it in ONE `.taken`
 *        (F92). each section names its partition, what it covered, and where its own report
 *        lives, so a concern is traced to the partition that raised it
 *
 * .note = concern ordinals renumber per section. a driver who absorbs a concern names it
 *         with the partition, as the section header does
 * .note = a partition that failed has no report of its own (`reviewRelative: null`); its
 *         section holds the fault instead, so the merged report keeps every partition —
 *         the ones that answered and the one that did not
 */
export const asReviewPartitionsMergedBody = (input: {
  sections: {
    name: string;
    /** the targets this partition alone carries */
    targetsCount: number;
    /** the targets it shares with another partition */
    commonCount: number;
    /** of those shared, the ones it grades — the rest it read as context only */
    commonGradedCount: number;
    reviewRelative: string | null;
    formatted: string;
  }[];
}): string =>
  input.sections
    .map((section) =>
      [
        `## partition: ${section.name}`,
        '',
        `- targets: ${asCountedNoun({ count: section.targetsCount, one: 'narrow target', many: 'narrow targets' })}${section.commonCount > 0 ? ` + ${asCountedNoun({ count: section.commonCount, one: 'common target', many: 'common targets' })} (${section.commonGradedCount} graded here, ${section.commonCount - section.commonGradedCount} read as context)` : ''}`,
        `- review: ${section.reviewRelative ?? '(none — the partition failed; see below)'}`,
        '',
        section.formatted.trim(),
        '',
      ].join('\n'),
    )
    .join('\n');
