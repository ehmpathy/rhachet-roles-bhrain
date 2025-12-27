import * as fs from 'fs/promises';
import {
  asStitcherFlat,
  type GStitcher,
  genStitchRoute,
  type RoleContext,
  StitchStepCompute,
  type Threads,
} from 'rhachet';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';

import type { BrainArch1Actor } from '@src/domain.objects/BrainArch1/BrainArch1Actor';
import type { BrainArch1Context } from '@src/domain.objects/BrainArch1/BrainArch1Context';
import { invokeBrainArch1 } from '@src/domain.operations/brain.replic.arch1/core/invokeBrainArch1';

/**
 * .what = stitcher type for the act skill
 * .why = defines the input/output contract for agentic task completion
 */
export type StitcherAct = GStitcher<
  Threads<{
    caller: RoleContext<
      'caller',
      {
        ask: string;
        art: {
          result: Artifact<typeof GitFile>;
          log: Artifact<typeof GitFile>;
        };
      }
    >;
    brain: RoleContext<
      'brain',
      {
        actor: BrainArch1Actor;
        systemPromptPath: string | null;
      }
    >;
  }>,
  BrainArch1Context & GStitcher['context']
>;

/**
 * .what = step to invoke brain and persist results
 * .why = core step for agentic task completion
 */
const stepInvokeBrain = new StitchStepCompute<StitcherAct>({
  form: 'COMPUTE',
  readme: 'invokes brain.repl and persists results',
  slug: '@[brain]<act>',
  stitchee: 'brain',
  invoke: async ({ threads }, context) => {
    const { caller, brain } = threads;

    // load custom system prompt if specified
    let systemPrompt = brain.context.stash.actor.role.systemPrompt;
    if (brain.context.stash.systemPromptPath) {
      systemPrompt = await fs.readFile(
        brain.context.stash.systemPromptPath,
        'utf-8',
      );
    }

    // invoke the brain
    const result = await invokeBrainArch1(
      {
        actor: {
          ...brain.context.stash.actor,
          role: {
            ...brain.context.stash.actor.role,
            systemPrompt,
          },
        },
        userInput: caller.context.stash.ask,
      },
      context,
    );

    // write result to output artifact
    await caller.context.stash.art.result.set({
      content: result.finalResponse ?? '',
    });

    // write execution log to log artifact
    const logContent = [
      `# brain act execution log`,
      '',
      `## summary`,
      `- termination: ${result.terminationReason}`,
      `- iterations: ${result.iterationCount}`,
      `- tokens: ${result.totalTokenUsage.totalTokens}`,
      '',
      `## final response`,
      '```',
      result.finalResponse ?? '(no response)',
      '```',
      '',
      result.error ? `## error\n${result.error}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await caller.context.stash.art.log.set({ content: logContent });

    return {
      input: { ask: caller.context.stash.ask },
      output: { content: result.finalResponse ?? '' },
    };
  },
});

/**
 * .what = executes agentic task completion via brain invocation
 * .why = enables llm with tools to autonomously complete tasks
 */
export const stepAct = asStitcherFlat<StitcherAct>(
  genStitchRoute({
    slug: '@[brain]<act>',
    readme: '@[brain]<act> -> agentic task completion',
    sequence: [stepInvokeBrain],
  }),
);
