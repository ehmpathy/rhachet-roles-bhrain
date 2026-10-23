/**
 * .what = the `## goal:` block of the review prompt, for one goal
 * .why = `compileReviewPrompt` reads as a chain of named acts, never a
 *        branch inside an IIFE (rule.forbid.inline-decode-friction,
 *        rule.require.narrative-flow)
 *
 * .note = the returned bytes sit in the prompt's static head, shared by every
 *         lane that declares the SAME goal — never by every lane: an
 *         `exhaustive` lane and a `representative` lane part their shared
 *         prefix here, ahead of the `## output format` block that every review
 *         shares. a byte changed here parts every lane of that goal at once
 *         (rule.require.name-the-shared-prefix-as-the-cache-anchor). do not
 *         reword either block for prose style.
 *
 * .note = the `exhaustive` branch argues its case at length on purpose: a
 *         bare "be exhaustive" measured weaker than a reason — a sample
 *         (rule.forbid.sampled-instances) hides the class and costs rounds.
 */
export const asGoalInstructions = (input: {
  goal: 'exhaustive' | 'representative';
}): string => {
  if (input.goal === 'exhaustive')
    return `## goal: exhaustive

report all the issues found, exhaustively. do not limit the number of issues. every violation of every rule should be documented. if there are many similar issues, collect their locations under one violation. be thorough and comprehensive.

FORBIDDEN: do NOT report a sample of a class. if a rule is violated in 9 places, report all 9 locations — never 3 of them. enumerate every instance you can find.

why this matters, two reasons:

1. THE FULL PICTURE MAKES BETTER DECISIONS. the driver architects the repair from what you report. 3 of 9 reads as three local edits; all 9 reveals the CLASS — and a driver who sees the class fixes the cause, generalizes the repair, and does not leave the other 6 behind. a sample hides the shape of the defect.

2. ONE ROUND IS CHEAPER AND FASTER. each review round costs the driver budget. a sample sends them to repair 3, re-arrive, and meet the same class again — three rounds to converge where one would do. report the corpus once and it converges once.

a partial report is not a smaller review; it is a review that costs more and teaches less.`;

  return `## goal: representative

report the most important or representative issues. limit yourself to up to 10 defects. for each defect, list a sample of the locations where the violation occurs. prioritize impact via severity and coverage over completeness.`;
};
