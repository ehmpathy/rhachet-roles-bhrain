import { enrollThread, genContextStitchTrail, genRoleSkill } from 'rhachet';
import { genArtifactGitFile, getArtifactObsDir } from 'rhachet-artifact-git';

import { genContextLogTrail } from '@src/.test/genContextLogTrail';
import { BrainArch1Actor } from '@src/domain.objects/BrainArch1/BrainArch1Actor';
import { genAtomAnthropic } from '@src/domain.operations/brain.replic.arch1/plugins/atoms/anthropic';
import { genAtomOpenai } from '@src/domain.operations/brain.replic.arch1/plugins/atoms/openai';
import { genAtomQwen } from '@src/domain.operations/brain.replic.arch1/plugins/atoms/qwen';
import { permissionGuardReadOnly } from '@src/domain.operations/brain.replic.arch1/plugins/permissionGuards/readOnly';
import { toolboxFiles } from '@src/domain.operations/brain.replic.arch1/plugins/toolboxes/files';

import { stepAct } from './stepAct';

/**
 * .what = skill definition for agentic task completion
 * .why = enables rhachet roles to leverage brain capabilities for autonomous task execution
 */
export const SKILL_ACT = genRoleSkill({
  slug: 'act',
  route: stepAct,
  threads: {
    lookup: {
      target: {
        source: 'process.argv',
        char: 't',
        desc: 'the target file to write the result to',
        type: 'string',
      },
      provider: {
        source: 'process.argv',
        char: 'p',
        desc: 'brain.atom.provider (anthropic, openai, qwen)',
        type: '?string',
      },
      model: {
        source: 'process.argv',
        char: 'm',
        desc: 'brain.atom.model',
        type: '?string',
      },
      system: {
        source: 'process.argv',
        char: 's',
        desc: 'path to system prompt file',
        type: '?string',
      },
    },
    assess: (
      input,
    ): input is {
      target: string;
      provider: string;
      model: string;
      system: string;
      ask: string;
    } => typeof input.target === 'string',
    instantiate: async (input: {
      target: string;
      provider: string;
      model: string;
      system: string;
      ask: string;
    }) => {
      const obsDir = getArtifactObsDir({ uri: input.target });

      // build brain actor from inputs
      const provider = (input.provider ?? 'anthropic') as
        | 'anthropic'
        | 'openai'
        | 'qwen';
      const model = input.model ?? 'claude-3-5-sonnet-latest';

      // create atom based on provider
      const atom =
        provider === 'anthropic'
          ? genAtomAnthropic({ model })
          : provider === 'openai'
            ? genAtomOpenai({ model })
            : genAtomQwen({ model });

      const actor = new BrainArch1Actor({
        atom,
        toolboxes: [toolboxFiles],
        memory: null,
        permission: permissionGuardReadOnly,
        constraints: {
          maxIterations: 100,
          maxTokens: 8192,
        },
        role: {
          systemPrompt: null,
        },
      });

      return {
        caller: await enrollThread({
          role: 'caller',
          stash: {
            ask: input.ask,
            art: {
              result: genArtifactGitFile(
                { uri: input.target },
                { versions: true },
              ),
              log: genArtifactGitFile(
                { uri: obsDir + '.log.md' },
                { versions: true },
              ),
            },
          },
        }),
        brain: await enrollThread({
          role: 'brain',
          stash: {
            actor,
            systemPromptPath: input.system ?? null,
          },
        }),
      };
    },
  },
  context: {
    lookup: {
      apiKeyAnthropic: {
        source: 'process.env',
        envar: 'ANTHROPIC_API_KEY',
        desc: 'the anthropic api key',
        type: '?string',
      },
      apiKeyOpenai: {
        source: 'process.env',
        envar: 'OPENAI_API_KEY',
        desc: 'the openai api key',
        type: '?string',
      },
      apiKeyQwen: {
        source: 'process.env',
        envar: 'QWEN_API_KEY',
        desc: 'the qwen api key',
        type: '?string',
      },
      apiKeyTavily: {
        source: 'process.env',
        envar: 'TAVILY_API_KEY',
        desc: 'the tavily api key for web search',
        type: '?string',
      },
    },
    assess: (
      input,
    ): input is {
      apiKeyAnthropic: string;
      apiKeyOpenai: string;
      apiKeyQwen: string;
      apiKeyTavily: string;
    } => true,
    instantiate: (input: {
      apiKeyAnthropic: string;
      apiKeyOpenai: string;
      apiKeyQwen: string;
      apiKeyTavily: string;
    }) => {
      return {
        creds: {
          anthropic: { apiKey: input.apiKeyAnthropic ?? '', url: null },
          openai: { apiKey: input.apiKeyOpenai ?? '', url: null },
          qwen: { apiKey: input.apiKeyQwen ?? '', url: null },
          tavily: { apiKey: input.apiKeyTavily ?? '' },
        },
        ...genContextLogTrail(),
        ...genContextStitchTrail(),
      };
    },
  },
  readme: `
# act

invokes brain.repl to complete a task

## usage

\`\`\`bash
npx rhachet skills run act -t ./output.md "your task here"
\`\`\`
  `.trim(),
});
