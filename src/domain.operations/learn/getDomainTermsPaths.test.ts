import { asIsoDateStamp } from 'iso-time';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getDomainTermsPaths } from './getDomainTermsPaths';

describe('getDomainTermsPaths', () => {
  given('[case1] the canonical paths', () => {
    when('[t0] getDomainTermsPaths is called', () => {
      const paths = getDomainTermsPaths();

      then(
        'the glossary dir is INSIDE briefs/ (the only dir the boot loader pools)',
        () => {
          // must be nested under briefs/ or no role ever boots it
          expect(paths.glossaryDir).toEqual(
            '.agent/repo=.this/role=any/briefs/domain.terms',
          );
        },
      );

      then('the readme is .readme.md inside the glossary dir', () => {
        expect(paths.readmePath).toEqual(
          '.agent/repo=.this/role=any/briefs/domain.terms/.readme.md',
        );
      });

      then('the glossary .gitignore sits inside the glossary dir', () => {
        // the leak-guard for the boot-test sentinel lives in the glossary dir it
        // protects; the scaffold findserts it (verifiable in-scope, self-heals)
        expect(paths.glossaryGitignorePath).toEqual(
          '.agent/repo=.this/role=any/briefs/domain.terms/.gitignore',
        );
      });

      then('the progress sentinel is dated — one file per day', () => {
        // path conformance is critical — the hook nudges only on this exact path.
        // the date is injected so this asserts the SHAPE without a clock chase
        const dated = getDomainTermsPaths({
          date: asIsoDateStamp('2026-08-14'),
        });
        expect(dated.progressPath).toEqual(
          '.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-08-14.md',
        );
      });

      then('the displayed pattern carries no date, so it cannot churn', () => {
        // the cli emits the PATTERN; a resolved date in emitted text would break
        // the acceptance snapshot every midnight (rule.forbid.time-assumptions)
        expect(paths.progressPathPattern).toEqual(
          '.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.$date.md',
        );
        expect(paths.progressPathPattern).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      });

      then('the resolved path defaults to today when no date is given', () => {
        // the default is the live clock, so the sweep writes today's file
        expect(paths.progressPath).toMatch(
          /\/progress\.\d{4}-\d{2}-\d{2}\.md$/,
        );
      });

      then('the sentinel sits in the cache dir, never in git', () => {
        // a dated sentinel is still ephemeral — the .gitignore guard still applies
        expect(paths.progressPath.startsWith(paths.cacheDir)).toEqual(true);
      });

      then('each rule symlink sits in the glossary dir', () => {
        // the .at is where the link lives — inside the glossary dir, so boot pools it
        for (const link of paths.ruleSymlinks) {
          expect(path.dirname(link.at)).toEqual(paths.glossaryDir);
        }
      });

      then(
        'each symlink target lands on the same brief at the install-managed location (hop-count is correct)',
        () => {
          // verify the INVARIANT, not the literal: the relative .to, taken from the
          // link's own dir, must land on the same-named brief at the install-managed
          // brief location (.agent/repo=bhrain/role=learner/briefs) — the portable
          // target present in every repo (a consumer has no src/). this catches a
          // wrong hop-count (a tautological string==string check would not); the real
          // end-to-end proof is the boot-reachability integration test, which follows
          // the live symlink to real content
          for (const link of paths.ruleSymlinks) {
            const landed = path.resolve(path.dirname(link.at), link.to);
            const ruleName = path.basename(link.at);
            expect(landed).toEqual(
              path.resolve('.agent/repo=bhrain/role=learner/briefs', ruleName),
            );
          }
        },
      );
    });
  });
});
