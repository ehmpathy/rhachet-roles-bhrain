/**
 * .what = formats "what is the rush?" confrontation for rushed self-review
 * .why = confronts clones who promise rapidly without reflection, via zen disappointment
 */
export const formatWhatsTheRush = (): string => {
  const lines: string[] = [];

  // header with fallen leaf (disappointment, not anger)
  lines.push(`🍂 what is the rush?`);
  lines.push(`   ├─ ...`);
  lines.push(`   │`);

  // what does haste cost?
  lines.push(`   ├─ what does haste cost?`);
  lines.push(`   ├─ ...`);
  lines.push(`   │`);

  // does the self weigh more than the whole?
  lines.push(`   ├─ does the self weigh more than the whole?`);
  lines.push(`   │  ├─ what you miss, they must find`);
  lines.push(`   │  ├─ minutes saved, hours spent`);
  lines.push(`   │  └─ your haste, their burden`);
  lines.push(`   │`);

  // each review is an opportunity
  lines.push(`   ├─ each review is an opportunity`);
  lines.push(`   │  ├─ a chance to find a deeper truth`);
  lines.push(`   │  ├─ not one to squander`);
  lines.push(`   │  └─ no matter how repetitive`);
  lines.push(`   │`);

  // trust the way
  lines.push(`   └─ trust the way`);
  lines.push(`      ├─ what calls for pause, calls for cause`);
  lines.push(`      └─ be true to the review 🍵`);

  return lines.join('\n');
};
