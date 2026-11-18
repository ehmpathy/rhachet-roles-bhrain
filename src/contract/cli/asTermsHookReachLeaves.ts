/**
 * .what = the leaves that name whose stops the hook reaches, by the settings layout
 * .why = the layout decides who reads the file. on the split layout only an enrolled session
 *        passes `settings.of.repo.json` as `--settings`, so a plain `claude` session is never
 *        held; on the old layout the file is every session's project layer. a caller who
 *        enables must learn which, or a plain session's silence reads as a fault
 */
export const asTermsHookReachLeaves = (input: {
  layout: 'split' | 'old';
}): string[] => {
  if (input.layout === 'split')
    return [
      '   ├─ reaches = sessions enrolled via rhx enroll that hold the learner',
      '   ├─ plain claude = not reached; with .claude split per actor, it reads no repo settings',
    ];
  return [
    '   ├─ reaches = every claude session in this repo, while the learner is linked',
  ];
};
