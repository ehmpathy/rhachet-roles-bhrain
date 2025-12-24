import * as fs from 'fs/promises';
import * as path from 'path';

import type { ReviewerReflectMetrics } from '@src/domain.objects/Reviewer/ReviewerReflectMetrics';

/**
 * .what = writes execution log artifact to draft directory
 * .why = enables review of execution metrics and results
 */
export const writeLogArtifact = async (input: {
  draftDir: string;
  metrics: ReviewerReflectMetrics;
  results: {
    created: number;
    updated: number;
    appended: number;
    omitted: number;
  };
}): Promise<{ logPath: string }> => {
  // build log content
  const logContent = buildLogContent({
    metrics: input.metrics,
    results: input.results,
  });

  // write to draft directory
  const logPath = path.join(input.draftDir, 'reflect.log.md');
  await fs.writeFile(logPath, logContent, 'utf-8');

  return { logPath };
};

/**
 * .what = builds markdown content for execution log
 * .why = formats metrics and results for review
 */
const buildLogContent = (input: {
  metrics: ReviewerReflectMetrics;
  results: {
    created: number;
    updated: number;
    appended: number;
    omitted: number;
  };
}): string => {
  const sections: string[] = [];

  // header
  sections.push(`# reviewer.reflect execution log`);
  sections.push(`timestamp: ${new Date().toISOString()}`);
  sections.push('');

  // file counts
  sections.push(`## files`);
  sections.push(`- feedback files: ${input.metrics.files.feedbackCount}`);
  sections.push(`- rules proposed: ${input.metrics.files.rulesCount}`);
  sections.push('');

  // expected metrics
  sections.push(`## expected (pre-execution)`);
  sections.push(`- tokens: ${input.metrics.expected.tokens.toLocaleString()}`);
  sections.push(
    `- context window: ${input.metrics.expected.contextWindowPercent}%`,
  );
  sections.push(`- estimated cost: $${input.metrics.expected.cost.toFixed(3)}`);
  sections.push('');

  // realized metrics
  sections.push(`## realized (post-execution)`);
  sections.push('');
  sections.push(`### step 1: propose pure rules`);
  sections.push(
    `- input tokens: ${input.metrics.realized.step1.tokens.input.toLocaleString()}`,
  );
  sections.push(
    `- output tokens: ${input.metrics.realized.step1.tokens.output.toLocaleString()}`,
  );
  sections.push(
    `- cost: $${input.metrics.realized.step1.cost.total.toFixed(4)}`,
  );
  sections.push('');
  sections.push(`### step 2: blend with existing`);
  sections.push(
    `- input tokens: ${input.metrics.realized.step2.tokens.input.toLocaleString()}`,
  );
  sections.push(
    `- output tokens: ${input.metrics.realized.step2.tokens.output.toLocaleString()}`,
  );
  sections.push(
    `- cost: $${input.metrics.realized.step2.cost.total.toFixed(4)}`,
  );
  sections.push('');
  sections.push(`### total`);
  sections.push(
    `- input tokens: ${input.metrics.realized.total.tokens.input.toLocaleString()}`,
  );
  sections.push(
    `- output tokens: ${input.metrics.realized.total.tokens.output.toLocaleString()}`,
  );
  sections.push(
    `- total cost: $${input.metrics.realized.total.cost.total.toFixed(4)}`,
  );
  sections.push('');

  // results
  sections.push(`## blend results`);
  sections.push(`- created: ${input.results.created}`);
  sections.push(`- updated: ${input.results.updated}`);
  sections.push(`- appended: ${input.results.appended}`);
  sections.push(`- omitted: ${input.results.omitted}`);
  sections.push('');

  return sections.join('\n');
};
