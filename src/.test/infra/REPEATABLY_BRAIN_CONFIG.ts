/**
 * .what = config for repeatable tests that invoke llm brains
 * .why = llm calls are probabilistic and may flake in ci; retry with 'SOME' criteria
 */
export const REPEATABLY_BRAIN_CONFIG = {
  criteria: process.env.CI ? 'SOME' : 'EVERY',
  attempts: 3,
} as const;
