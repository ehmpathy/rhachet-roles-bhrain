import { given, then, when } from 'test-fns';

import { asReviewHelpText, FLAGS_KNOWN } from './review';

/**
 * .what = clamp: the `--help` text names every flag the parser reads
 * .why = the flag contract had two hand copies — the parser allowlist and the help text —
 *        and naught held them in step, so a flag could parse while `--help` hid it
 *
 * .note = `skill` and `repo` are the outer dispatcher's own, never review's to document;
 *         `mode` is the dispatcher's too, yet review reads `--mode plan`, so help names it
 */
const FLAGS_UNDOCUMENTED = new Set(['skill', 'repo']);

describe('asReviewHelpText', () => {
  given('[case1] the help text and the parser allowlist', () => {
    when('[t0] each known flag is sought in the help', () => {
      then('every flag the parser reads appears as `--<flag>`', () => {
        const help = asReviewHelpText({ brainsInWords: '' });
        const flagsAbsent = [...FLAGS_KNOWN]
          .filter((flag) => !FLAGS_UNDOCUMENTED.has(flag))
          .filter((flag) => !help.includes(`--${flag}`));
        expect(flagsAbsent).toEqual([]);
      });
    });
  });
});
