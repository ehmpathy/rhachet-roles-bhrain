import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = writes input artifacts to log directory for auditability
 * .why = enables debugging, replay, and audit of review invocations
 */
export const writeInputArtifacts = async (input: {
  logDir: string;
  args: {
    rules: string | string[];
    diffs?: string;
    paths?: string | string[];
    refs?: string | string[];
    output: string;
    mode: 'pull' | 'push';
    goal: 'exhaustive' | 'representative';
  };
  scope: {
    ruleFiles: string[];
    refFiles: string[];
    targetFiles: string[];
  };
  metrics: {
    tokenEstimate: number;
    contextWindowPercent: number;
    costEstimate: number;
  };
  prompt: string;
}): Promise<{ argsPath: string; promptPath: string }> => {
  // ensure log directory exists
  await fs.mkdir(input.logDir, { recursive: true });

  // write input.args.json
  const argsPath = path.join(input.logDir, 'input.args.json');
  const argsContent = JSON.stringify(
    {
      args: input.args,
      scope: input.scope,
      metrics: input.metrics,
    },
    null,
    2,
  );
  await fs.writeFile(argsPath, argsContent, 'utf-8');

  // write input.prompt.md
  const promptPath = path.join(input.logDir, 'input.prompt.md');
  await fs.writeFile(promptPath, input.prompt, 'utf-8');

  return { argsPath, promptPath };
};
