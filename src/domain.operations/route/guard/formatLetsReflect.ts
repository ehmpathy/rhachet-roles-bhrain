import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = formats warm "lets reflect" section for self-review prompts
 * .why = guides clones through explicit self-review with zen frame and mindful instructions
 */
export const formatLetsReflect = (input: {
  stone: string;
  reviewSelf: RouteStoneGuardReviewSelf;
  index: number;
  total: number;
  invalidated?: boolean;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🌕 lets reflect`);
  lines.push(`   │`);

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

  // stillness section
  lines.push(`   ├─ stillness 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(
    `   │  │  so it is. a chance to slow down, breathe, and see clearly.`,
  );
  lines.push(`   │  │`);
  lines.push(
    `   │  │  self review time is a sanctuary. a gift. a luxury not always available.`,
  );
  lines.push(`   │  │`);
  lines.push(
    `   │  │  it is not every day one has a quiet moment to take a slow,`,
  );
  lines.push(`   │  │  methodical, patient, and thorough review.`);
  lines.push(`   │  │`);
  lines.push(`   │  │  tea first. then, we proceed 🍵`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // before you begin section
  lines.push(`   ├─ before you begin 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  - clear your mind. this is dedicated review time.`);
  lines.push(`   │  │  - open each artifact mentioned in the guide`);
  lines.push(`   │  │  - read through them slowly, line by line`);
  lines.push(`   │  │  - question every assumption made`);
  lines.push(`   │  │  - look with fresh eyes, as if for the first time`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
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

  // after you finish section
  lines.push(`   ├─ after you finish 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  - did you check slowly, step by step?`);
  lines.push(`   │  │  - did you take your time, or rush through?`);
  lines.push(`   │  │  - have you been honest with yourself?`);
  lines.push(`   │  │  - if you found issues, fix them before you promise`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // promise command block
  const promiseCmd = `rhx route.stone.set --stone ${input.stone} --as promised --that ${input.reviewSelf.slug}`;
  lines.push(`   └─ promise its done? if so, run`);
  lines.push(`      └─ ${promiseCmd}`);

  return lines.join('\n');
};
