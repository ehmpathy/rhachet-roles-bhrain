import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = clamp: the lessons of #834 ship in the skeptic — the move at say (inside the basis, which cites the rule), and its five cases, each cited by the rule
 * .why = the wish names #834 as an outcome of this role; a case file dropped, or a case no longer cited by its rule, would
 *        leave the rule's claim with no worked evidence behind it, and no other suite reads these files
 */

const BRIEFS = join(__dirname, 'briefs');
const RULE = 'rule.always.question-your-first-take';
const BASIS = 'rule.always.trust-no-one-especially-not-yourself';

/** the five cases #834 names, by the slug each ships under */
const CASES = [
  'a-fix-text-for-another-seat',
  'a-claim-about-how-the-box-gets-its-code',
  'a-hand-step-the-box-could-answer',
  'a-correction-shipped-untested',
  'a-brief-filed-by-reflex',
];

describe('skepticCarriesIssue834', () => {
  given('[case1] the rule of #834 and its five cases', () => {
    when('[t0] the skeptic briefs are read', () => {
      const ruleText = readFileSync(join(BRIEFS, `${RULE}.md`), 'utf-8');

      then(
        'the rule ships with its min, and its move boots at say via the basis that cites it',
        () => {
          // the rule rides at ref; its move (counter-take, then one read) boots inside the basis rule,
          // whose `.md` and min both cite it by name, so a seat meets #834 at boot and fetches the reads per kind on demand
          expect(existsSync(join(BRIEFS, `${RULE}.md.min`))).toEqual(true);
          const boot = readFileSync(join(__dirname, 'boot.yml'), 'utf-8');
          const say = boot.slice(boot.indexOf('say:'), boot.indexOf('ref:'));
          const ref = boot.slice(boot.indexOf('ref:'), boot.indexOf('not:'));
          expect(say).toContain(`briefs/${BASIS}.md`);
          expect(ref).toContain(`briefs/${RULE}.md`);
          const basisMd = readFileSync(join(BRIEFS, `${BASIS}.md`), 'utf-8');
          const basisMin = readFileSync(
            join(BRIEFS, `${BASIS}.md.min`),
            'utf-8',
          );
          expect(basisMd).toContain(RULE);
          expect(basisMin).toContain('question-your-first-take');
        },
      );

      then('each of the five cases ships as an example file', () => {
        const absent = CASES.filter(
          (slug) => !existsSync(join(BRIEFS, `${RULE}.example=${slug}.md`)),
        );
        expect(absent).toEqual([]);
      });

      then('the rule cites each case by its slug', () => {
        const uncited = CASES.filter(
          (slug) => !ruleText.includes(`example=${slug}.md`),
        );
        expect(uncited).toEqual([]);
      });
    });
  });
});
