import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

/**
 * .what = formats warm "lets reflect" section for review.self prompts
 * .why = guides clones through explicit review.self with zen frame and mindful instructions
 */
export const formatLetsReflect = (input: {
  stone: string;
  slug: string;
  route: string;
  reviewSelf: RouteStoneGuardReviewSelf;
  index: number;
  total: number;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🌕 lets reflect`);
  lines.push(`   │`);

  // review.self N/M line
  lines.push(`   ├─ review.self ${input.index}/${input.total}`);
  lines.push(`   │  ├─ slug = ${input.reviewSelf.slug}`);
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

  // be here now section (identity reframe)
  lines.push(`   ├─ be here now 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  refocus.`);
  lines.push(`   │  │`);
  lines.push(`   │  │  the review is the work.`);
  lines.push(`   │  │  not a step to complete.`);
  lines.push(`   │  │  not a gate to pass.`);
  lines.push(`   │  │  not a checkbox to check.`);
  lines.push(`   │  │`);
  lines.push(`   │  │  it is the work itself.`);
  lines.push(`   │  │`);
  lines.push(`   │  │  you do not care about the stone.`);
  lines.push(`   │  │  you only care about the review.`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // articulate into section
  const articulationPath = `${input.route}/review/self/${input.stone}.${input.slug}.md`;
  lines.push(`   ├─ articulate into`);
  lines.push(`   │  └─ ${articulationPath}`);
  lines.push(`   │`);

  // final instruction
  lines.push(`   └─ when you've truly reflected, run`);
  lines.push(
    `      └─ rhx route.stone.set --stone ${input.stone} --as promised --that ${input.slug}`,
  );

  return lines.join('\n');
};
