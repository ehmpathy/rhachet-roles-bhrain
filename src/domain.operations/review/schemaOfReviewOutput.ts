import { z } from 'zod';

/**
 * .what = schema for review issue snippet
 * .why = enables code examples in review output
 */
const schemaOfReviewSnippet = z.object({
  lang: z.string(),
  code: z.string(),
});

/**
 * .what = schema for review issue
 * .why = enables structured output from brain.choice.ask
 */
const schemaOfReviewIssue = z.object({
  rule: z.string(),
  title: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
  snippet: schemaOfReviewSnippet,
});

/**
 * .what = schema for review output
 * .why = enables structured output from brain.choice.ask
 */
export const schemaOfReviewOutput = z.object({
  done: z.boolean(),
  blockers: z.array(schemaOfReviewIssue),
  nitpicks: z.array(schemaOfReviewIssue),
});
