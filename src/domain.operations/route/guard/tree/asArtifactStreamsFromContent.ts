import { asArtifactStreamContent } from './asArtifactStreamContent';

/**
 * .what = the stdout and stderr streams a persisted guard artifact carries
 * .why = every reader that rebuilds an artifact from disk must split the streams one
 *        way. the cross-hash fallback once took the whole framed file as stdout and
 *        blanked stderr, so one given read two ways by which path found it
 *
 * .note = `formatTreeBucket` writes this grammar; `asArtifactStreamContent` reads one
 *         bucket of it. this names the pair, so no reader rebuilds the split by hand
 *         (rule.require.single-source-of-truth-for-render)
 */
export const asArtifactStreamsFromContent = (input: {
  content: string;
}): { stdout: string; stderr: string } => ({
  stdout: asArtifactStreamContent({ content: input.content, label: 'stdout' }),
  stderr: asArtifactStreamContent({ content: input.content, label: 'stderr' }),
});
