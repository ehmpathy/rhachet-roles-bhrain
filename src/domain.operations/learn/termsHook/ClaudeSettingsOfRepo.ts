/**
 * .what = the minimal shape of a claude code settings file that the term hook toggle reads
 * .why = settings.json has no shipped type; declare only the keys the toggle reads or writes,
 *        and carry every other key through untouched via the index signatures
 *
 * .note = the inner hook shape matches what rhachet's claude adapter writes and reads back
 *         (`{ type, command, timeout: <seconds>, author }` inside a `{ matcher, hooks }` block),
 *         so rhachet sees the toggle's entry as a peer of its own
 */
export type ClaudeHookOfRepo = {
  type?: string;
  command?: string;
  timeout?: number;
  author?: string;
  [key: string]: unknown;
};

export type ClaudeHookBlockOfRepo = {
  matcher?: string;
  hooks?: ClaudeHookOfRepo[];
  [key: string]: unknown;
};

export type ClaudeSettingsOfRepo = {
  hooks?: Record<string, ClaudeHookBlockOfRepo[]>;
  [key: string]: unknown;
};
