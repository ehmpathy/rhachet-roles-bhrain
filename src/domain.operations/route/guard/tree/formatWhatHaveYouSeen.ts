/**
 * .what = formats "what have you seen?" confrontation for absent articulation file
 * .why = confronts clones who promise without articulation, via zen disappointment
 */
export const formatWhatHaveYouSeen = (input: {
  articulationPath: string;
}): string => {
  const lines: string[] = [];

  // header with fallen leaf (disappointment, not anger)
  lines.push(`🍂 what have you seen?`);
  lines.push(`   ├─ ...`);
  lines.push(`   │`);

  // the articulation is absent
  lines.push(`   ├─ the articulation is absent`);
  lines.push(`   │  └─ ${input.articulationPath}`);
  lines.push(`   │`);

  // a promise without words
  lines.push(`   ├─ a promise without words`);
  lines.push(`   │  ├─ is not a promise`);
  lines.push(`   │  └─ it is a daydream`);
  lines.push(`   │`);

  // the way asks
  lines.push(`   └─ the way asks`);
  lines.push(`      ├─ write what you found`);
  lines.push(`      ├─ write what you didn't`);
  lines.push(`      └─ then return 🍵`);

  return lines.join('\n');
};
