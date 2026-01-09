/**
 * .what = cli entry point for code review skill
 *
 * .why  = enables portable invocation via package import pattern
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

import { stepReview } from '@src/domain.operations/review/stepReview';
import { getCliArgs } from '@src/infra/cli/getCliArgs';

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args
    rules: z.string().optional(),
    diffs: z.string().optional(),
    paths: z.string().optional(),
    output: z.string().optional(),
    mode: z.enum(['soft', 'hard']).optional(),
    rapid: z.string().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

/**
 * .what = cli entry point for review skill
 *
 * .why  = enables portable dispatch via package import
 */
export const review = async (): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs });

  // determine output path
  const outputPath = (() => {
    if (named.output) return named.output;

    // generate default output path with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tmpDir = path.join(os.tmpdir(), 'bhrain-review');
    return path.join(tmpDir, `review-${timestamp}.md`);
  })();

  // ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // invoke stepReview with parsed args
  await stepReview({
    rules: named.rules ?? '.agent/**/rules/**/*.md',
    diffs: named.diffs as
      | 'uptil-main'
      | 'uptil-commit'
      | 'uptil-staged'
      | undefined,
    paths: named.paths,
    output: outputPath,
    mode: named.mode ?? 'soft',
  });
};
