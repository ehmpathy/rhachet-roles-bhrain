import { formatWalkTheWay } from './formatWalkTheWay';

/**
 * .what = formats "patience, friend" challenge for self-review
 * .why = prompts clones to slow down, adopt reviewer role, and articulate findings
 */
export const formatPatienceFriend = (input: {
  stone: string;
  slug: string;
  route: string;
  index: number;
}): string => {
  const lines: string[] = [];

  // header
  lines.push(`🗿 patience, friend`);
  lines.push(`   │`);

  // pond rippled line
  lines.push(`   ├─ the pond barely rippled`);
  lines.push(`   │`);

  // be here now section (identity reframe)
  lines.push(`   ├─ be here now 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  the review is the work.`);
  lines.push(`   │  │  not a gate to pass.`);
  lines.push(`   │  │  not a step to complete.`);
  lines.push(`   │  │  the work itself.`);
  lines.push(`   │  │`);
  lines.push(`   │  │  you are not the author.`);
  lines.push(`   │  │  you are the reviewer.`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // trust the way section (implementation intentions)
  lines.push(`   ├─ trust the way 🪷`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  when you see this prompt`);
  lines.push(`   │  │    pause and articulate what you found`);
  lines.push(`   │  │`);
  lines.push(`   │  │  when you found issues`);
  lines.push(`   │  │    fix them before you continue`);
  lines.push(`   │  │`);
  lines.push(`   │  │  when you found no issues`);
  lines.push(`   │  │    articulate why it holds`);
  lines.push(`   │  │`);
  lines.push(`   │  │  when you cannot articulate either`);
  lines.push(`   │  │    you have not reviewed`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // walk the way section (articulation + drum blocks)
  lines.push(...formatWalkTheWay(input));
  lines.push(`   │`);

  // final instruction
  lines.push(`   └─ when you've truly reflected, run`);
  lines.push(
    `      └─ rhx route.stone.set --stone ${input.stone} --as promised --that ${input.slug}`,
  );

  return lines.join('\n');
};
