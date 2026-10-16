import type { ReviewPartitionSplit } from './getAllTargetsByPartition';

/**
 * .what = the warn a sound split may still earn — partitions that share no file
 * .why = partitions with no overlap are rarely truly independent: a test without its
 *        subject, a module without the types it imports. a warn, never a refusal, since a
 *        caller may know better (seed S44)
 */
export const asReviewPartitionWarnLines = (input: {
  split: ReviewPartitionSplit;
}): string[] =>
  input.split.common.length === 0 && input.split.partitions.length > 1
    ? [
        '🟡 no file is common to two partitions — is each one truly judged alone?',
        '   └─ a test needs its subject, a module the types it imports; add the overlap each side leans on',
        '',
      ]
    : [];
