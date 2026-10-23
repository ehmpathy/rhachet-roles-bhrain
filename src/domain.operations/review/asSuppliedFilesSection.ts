/**
 * .what = renders a list of supplied files as one prompt section, or none
 *
 * .why = one named shape for rules, refs, and the conversation, rather than
 *        the same map-and-join built at each call site
 *        (rule.forbid.decode-friction-in-orchestrators). the shape matters
 *        beyond legibility: `asPromptSectionChars` reads the rendered
 *        artifact back and parts it into named inputs by these exact
 *        delimiters, so one renderer must agree with the census.
 *
 * .why = it is the supplies half of the prompt, never the subjects — rules,
 *        refs, and the conversation are material the caller hands the
 *        reviewer to judge with; targets are what it judges
 *        (define.review-ubiqlang.supplies-vs-subjects). targets carry a
 *        diff, a change kind, and a nullable body this shape cannot hold, so
 *        they route through their own renderer.
 *
 * .note = answers `null` for an empty list, never `''` — `null` means this
 *         section is absent and its tag is omitted; `''` would emit an empty
 *         tag a census counts as markup with no body. the caller that wants
 *         a string regardless coalesces at its own call site.
 */
export const asSuppliedFilesSection = (input: {
  files: Array<{ path: string; content: string }>;
}): string | null => {
  if (input.files.length === 0) return null;

  return input.files
    .map((file) => `### ${file.path}\n\n${file.content}`)
    .join('\n\n---\n\n');
};
