import { spawn } from 'child_process';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = usage metrics from claude invocation
 * .why = enables cost tracking and optimization
 */
export interface ClaudeUsage {
  inputTokens: number;
  inputTokensCacheCreation: number;
  inputTokensCacheRead: number;
  outputTokens: number;
}

/**
 * .what = invokes claude-code cli with the prompt
 * .why = executes the review via the specified brain (claude-code)
 */
export const invokeClaudeCode = async (input: {
  prompt: string;
  cwd?: string;
}): Promise<{ response: object; review: string; usage: ClaudeUsage }> => {
  // invoke claude-code cli via stdin to avoid E2BIG on large prompts
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn('claude', ['-p', '-', '--output-format', 'json'], {
      cwd: input.cwd,
    });

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
              'prompt is too long for claude context window; reduce --rules or --paths scope',
              {
                status: code,
                hint: 'try narrowing your glob patterns or excluding large files',
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

  // parse the json response
  const response = (() => {
    try {
      return JSON.parse(output);
    } catch {
      throw new UnexpectedCodePathError(
        'failed to parse claude-code response',
        {
          output,
        },
      );
    }
  })();

  // extract review content from response
  const review = (() => {
    // claude-code json output has a 'result' field with the text content
    if (response.result && typeof response.result === 'string') {
      return response.result;
    }

    // fallback: look for text in message content
    if (response.content && Array.isArray(response.content)) {
      const textContent = response.content.find(
        (c: { type: string }) => c.type === 'text',
      );
      if (textContent?.text) {
        return textContent.text;
      }
    }

    throw new UnexpectedCodePathError(
      'failed to extract review from response',
      {
        response,
      },
    );
  })();

  // extract usage from response
  const usage: ClaudeUsage = (() => {
    if (!response.usage)
      throw new UnexpectedCodePathError('response.usage not found', {
        response,
      });
    return {
      inputTokens: response.usage.input_tokens ?? 0,
      inputTokensCacheCreation: response.usage.cache_creation_input_tokens ?? 0,
      inputTokensCacheRead: response.usage.cache_read_input_tokens ?? 0,
      outputTokens: response.usage.output_tokens ?? 0,
    };
  })();

  return { response, review, usage };
};
