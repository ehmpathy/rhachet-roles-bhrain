import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = acceptance test for the native `review --conversation` flag
 * .why = the built-in review skill threads the prior peer-review dialogue
 *        (.given + .taken) as its OWN labeled section — distinct from --refs —
 *        so a reviewer weighs its past critique against the driver's response.
 *        also proves the wish's "any skill" claim: $conversation is a plain glob
 *        any executable (not just review) can consume.
 *
 * .note = the LLM cases assert on the DETERMINISTIC compiled prompt that the
 *         skill logs to input.prompt.md under .log/bhrain/review (written
 *         before the brain call), NOT on the brain's nondeterministic output —
 *         so the assertions are stable regardless of what the model says.
 */

// read the most recent compiled review prompt the skill logged in the temp dir
const readLoggedPrompt = async (cwd: string): Promise<string> => {
  const logDir = path.join(cwd, '.log', 'bhrain', 'review');
  const runs = (await fs.readdir(logDir)).sort();
  const latest = runs[runs.length - 1]!;
  return fs.readFile(path.join(logDir, latest, 'input.prompt.md'), 'utf-8');
};

// seed a prior-round conversation (a .given critique + the driver's .taken)
const seedConversation = async (cwd: string): Promise<string> => {
  const convoDir = path.join(cwd, 'conversation');
  await fs.mkdir(convoDir, { recursive: true });
  await fs.writeFile(
    path.join(convoDir, 'r001._.given.by_peer.architect.md'),
    'GIVEN_MARKER: the design lacks a bounded context\n\n1 blocker\n0 nitpicks\n',
  );
  await fs.writeFile(
    path.join(convoDir, 'r001._.taken.by_self.architect.md'),
    'TAKEN_MARKER: fixed via a bounded context, see setThing.ts\n',
  );
  return convoDir;
};

describe('review.conversation.acceptance', () => {
  given('[case1] a prior conversation threaded via --conversation', () => {
    when('[t0] review runs with --conversation', () => {
      const res = useThen('invoke review with a conversation glob', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-conversation-labeled',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });
        await seedConversation(tempDir);

        const cli = await invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/clean.ts',
          conversation: 'conversation/*.by_*.md',
          output: path.join(tempDir, 'review.md'),
          focus: 'push',
          goal: 'representative',
          brain: 'fireworks/deepseek/v4-flash',
          cwd: tempDir,
        });
        const prompt = await readLoggedPrompt(tempDir);
        return { cli, prompt };
      });

      then('the compiled prompt has its own labeled conversation section', () => {
        expect(res.prompt).toContain('## prior conversation');
        expect(res.prompt).toContain('<conversation>');
      });

      then('the section carries BOTH the given critique and the taken reply', () => {
        expect(res.prompt).toContain('GIVEN_MARKER');
        expect(res.prompt).toContain('TAKEN_MARKER');
      });

      then('the conversation section is distinct from the refs block', () => {
        // --refs was not supplied, so no refs block appears; the conversation
        // rides in its own section, not folded into refs
        expect(res.prompt).not.toContain('## refs');
      });
    });
  });

  given('[case2] --conversation and --refs supplied together', () => {
    when('[t0] review runs with both flags', () => {
      const res = useThen('invoke review with conversation + refs', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-conversation-and-refs',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });
        await seedConversation(tempDir);

        const cli = await invokeReviewSkill({
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/clean.ts',
          refs: 'behavior/getWeather/criteria.blackbox.md',
          conversation: 'conversation/*.by_*.md',
          output: path.join(tempDir, 'review.md'),
          focus: 'push',
          goal: 'representative',
          brain: 'fireworks/deepseek/v4-flash',
          cwd: tempDir,
        });
        const prompt = await readLoggedPrompt(tempDir);
        return { cli, prompt };
      });

      then('the conversation section renders', () => {
        expect(res.prompt).toContain('## prior conversation');
        expect(res.prompt).toContain('GIVEN_MARKER');
      });

      then('the refs section renders separately (no merge/collision)', () => {
        // the referenced criteria file rides in the refs block, the conversation
        // in its own — two distinct sections, each intact
        expect(res.prompt).toContain('## refs');
      });
    });
  });

  given('[case3] a bespoke non-review executable consumes $conversation', () => {
    when('[t0] a plain executable reads the raw glob of filepaths', () => {
      const res = useThen('run a non-review consumer of $conversation', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-conversation-any-skill',
          clone: ASSETS_DIR,
        });
        const convoDir = await seedConversation(tempDir);

        // a bespoke reviewer that is NOT the review skill — a plain executable
        // that reads the comma-joined $conversation glob and reports what it
        // saw. proves the wish's claim that $conversation is a plain glob any
        // executable can leverage, not just the built-in review flag.
        const consumerPath = path.join(
          __dirname,
          '.test/assets/consume-conversation.sh',
        );

        const givenPath = path.join(
          convoDir,
          'r001._.given.by_peer.architect.md',
        );
        const takenPath = path.join(
          convoDir,
          'r001._.taken.by_self.architect.md',
        );
        // the guard would substitute $conversation with this comma-joined glob
        const conversation = `${givenPath},${takenPath}`;
        return execAsync(
          `bash "${consumerPath}" --conversation "${conversation}"`,
          { cwd: tempDir },
        );
      });

      then('the bespoke consumer read both conversation files', () => {
        expect(res.stdout).toContain('saw 2 files');
        expect(res.stdout).toContain('read: r001._.given.by_peer.architect.md');
        expect(res.stdout).toContain('read: r001._.taken.by_self.architect.md');
      });
    });
  });
});
