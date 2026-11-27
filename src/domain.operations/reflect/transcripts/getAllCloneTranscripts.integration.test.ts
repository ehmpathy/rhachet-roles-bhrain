import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';

import { getAllCloneTranscripts } from './getAllCloneTranscripts';

const SESSION = '28230521-39ee-4813-8d61-8680dbeb2a41';

/**
 * .what = writes a transcript of json lines under one actor's projects dir
 */
const setTranscript = (input: {
  repoRoot: string;
  actorDir: string;
  slug: string;
  session: string;
  lines: string[];
}): void => {
  const dir = path.join(
    input.repoRoot,
    '.agent',
    '.actors',
    input.actorDir,
    'brain',
    '.claude',
    'projects',
    input.slug,
  );
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${input.session}.jsonl`),
    input.lines.join('\n') + '\n',
  );
};

const asPromptLine = (input: { at: string; text: string }): string =>
  JSON.stringify({
    type: 'user',
    timestamp: input.at,
    message: { content: input.text },
  });

describe('getAllCloneTranscripts', () => {
  given('[case1] a session forked into two actors, plus another tree', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({ slug: 'reflect-on-transcripts' });
      const slug = computeProjectSlug({ cwd: repoRoot });
      setTranscript({
        repoRoot,
        actorDir: 'actor.via.repo=ambient',
        slug,
        session: SESSION,
        lines: [
          asPromptLine({
            at: '2026-11-03',
            text: 'is the vision up to date?',
          }),
        ],
      });
      setTranscript({
        repoRoot,
        actorDir: 'actor.via.hash=affc8cb5',
        slug,
        session: SESSION,
        lines: [
          asPromptLine({ at: '2026-11-01', text: 'first' }),
          '{"type":"user","timestamp":"2026-11-0', // a torn line, a write in flight
          asPromptLine({ at: '2026-11-02', text: 'pave a tool' }),
        ],
      });
      setTranscript({
        repoRoot,
        actorDir: 'actor.via.hash=affc8cb5',
        slug: '-elsewhere',
        session: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        lines: [asPromptLine({ at: '2026-11-04', text: 'other tree' })],
      });
      const home = path.join(repoRoot, '.home');
      fs.mkdirSync(home, { recursive: true });
      return { repoRoot, home };
    });

    when('[t0] read with scope tree', () => {
      then(
        'both copies of the forked session are found, each with its actor',
        async () => {
          const transcripts = await getAllCloneTranscripts({
            repoRoot: scene.repoRoot,
            cwd: scene.repoRoot,
            scope: 'tree',
            session: null,
            env: { CLAUDE_CONFIG_DIR: null, HOME: scene.home },
          });
          expect(
            transcripts
              .map(
                (t) =>
                  `${t.actor}:${t.session}:${t.stats?.prompts}:${t.stats?.promptLast?.text}`,
              )
              .sort(),
          ).toEqual([
            `hash=affc8cb5:${SESSION}:2:pave a tool`,
            `repo=ambient:${SESSION}:1:is the vision up to date?`,
          ]);
        },
      );

      then('each row names the config dir to resume it from', async () => {
        const transcripts = await getAllCloneTranscripts({
          repoRoot: scene.repoRoot,
          cwd: scene.repoRoot,
          scope: 'tree',
          session: null,
          env: { CLAUDE_CONFIG_DIR: null, HOME: scene.home },
        });
        const forked = transcripts.find((t) => t.actor === 'hash=affc8cb5');
        expect(forked?.configDir).toEqual(
          path.join(
            scene.repoRoot,
            '.agent',
            '.actors',
            'actor.via.hash=affc8cb5',
            'brain',
            '.claude',
          ),
        );
        expect(forked?.fault).toEqual(null);
      });
    });

    when('[t1] read with scope all', () => {
      then('the other tree is found too', async () => {
        const transcripts = await getAllCloneTranscripts({
          repoRoot: scene.repoRoot,
          cwd: scene.repoRoot,
          scope: 'all',
          session: null,
          env: { CLAUDE_CONFIG_DIR: null, HOME: scene.home },
        });
        expect(transcripts.map((t) => t.slug)).toContain('-elsewhere');
        expect(transcripts).toHaveLength(3);
      });
    });

    when('[t2] read for one session prefix', () => {
      then('only that session is found', async () => {
        const transcripts = await getAllCloneTranscripts({
          repoRoot: scene.repoRoot,
          cwd: scene.repoRoot,
          scope: 'all',
          session: 'eeee',
          env: { CLAUDE_CONFIG_DIR: null, HOME: scene.home },
        });
        expect(transcripts.map((t) => t.slug)).toEqual(['-elsewhere']);
      });
    });
  });
});
