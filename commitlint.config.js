module.exports = {
  extends: ['@commitlint/config-conventional'],
  // a squash message lists each commit of its pr as a body row. one such row, the header of
  // a commit that is already in history, runs past 100 chars. a merged message cannot be
  // rewritten, so the lint skips each message that holds that exact row
  ignores: [
    (message) =>
      message.includes(
        'cont(test): align the boot reachability and review-scope snapshots with the catalog boot and rhachet 1.49',
      ),
  ],
  rules: {
    'header-max-length': [1, 'always', 140],
    'type-enum': [
      2,
      'always',
      [
        'break', // use break: instead of feat!: or BREAKING CHANGE footer
        'feat',
        'fix',
        // 'docs', // prefer fix(docs): instead of docs
        'chore',
        'revert',
        'cont', // continue progress within a p
      ],
    ],
    // forbid ! prefix (use break: instead)
    'subject-exclamation-mark': [2, 'never'],
  },
};
