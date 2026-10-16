import * as path from 'path';

/**
 * .what = renders the `$conversation` runtime var from a lane's conversation files
 * .why = the reviewer runs with cwd = repo root, so each path is made root-relative; the
 *        list is comma-joined so the var expands to one shell token that a consumer
 *        splits on comma (review file paths hold no comma)
 */
export const asConversationVar = (input: {
  files: string[];
  repoRoot: string;
}): string =>
  input.files.map((file) => path.relative(input.repoRoot, file)).join(',');
