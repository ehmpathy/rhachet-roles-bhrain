import { spawn } from 'child_process';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { extractJsonFromResultText } from './extractJsonFromResultText';

/**
 * .what = usage metrics from claude invocation
 * .why = enables cost tracking and optimization
 */
export interface ReflectClaudeUsage {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
}

/**
 * .what = result from step 1 claude invocation
 * .why = contains proposed rules as structured JSON
 */
export interface ReflectStep1Response {
  rules: Array<{
    name: string;
    content: string;
  }>;
}

/**
 * .what = result from step 2 claude invocation
 * .why = contains manifest operations as JSON
 */
export interface ReflectStep2Response {
  timestamp: string;
  pureRules: Array<{
    path: string;
    operation: string;
    syncPath?: string;
    existingPath?: string;
    reason?: string;
  }>;
}

/**
 * .what = invokes claude-code cli for reflect step
 * .why = executes brain invocation via claude-code print mode
 */
export const invokeClaudeCodeForReflect = async <T>(input: {
  prompt: string;
  cwd?: string;
  rapid?: boolean;
}): Promise<{ response: T; usage: ReflectClaudeUsage }> => {
  // determine model and settings based on rapid flag
  // note: both models need enough turns to write multiple rules
  const model = input.rapid ? 'haiku' : 'sonnet';
  const maxTurns = input.rapid ? '50' : '30';

  // invoke claude-code cli via stdin to avoid E2BIG on large prompts
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '-p',
        '-',
        '--output-format',
        'json',
        '--allowedTools',
        'Write',
        '--model',
        model,
        '--max-turns',
        maxTurns,
      ],
      {
        cwd: input.cwd,
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        // check for prompt too long error
        if (stdout.includes('Prompt is too long')) {
          reject(
            new BadRequestError(
              'prompt is too long for claude context window; reduce scope',
              {
                status: code,
                hint: 'try narrowing your feedback scope',
              },
            ),
          );
          return;
        }
        reject(
          new UnexpectedCodePathError('claude-code exited with non-zero', {
            status: code,
            stdout: stdout.slice(0, 2000),
            stderr: stderr.slice(0, 2000),
          }),
        );
        return;
      }
      resolve(stdout);
    });

    // write prompt to stdin and close
    child.stdin.write(input.prompt);
    child.stdin.end();
  });

  // parse the json response from claude-code
  const claudeResponse = (() => {
    try {
      return JSON.parse(output);
    } catch {
      throw new UnexpectedCodePathError(
        'failed to parse claude-code response',
        { output: output.slice(0, 2000) },
      );
    }
  })();

  // extract the result text from claude-code response
  const resultText = (() => {
    // claude-code json output has a 'result' field with the text content
    if (claudeResponse.result && typeof claudeResponse.result === 'string') {
      return claudeResponse.result;
    }

    // fallback: look for text in message content
    if (claudeResponse.content && Array.isArray(claudeResponse.content)) {
      const textContent = claudeResponse.content.find(
        (c: { type: string }) => c.type === 'text',
      );
      if (textContent?.text) {
        return textContent.text;
      }
    }

    throw new UnexpectedCodePathError(
      'failed to extract result from response',
      {
        claudeResponse,
      },
    );
  })();

  // extract JSON from result text (may be wrapped in markdown code block or inline backticks)
  const jsonContent = extractJsonFromResultText({ resultText });

  // parse the extracted JSON
  const response = (() => {
    try {
      return JSON.parse(jsonContent) as T;
    } catch {
      throw new UnexpectedCodePathError('failed to parse JSON from result', {
        resultText: resultText.slice(0, 2000),
        jsonContent: jsonContent.slice(0, 2000),
      });
    }
  })();

  // extract usage from response
  const usage: ReflectClaudeUsage = (() => {
    if (!claudeResponse.usage)
      throw new UnexpectedCodePathError('response.usage not found', {
        claudeResponse,
      });
    return {
      input: claudeResponse.usage.input_tokens ?? 0,
      cacheWrite: claudeResponse.usage.cache_creation_input_tokens ?? 0,
      cacheRead: claudeResponse.usage.cache_read_input_tokens ?? 0,
      output: claudeResponse.usage.output_tokens ?? 0,
    };
  })();

  return { response, usage };
};
