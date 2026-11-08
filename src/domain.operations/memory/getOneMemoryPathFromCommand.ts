import { BASH_CLAUDE_PATH_PATTERN } from './BASH_CLAUDE_PATH_PATTERN';
import { isNativeMemoryPath } from './isNativeMemoryPath';

/**
 * .what = get the first native-memory path a bash command names, if any
 * .why = a copy verb's target sits among its args; this names the memory one
 */
export const getOneMemoryPathFromCommand = (input: {
  command: string;
}): string | null =>
  (input.command.match(BASH_CLAUDE_PATH_PATTERN) ?? [])
    .map((token) => token.replace(/^\w+=/, '')) // `D=/…/memory` names `/…/memory`
    .find((token) => isNativeMemoryPath({ path: token })) ?? null;
