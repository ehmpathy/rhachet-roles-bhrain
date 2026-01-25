import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { BrainRepl } from 'rhachet';
import { z } from 'zod';

import {
  DEFAULT_BRAIN,
  genContextBrainChoice,
} from '@src/_topublish/rhachet/genContextBrainChoice';
import type { ReviewerReflectMetrics } from '@src/domain.objects/Reviewer/ReviewerReflectMetrics';
import { getGitRemoteUrl } from '@src/domain.operations/git/getGitRemoteUrl';
import { createDraftDirectory } from '@src/domain.operations/reflect/createDraftDirectory';
import { computeMetricsExpected } from '@src/domain.operations/reflect/metrics/computeMetricsExpected';
import { computeMetricsRealized } from '@src/domain.operations/reflect/metrics/computeMetricsRealized';
import { writeLogArtifact } from '@src/domain.operations/reflect/metrics/writeLogArtifact';
import { compileCitationsMarkdown } from '@src/domain.operations/reflect/step1/compileCitationsMarkdown';
import { compileReflectStep1Prompt } from '@src/domain.operations/reflect/step1/compileReflectStep1Prompt';
import { compileReflectStep2Prompt } from '@src/domain.operations/reflect/step2/compileReflectStep2Prompt';
import { executeManifestOperations } from '@src/domain.operations/reflect/step2/executeManifestOperations';
import { parseManifestOperations } from '@src/domain.operations/reflect/step2/parseManifestOperations';
import { validateSourceDirectory } from '@src/domain.operations/reflect/validateSourceDirectory';
import { validateTargetDirectory } from '@src/domain.operations/reflect/validateTargetDirectory';

/**
 * .what = zod schema for step 1 response
 * .why = enables structured output from brain.choice.ask
 */
const schemaStep1Response = z.object({
  rules: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    }),
  ),
});
type Step1Response = z.infer<typeof schemaStep1Response>;

/**
 * .what = zod schema for step 2 response (manifest)
 * .why = enables structured output from brain.choice.ask via discriminated union
 * .note = each operation type has required fields enforced by schema
 */
const schemaManifestEntryOmit = z.object({
  path: z.string(),
  operation: z.literal('OMIT'),
  reason: z.string(),
});
const schemaManifestEntryCreate = z.object({
  path: z.string(),
  operation: z.literal('SET_CREATE'),
  syncPath: z.string(),
});
const schemaManifestEntryUpdate = z.object({
  path: z.string(),
  operation: z.literal('SET_UPDATE'),
  targetPath: z.string(),
  syncPath: z.string(),
});
const schemaManifestEntryAppend = z.object({
  path: z.string(),
  operation: z.literal('SET_APPEND'),
  syncPath: z.string(),
});
const schemaStep2Response = z.object({
  timestamp: z.string(),
  pureRules: z.array(
    z.discriminatedUnion('operation', [
      schemaManifestEntryOmit,
      schemaManifestEntryCreate,
      schemaManifestEntryUpdate,
      schemaManifestEntryAppend,
    ]),
  ),
});
type Step2Response = z.infer<typeof schemaStep2Response>;

/**
 * .what = result of stepReflect execution
 * .why = enables caller to inspect reflect outcome and artifacts
 */
export type StepReflectResult = {
  draft: {
    dir: string;
    pureDir: string;
    syncDir: string;
  };
  results: {
    created: number;
    updated: number;
    appended: number;
    omitted: number;
  };
  metrics: ReviewerReflectMetrics;
};

/**
 * .what = simple spinner for CLI feedback
 * .why = shows progress while operations run
 */
const withSpinner = async <T>(input: {
  message: string;
  operation: () => Promise<T>;
}): Promise<T> => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  let i = 0;

  // print title once
  console.log(input.message);

  // render only the elapsed time branch line
  const render = (frame: string) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ${frame}  `);
  };

  render(frames[0]!);
  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    render(frames[i]!);
  }, 100);

  try {
    const result = await input.operation();
    clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✓\n\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`\r   └─ elapsed: ${elapsed}s ✗\n`);
    throw error;
  }
};

/**
 * .what = extracts rules from feedback and proposes them to target
 * .why = core orchestration flow for reviewer.reflect skill
 */
export const stepReflect = async (input: {
  source: string;
  target: string;
  mode?: 'pull' | 'push';
  force?: boolean;
  brain?: string;
}): Promise<StepReflectResult> => {
  const mode = input.mode ?? 'pull';
  const force = input.force ?? false;
  const brainSlug = input.brain ?? DEFAULT_BRAIN;

  // resolve brain choice for inference
  const contextBrain = await genContextBrainChoice({ brain: brainSlug });

  // validate that pull mode is only used with brains that have tool use
  const choiceIsRepl = contextBrain.brain.choice instanceof BrainRepl;
  if (mode === 'pull' && !choiceIsRepl)
    throw new BadRequestError(
      `mode 'pull' requires a brain with tool use (BrainRepl). ` +
        `brain '${brainSlug}' is a BrainAtom without tool use. ` +
        `use mode 'push' instead, or choose a BrainRepl.`,
      { brain: brainSlug, mode },
    );

  // validate source directory and get feedback files
  const { feedbackFiles } = await validateSourceDirectory({
    source: input.source,
  });

  // validate target directory
  await validateTargetDirectory({ target: input.target, force });

  // get git remote url for citations
  const remoteUrl = getGitRemoteUrl({ cwd: input.source });
  if (!remoteUrl) {
    throw new BadRequestError(
      'source directory must be a git repository with remote origin',
      { source: input.source },
    );
  }

  // create draft directory
  const { draftDir, pureDir, syncDir } = await createDraftDirectory({
    targetDir: input.target,
  });

  // compile citations markdown
  const citationsMarkdown = compileCitationsMarkdown({
    feedbackFiles,
    cwd: input.source,
  });

  // write citations.md to draft directory
  await fs.writeFile(
    path.join(draftDir, 'citations.md'),
    citationsMarkdown,
    'utf-8',
  );

  // compile step 1 prompt
  const step1Prompt = await compileReflectStep1Prompt({
    feedbackFiles,
    citationsMarkdown,
    draftDir,
    cwd: input.source,
    mode,
  });

  // compute expected metrics
  const step2PromptResult = await compileReflectStep2Prompt({
    targetDir: input.target,
    draftDir,
    pureDir,
    mode,
  });
  const expected = computeMetricsExpected({
    step1PromptTokens: step1Prompt.tokenEstimate,
    step2PromptTokens: step2PromptResult.tokenEstimate,
  });

  // emit metrics.expected
  console.log(
    `
🔭 metrics.expected
   ├─ files
   │  └─ feedback: ${feedbackFiles.length}
   ├─ tokens
   │  ├─ estimate: ${expected.tokens.toLocaleString()}
   │  └─ context: ${expected.contextWindowPercent}%
   └─ cost
      └─ estimate: $${expected.cost.toFixed(4)}
`.trim(),
  );

  // step 1: propose pure rules
  console.log('');
  const step1Result = await withSpinner({
    message: '⛏️  step 1: propose pure rules from feedback...',
    operation: async () => {
      // invoke brain with step 1 prompt to get rules as structured JSON
      const brainOutput = await contextBrain.brain.choice.ask({
        role: {},
        prompt: step1Prompt.prompt,
        schema: { output: schemaStep1Response },
      });
      const response: Step1Response = brainOutput.output;

      // write each rule file to pureDir
      for (const rule of response.rules) {
        await fs.writeFile(
          path.join(pureDir, rule.name),
          rule.content,
          'utf-8',
        );
      }

      return {
        metrics: brainOutput.metrics,
        rulesProposed: response.rules.length,
      };
    },
  });

  // re-compile step 2 prompt with actual pure rules
  const step2PromptFinal = await compileReflectStep2Prompt({
    targetDir: input.target,
    draftDir,
    pureDir,
    mode,
  });

  // step 2: blend proposals with prior rules
  const step2Result = await withSpinner({
    message: '🪨 step 2: blend proposals with prior rules...',
    operation: async () => {
      // invoke brain with step 2 prompt to get manifest as structured JSON
      const brainOutput = await contextBrain.brain.choice.ask({
        role: {},
        prompt: step2PromptFinal.prompt,
        schema: { output: schemaStep2Response },
      });
      const response: Step2Response = brainOutput.output;

      // write manifest.json to draftDir
      const manifestContent = JSON.stringify(response, null, 2);
      const manifestPath = path.join(draftDir, 'manifest.json');
      await fs.writeFile(manifestPath, manifestContent, 'utf-8');

      return {
        metrics: brainOutput.metrics,
        manifestContent,
      };
    },
  });

  // parse manifest operations
  const manifest = parseManifestOperations({
    content: step2Result.manifestContent,
  });

  // execute manifest operations
  const blendResults = await executeManifestOperations({
    manifest,
    pureDir,
    syncDir,
    targetDir: input.target,
    log: console,
  });

  // compute realized metrics
  const realized = computeMetricsRealized({
    step1: { metrics: step1Result.metrics },
    step2: { metrics: step2Result.metrics },
  });

  // build full metrics object
  const metrics: ReviewerReflectMetrics = {
    files: {
      feedbackCount: feedbackFiles.length,
      rulesCount:
        blendResults.created + blendResults.updated + blendResults.appended,
    },
    expected,
    realized,
  };

  // write log artifact
  await writeLogArtifact({
    draftDir,
    metrics,
    results: blendResults,
  });

  // emit metrics.realized
  const totalTokens =
    realized.total.tokens.input +
    realized.total.tokens.cacheWrite +
    realized.total.tokens.cacheRead +
    realized.total.tokens.output;
  console.log(
    `
✨ metrics.realized
   ├─ tokens
   │  ├─ input: ${realized.total.tokens.input.toLocaleString()}
   │  ├─ output: ${realized.total.tokens.output.toLocaleString()}
   │  └─ total: ${totalTokens.toLocaleString()}
   ├─ cost
   │  └─ total: ${realized.total.cost.total}
   └─ time
      └─ total: ${realized.total.time}

🌊 output
   ├─ draft: ${draftDir.startsWith(process.cwd()) ? path.relative(process.cwd(), draftDir) : draftDir}
   ├─ pure: ${pureDir.startsWith(process.cwd()) ? path.relative(process.cwd(), pureDir) : pureDir}
   └─ sync: ${syncDir.startsWith(process.cwd()) ? path.relative(process.cwd(), syncDir) : syncDir}

🪨 results
   ├─ created: ${blendResults.created}
   ├─ updated: ${blendResults.updated}
   ├─ appended: ${blendResults.appended}
   └─ omitted: ${blendResults.omitted}
`.trim(),
  );

  return {
    draft: {
      dir: draftDir,
      pureDir,
      syncDir,
    },
    results: blendResults,
    metrics,
  };
};
