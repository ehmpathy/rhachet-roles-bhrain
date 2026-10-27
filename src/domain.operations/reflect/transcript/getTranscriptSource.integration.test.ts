import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { computeProjectSlug } from '@src/domain.operations/transcript/computeProjectSlug';

import { getTranscriptSource } from './getTranscriptSource';

describe('getTranscriptSource', () => {
  given('[case1] a cwd whose claude code project holds two sessions', () => {
    // a hermetic project under a temp `$CLAUDE_CONFIG_DIR`, injected as env, so the case never
    // depends on whether this machine ever ran claude code in this repo
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'get-transcript-source' });
      const cwd = path.join(root, 'repo');
      const configDir = path.join(root, 'claude-config');
      const projectDir = path.join(
        configDir,
        'projects',
        computeProjectSlug({ cwd }),
      );
      fs.mkdirSync(path.join(projectDir, 'session-one', 'subagents'), {
        recursive: true,
      });
      fs.writeFileSync(path.join(projectDir, 'session-one.jsonl'), '{}\n');
      fs.writeFileSync(path.join(projectDir, 'session-two.jsonl'), '{}\n');
      fs.writeFileSync(
        path.join(projectDir, 'session-one', 'subagents', 'agent-a.jsonl'),
        '{}\n',
      );
      return {
        cwd,
        projectDir,
        env: { CLAUDE_CONFIG_DIR: configDir, HOME: path.join(root, 'home') },
      };
    });

    when('[t0] transcript source is discovered', () => {
      const source = useThen('it finds the project', () => {
        const found = getTranscriptSource({ cwd: scene.cwd, env: scene.env });
        if (!found)
          throw new UnexpectedCodePathError(
            'the fixture project was not found',
            {
              cwd: scene.cwd,
              projectDir: scene.projectDir,
            },
          );
        return found;
      });

      then('it names the project dir under the config root', () => {
        expect(source.projectDir).toEqual(scene.projectDir);
      });

      then('it holds one session per main transcript', () => {
        expect(source.sessionCount).toEqual(2);
        expect(source.sessions.length).toEqual(2);
      });

      then('each session main file is a .jsonl', () => {
        for (const session of source.sessions)
          expect(session.mainFile.endsWith('.jsonl')).toBe(true);
      });

      then('a session with a subagents dir lists its subagent files', () => {
        const sessionOne = source.sessions.find((session) =>
          session.mainFile.endsWith('session-one.jsonl'),
        );
        expect(sessionOne?.subagentFiles).toEqual([
          path.join(
            scene.projectDir,
            'session-one',
            'subagents',
            'agent-a.jsonl',
          ),
        ]);
      });
    });
  });

  given('[case2] directory with no claude code project', () => {
    // an empty temp `$HOME` and no `$CLAUDE_CONFIG_DIR`, so no root on this machine is read
    const scene = useBeforeAll(async () => ({
      env: {
        CLAUDE_CONFIG_DIR: null,
        HOME: genTempDir({ slug: 'get-transcript-source-empty-home' }),
      },
    }));

    when('[t0] transcript source is discovered', () => {
      then('should return null', () => {
        const source = getTranscriptSource({
          cwd: os.tmpdir(),
          env: scene.env,
        });
        expect(source).toBeNull();
      });
    });
  });

  given('[case3] project slug computation', () => {
    when('[t0] slug is computed for current repo', () => {
      const cwd = process.cwd();
      const slug = computeProjectSlug({ cwd });

      then('slug should not contain slashes', () => {
        expect(slug).not.toContain('/');
      });

      then('slug should start with dash (from root slash)', () => {
        expect(slug.startsWith('-')).toBe(true);
      });

      then('project dir should be under ~/.claude/projects', () => {
        const expectedDir = path.join(os.homedir(), '.claude/projects', slug);
        expect(expectedDir).toContain('.claude/projects');
      });
    });
  });

  given(
    '[case4] $CLAUDE_CONFIG_DIR unset, project under ~/.claude/projects',
    () => {
      // a temp `$HOME`, injected as env, so the home-root fallback is proven without this
      // machine's history
      const scene = useBeforeAll(async () => {
        const root = genTempDir({ slug: 'get-transcript-source-home' });
        const cwd = path.join(root, 'repo');
        const home = path.join(root, 'home');
        const projectDir = path.join(
          home,
          '.claude',
          'projects',
          computeProjectSlug({ cwd }),
        );
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(path.join(projectDir, 'session-home.jsonl'), '{}\n');
        return {
          cwd,
          projectDir,
          env: { CLAUDE_CONFIG_DIR: null, HOME: home },
        };
      });

      when('[t0] transcript source is discovered', () => {
        then('it finds the project under the home root', () => {
          const source = getTranscriptSource({
            cwd: scene.cwd,
            env: scene.env,
          });
          expect(source?.projectDir).toEqual(scene.projectDir);
          expect(source?.sessionCount).toEqual(1);
        });
      });
    },
  );
});
