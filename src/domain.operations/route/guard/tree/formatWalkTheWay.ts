import { getSelfReviewArticulationPath } from '../review/self/getSelfReviewArticulationPath';

/**
 * .what = formats "walk the way" section with articulation path and drum blocks
 * .why = carries two peer flows (fix and articulate) with equal weight for self-review
 */
export const formatWalkTheWay = (input: {
  route: string;
  stone: string;
  slug: string;
}): string[] => {
  const articulationPath = getSelfReviewArticulationPath(input);
  const lines: string[] = [];

  // walk the way header
  lines.push(`   ├─ walk the way 🪷`);
  lines.push(`   │  │`);

  // articulate into (nested) + the declaration the driver owes back
  // .why = the path is keyed (stone, slug) — both operands the driver already holds.
  //        `--into` echoes it back, so a mismatch renders as a diff rather than an absence
  lines.push(`   │  ├─ articulate into`);
  lines.push(`   │  │  ├─ ${articulationPath}`);
  lines.push(
    `   │  │  └─ the guard looks precisely here, write exactly to this path`,
  );
  lines.push(`   │  │`);

  // for each found issue drum block
  lines.push(`   │  ├─ for each found issue 🪘`);
  lines.push(`   │  │  ├─`);
  lines.push(`   │  │  │`);
  lines.push(`   │  │  │  articulate how it was fixed`);
  lines.push(`   │  │  │  so you remember for next time`);
  lines.push(`   │  │  │`);
  lines.push(`   │  │  └─`);
  lines.push(`   │  │`);

  // for each non issue drum block
  lines.push(`   │  └─ for each non issue 🪘`);
  lines.push(`   │     ├─`);
  lines.push(`   │     │`);
  lines.push(`   │     │  articulate why it holds`);
  lines.push(`   │     │  so others can learn from it`);
  lines.push(`   │     │`);
  lines.push(`   │     └─`);

  return lines;
};
