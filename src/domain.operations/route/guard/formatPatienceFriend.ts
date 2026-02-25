/**
 * .what = formats "patience, friend" challenge for rushed self-review
 * .why = blocks clones who promise too quickly (< 90 seconds) with zen challenge
 */
export const formatPatienceFriend = (): string => {
  const lines: string[] = [];

  // header
  lines.push(`🦉 patience, friend`);
  lines.push(`   │`);

  // pond rippled line
  lines.push(`   ├─ the pond barely rippled`);
  lines.push(`   │`);

  // truly? section
  lines.push(`   ├─ truly?`);
  lines.push(`   │  ├─`);
  lines.push(`   │  │`);
  lines.push(`   │  │  was each pebble turned?`);
  lines.push(`   │  │  each line read with care?`);
  lines.push(`   │  │`);
  lines.push(`   │  │  did stillness guide you?`);
  lines.push(`   │  │  did clarity follow?`);
  lines.push(`   │  │`);
  lines.push(`   │  └─`);
  lines.push(`   │`);

  // final line
  lines.push(`   └─ the pond awaits. in time, all is clear 🌙`);

  return lines.join('\n');
};
