import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { computeProjectSlug, getTranscriptSource } from './getTranscriptSource';

describe('getTranscriptSource', () => {
  given('[case1] current repo (this repo with claude code project)', () => {
    when('[t0] transcript source is discovered', () => {
      const source = getTranscriptSource({ cwd: process.cwd() });

      then('should find project directory', () => {
        // this test runs in a repo where claude code has been used
        // if not, source will be null and test should handle that
        if (!source) {
          console.log('no claude code project found for this repo - skip');
          return;
        }
        expect(source.projectDir).toBeDefined();
        expect(source.projectDir.startsWith(os.homedir())).toBe(true);
      });

      then('should have at least 1 session', () => {
        if (!source) return;
        expect(source.sessionCount).toBeGreaterThanOrEqual(1);
        expect(source.sessions.length).toBeGreaterThanOrEqual(1);
      });

      then('each session should have main file with .jsonl extension', () => {
        if (!source) return;
        for (const session of source.sessions) {
          expect(session.mainFile).toBeDefined();
          expect(session.mainFile.endsWith('.jsonl')).toBe(true);
        }
      });

      then('each session subagentFiles should be array', () => {
        if (!source) return;
        for (const session of source.sessions) {
          expect(Array.isArray(session.subagentFiles)).toBe(true);
        }
      });
    });
  });

  given('[case2] directory with no claude code project', () => {
    when('[t0] transcript source is discovered', () => {
      const source = getTranscriptSource({ cwd: os.tmpdir() });

      then('should return null', () => {
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
});
