import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getOneReviewScopeSettled } from '@src/domain.operations/review/getOneReviewScopeSettled';

/** the prior-round artifacts one lane's conversation glob reads, one per kind */
const PEER = '.reviews/peer/5.1.execution._.review.i003.ab12';
const CONVERSATION = {
  malfunction: {
    path: `${PEER}.r001._.given.by_peer.repo-rules.md`,
    content: `review faulted midway\n${'MALFUNCTION_BODY stack frame\n'.repeat(80)}`,
  },
  refusal: {
    path: `${PEER}.r002._.given.by_peer.repo-route.md`,
    content: `✋ ConstraintError: prompt exceeds 75% of context window\n${'REFUSAL_BODY locus row\n'.repeat(80)}`,
  },
  concern: {
    path: `${PEER}.r003._.given.by_peer.repo-briefs.md`,
    content: `### blocker.1 — CONCERN_BODY the rule is unmet\n(the tally lines were cut off)\n`,
  },
  verdict: {
    path: `${PEER}.r004._.given.by_peer.repo-terms.report.md`,
    content: `VERDICT_BODY all clear\n0 blockers\n0 nitpicks\n`,
  },
  taken: {
    path: `${PEER}.r001._.taken.by_self.repo-rules.md`,
    content: `TAKEN_BODY the review faulted; naught to answer\n`,
  },
};

/**
 * .what = the conversation a lane's prompt reads, through the real glob walk and file reads
 * .why = a prior given that holds no verdict — a malfunction, or a ConstraintError refusal, that
 *        names no concern — must ride as one line, never as its whole stdout. the unit test pins
 *        the transformer; this pins that the read path a review actually takes applies it, so a
 *        refactor that drops the wire fails here (`rule.forbid.verdictless-givens-whole-in-conversation`)
 */
describe('getOneReviewScopeSettled', () => {
  given(
    '[case1] a lane whose conversation holds every kind of prior artifact',
    () => {
      const cwd = genTempDir({ slug: 'review-scope-settled-conversation' });

      when('[t0] the scope is settled', () => {
        const settled = useThen('it reads the conversation', async () => {
          // the scope walk reads git (ignored dirs, touched-at), so the dir is a repo
          execSync('git init -q', { cwd });

          // the caller mints the run's log dir, as stepReview does
          fs.mkdirSync(path.join(cwd, '.log/run'), { recursive: true });

          // seed one rule, one target, and the prior round's artifacts
          fs.mkdirSync(path.join(cwd, 'rules'), { recursive: true });
          fs.writeFileSync(
            path.join(cwd, 'rules/rule.forbid.x.md'),
            '# rule\n',
          );
          fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
          fs.writeFileSync(path.join(cwd, 'src/a.ts'), 'export const a = 1;\n');
          fs.mkdirSync(path.join(cwd, '.reviews/peer'), { recursive: true });
          for (const entry of Object.values(CONVERSATION))
            fs.writeFileSync(path.join(cwd, entry.path), entry.content);

          // settle the scope as a review lane does
          const result = await getOneReviewScopeSettled(
            {
              review: {
                rules: 'rules/*.md',
                paths: 'src/**',
                conversation: '.reviews/peer/*',
                output: '.reviews/out.md',
                focus: 'push',
                goal: 'exhaustive',
              },
              brain: 'openrouter/deepseek/flash',
              ruleFiles: ['rules/rule.forbid.x.md'],
              logDir: path.join(cwd, '.log/run'),
              logDirRelative: '.log/run',
            },
            { cwd },
          );
          return {
            byPath: new Map(
              result.contents.conversation.map((entry) => [
                entry.path,
                entry.content,
              ]),
            ),
          };
        });

        then('every conversation file is read', () => {
          expect(settled.byPath.size).toEqual(Object.keys(CONVERSATION).length);
        });

        then(
          'a malfunction given rides as one line, its stdout omitted',
          () => {
            const content = settled.byPath.get(CONVERSATION.malfunction.path);
            expect(content).toContain('(condensed)');
            expect(content).toContain('malfunction — no verdict read');
            expect(content).not.toContain('MALFUNCTION_BODY');
            expect(content?.trim().split('\n')).toHaveLength(1);
          },
        );

        then('a refusal given rides as one line that names its cause', () => {
          const content = settled.byPath.get(CONVERSATION.refusal.path);
          expect(content).toContain(
            'refused — prompt exceeds 75% of context window',
          );
          expect(content).not.toContain('REFUSAL_BODY');
          expect(content?.trim().split('\n')).toHaveLength(1);
        });

        then('a given that names a concern rides whole, tally or not', () => {
          expect(settled.byPath.get(CONVERSATION.concern.path)).toEqual(
            CONVERSATION.concern.content,
          );
        });

        then('a given with a readable verdict rides whole', () => {
          expect(settled.byPath.get(CONVERSATION.verdict.path)).toEqual(
            CONVERSATION.verdict.content,
          );
        });

        then('a taken rides whole', () => {
          expect(settled.byPath.get(CONVERSATION.taken.path)).toEqual(
            CONVERSATION.taken.content,
          );
        });
      });
    },
  );
});
