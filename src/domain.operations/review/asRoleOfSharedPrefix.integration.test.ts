import * as path from 'path';
import { castBriefsToPrompt } from 'rhachet';
import { genArtifactGitFile } from 'rhachet-artifact-git';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { asRoleOfSharedPrefix } from './asRoleOfSharedPrefix';

/**
 * .what = the clamp on the cross-path invariant two call sites depend on and
 *         neither one's own tests can see
 *
 * .why = `stepReview` and `setOnePrefixPoke` each hand the brain a `role`,
 *        and the replica pin is `sha256(model + \0 + systemPrompt)` — a
 *        prime poke reaches the review's replica iff the two system
 *        prompts are byte-identical, so the invariant lives between the two
 *        files, where no per-file suite looks. a break is silent: the prime
 *        still succeeds, on a replica no partition reads.
 *
 * .mock = none, deliberately — the property under test is
 *         `castBriefsToPrompt`'s join behavior, reached through real
 *         artifacts on a real filesystem (rule.forbid.integration.mocks).
 *
 * .note = an integration suite rather than a unit one because
 *         `castBriefsToPrompt` resolves each brief through `artifact.get()`,
 *         a filesystem boundary in the path under test.
 */
describe('asRoleOfSharedPrefix', () => {
  const scene = useBeforeAll(async () => {
    const dir = genTempDir({ slug: 'role-of-shared-prefix' });

    const prefix = genArtifactGitFile({
      uri: path.join(dir, 'input.prompt.head.md'),
    });
    const contentOfPrefix = '# rules\n\nname the actor, then the act.\n';
    await prefix.set({ content: contentOfPrefix });

    const other = genArtifactGitFile({ uri: path.join(dir, 'persona.md') });
    const contentOfOther = '# persona\n\nyou are an owl.\n';
    await other.set({ content: contentOfOther });

    return { prefix, contentOfPrefix, other, contentOfOther };
  });

  given('[case1] a role built from one prefix artifact', () => {
    when('[t0] the brief list is read', () => {
      then('it carries EXACTLY one brief, and it is the prefix', () => {
        const role = asRoleOfSharedPrefix({ prefix: scene.prefix });
        expect(role.briefs).toHaveLength(1);
        expect(role.briefs[0]).toBe(scene.prefix);
      });
    });

    when('[t1] rhachet derives the system prompt from it', () => {
      then(
        '🔴 the system prompt is BYTE-IDENTICAL to the prefix content',
        async () => {
          // the assertion: a prime sends the same head as the review, and
          // can only reproduce the review's pin if this round-trips exactly.
          const systemPrompt = await castBriefsToPrompt(
            asRoleOfSharedPrefix({ prefix: scene.prefix }),
          );
          expect(systemPrompt).toEqual(scene.contentOfPrefix);
        },
      );
    });
  });

  given(
    '[case2] 🔴 the counterfactual — the same head beside a SECOND brief',
    () => {
      // proves the single-element shape matters, is not incidental — with
      // no row here, `[t1]` above could read as a tautology
      when('[t0] rhachet derives the system prompt from two briefs', () => {
        // one derivation, shared. the string rides in a plain object, since a
        // `useThen` proxy over a bare string would defeat the equality checks
        const derived = useThen('it derives', async () => ({
          systemPrompt: await castBriefsToPrompt({
            briefs: [scene.prefix, scene.other],
          }),
        }));

        then('🔴 it is no longer the prefix, so the pin MOVES', () => {
          expect(derived.systemPrompt).not.toEqual(scene.contentOfPrefix);
        });

        then('and the separator it joins on is the one we relied on', () => {
          // a seam clamp on the dependency: `asRoleOfSharedPrefix` cites
          // this `'\n\n'` join, so a change to it needs a re-read here too
          expect(derived.systemPrompt).toEqual(
            `${scene.contentOfPrefix}\n\n${scene.contentOfOther}`,
          );
        });
      });
    },
  );
});
