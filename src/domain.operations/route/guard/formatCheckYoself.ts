import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = formats check yo'self section for self-review prompts
 * .why = guides clones through explicit self-review before peer review
 */
export const formatCheckYoself = (input: {
  stone: string;
  reviewSelf: RouteStoneGuardReviewSelf;
  index: number;
  total: number;
  invalidated?: boolean;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🔍 check yo'self`);

  // review.self N/M line
  lines.push(`   ├─ review.self ${input.index}/${input.total}`);
  lines.push(`   │  ├─ slug = ${input.reviewSelf.slug}`);

  // show invalidated status if applicable
  if (input.invalidated) {
    lines.push(`   │  ├─ status = invalidated (source hash changed)`);
  }

  lines.push(`   │  ├─ question all, especially yourself`);
  lines.push(`   │  └─ see the guide below`);
  lines.push(`   │`);

  // promise command block
  const promiseCmd = `rhx route.stone.set --stone ${input.stone} --as promised --that ${input.reviewSelf.slug}`;
  lines.push(`   ├─ promise its done? if so, run`);
  lines.push(`   │  └─ ${promiseCmd}`);
  lines.push(`   │`);

  // guide content block
  lines.push(`   ├─ here's the guide`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);

  // format guide content with proper indentation
  const guideLines = input.reviewSelf.say.split('\n');
  for (const guideLine of guideLines) {
    lines.push(`   │  │  ${guideLine}`);
  }

  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // repeat promise command at bottom for easy copy
  lines.push(`   └─ promise its done? if so, run`);
  lines.push(`      └─ ${promiseCmd}`);

  return lines.join('\n');
};
