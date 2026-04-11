/**
 * .what = evaluate whether a tool invocation should be blocked for direct .goals/ access
 * .why = prevents bots from bypass of goal accountability via direct file manipulation
 */

/**
 * .what = result of goal guard evaluation
 * .why = provides verdict and reason for blocked operations
 */
export interface GoalGuardVerdict {
  verdict: 'allowed' | 'blocked';
  reason?: string;
}

/**
 * .what = regex pattern to match .goals/ paths
 * .why = catches both repo-scoped (^.goals/) and route-scoped (/.goals/) paths
 *
 * pattern breakdown:
 * - (^|\/) = start of string OR preceded by /
 * - \.goals = literal ".goals"
 * - (\/|$) = followed by / OR end of string
 *
 * matches:
 * - .goals/file.yaml
 * - .goals
 * - path/to/.goals/file.yaml
 * - path/to/.goals
 *
 * does not match:
 * - .goals-archive/old.yaml (different dir name)
 * - goals/file.yaml (no initial dot)
 */
const GOALS_PATH_PATTERN = /(^|\/)\.goals(\/|$)/;

/**
 * .what = extract path from Bash command string
 * .why = Bash tool sends command, not file_path
 *
 * looks for .goals pattern in command
 */
const extractPathFromCommand = (command: string): string | null => {
  // look for .goals pattern in command
  const match = command.match(/(^|\s|["'])([^\s"']*\.goals[^\s"']*)/);
  if (match) {
    return match[2] ?? null;
  }
  return null;
};

/**
 * .what = evaluate path against .goals/ protection pattern
 * .why = determines if operation should be blocked
 */
/**
 * .what = extract path to check from tool input
 * .why = separates path extraction logic for clarity
 */
const extractPathToCheck = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): string | null => {
  // bash tool: extract from command string
  if (input.toolName === 'Bash' && input.toolInput.command) {
    return extractPathFromCommand(input.toolInput.command);
  }

  // file-based tools: use file_path directly
  if (input.toolInput.file_path) {
    return input.toolInput.file_path;
  }

  return null;
};

export const getGoalGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): GoalGuardVerdict => {
  // extract path to check
  const pathToCheck = extractPathToCheck(input);

  // if no path found, allow
  if (!pathToCheck) {
    return { verdict: 'allowed' };
  }

  // check against pattern
  if (GOALS_PATH_PATTERN.test(pathToCheck)) {
    return {
      verdict: 'blocked',
      reason: `direct access to .goals/ is forbidden: ${pathToCheck}`,
    };
  }

  return { verdict: 'allowed' };
};
