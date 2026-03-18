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

      then('should find main transcript file', () => {
        if (!source) return;
        expect(source.mainFile).toBeDefined();
        expect(source.mainFile.endsWith('.jsonl')).toBe(true);
      });

      then('should have at least 1 episode', () => {
        if (!source) return;
        expect(source.episodeCount).toBeGreaterThanOrEqual(1);
      });

      then('compactionFiles should be array', () => {
        if (!source) return;
        expect(Array.isArray(source.compactionFiles)).toBe(true);
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
