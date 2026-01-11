import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

import type { ReviewerReflectMetrics } from '@src/domain.objects/Reviewer/ReviewerReflectMetrics';
import { getGitRemoteUrl } from '@src/domain.operations/git/getGitRemoteUrl';
import { createDraftDirectory } from '@src/domain.operations/reflect/createDraftDirectory';
import {
  invokeClaudeCodeForReflect,
  type ReflectStep1Response,
} from '@src/domain.operations/reflect/invokeClaudeCodeForReflect';
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
  mode?: 'soft' | 'hard';
  force?: boolean;
  rapid?: boolean;
}): Promise<StepReflectResult> => {
  const mode = input.mode ?? 'soft';
  const force = input.force ?? false;
  const rapid = input.rapid ?? false;

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
    rapid,
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
      // invoke claude-code with step 1 prompt
      // model writes rules directly to pureDir via Write tool
      const { response, usage } =
        await invokeClaudeCodeForReflect<ReflectStep1Response>(
          {
            prompt: step1Prompt.prompt,
            cwd: input.source,
            rapid,
          },
          { log: console },
        );

      // count rules written via readdir on pureDir
      const pureFiles = await fs.readdir(pureDir).catch(() => []);
      const rulesProposed = pureFiles.filter((f) =>
        f.startsWith('rule.'),
      ).length;

      return {
        tokens: usage,
        rulesProposed: rulesProposed || response.rules?.length || 0,
      };
    },
  });

  // re-compile step 2 prompt with actual pure rules
  const step2PromptFinal = await compileReflectStep2Prompt({
    targetDir: input.target,
    draftDir,
    pureDir,
    mode,
    rapid,
  });

  // step 2: blend proposals with prior rules
  const step2Result = await withSpinner({
    message: '🪨 step 2: blend proposals with prior rules...',
    operation: async () => {
      // invoke claude-code with step 2 prompt
      // note: model writes manifest.json directly via Write tool
      const { usage } = await invokeClaudeCodeForReflect<{ written: boolean }>(
        {
          prompt: step2PromptFinal.prompt,
          cwd: input.target,
          rapid,
        },
        { log: console },
      );

      // read the manifest written by the model
      const manifestPath = path.join(draftDir, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');

      return {
        tokens: usage,
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
    step1: { tokens: step1Result.tokens },
    step2: { tokens: step2Result.tokens },
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
  console.log(
    `
✨ metrics.realized
   ├─ tokens
   │  ├─ input: ${realized.total.tokens.input.toLocaleString()}
   │  └─ output: ${realized.total.tokens.output.toLocaleString()}
   └─ cost
      └─ total: $${realized.total.cost.total.toFixed(4)}

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
