import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { setAnnotation } from './setAnnotation';

describe('setAnnotation', () => {
  given('[case1] valid annotation', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-anno-${Date.now()}`);

    const scene = useBeforeAll(async () => {
      // create temp git repo
      fs.mkdirSync(tempDir, { recursive: true });
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@test.com"', { cwd: tempDir });
      execSync('git config user.name "Test"', { cwd: tempDir });

      // create initial commit
      fs.writeFileSync(path.join(tempDir, 'init.txt'), 'init');
      execSync('git add init.txt', { cwd: tempDir });
      execSync('git commit -m "initial"', { cwd: tempDir });

      const scope = getReflectScope({ cwd: tempDir });
      const annotation = setAnnotation({
        scope,
        text: 'detected a defect: model hallucinated api endpoint',
      });

      return { scope, annotation };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] annotation is created', () => {
      then('timestamp should be in expected format', () => {
        expect(scene.annotation.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}\.\d{6}$/,
        );
      });

      then('text should match input', () => {
        expect(scene.annotation.text).toEqual(
          'detected a defect: model hallucinated api endpoint',
        );
      });

      then('path should be under annotations dir', () => {
        expect(scene.annotation.path).toContain('/annotations/');
        expect(scene.annotation.path.endsWith('.annotation.md')).toBe(true);
      });

      then('file should be created', () => {
        expect(fs.existsSync(scene.annotation.path)).toBe(true);
      });

      then('file should contain annotation text', () => {
        const content = fs.readFileSync(scene.annotation.path, 'utf-8');
        expect(content).toContain('detected a defect');
        expect(content).toContain('model hallucinated api endpoint');
      });

      then('file should contain metadata', () => {
        const content = fs.readFileSync(scene.annotation.path, 'utf-8');
        expect(content).toContain('timestamp:');
        expect(content).toContain('branch:');
        expect(content).toContain('repo:');
      });
    });
  });

  given('[case2] empty annotation text', () => {
    when('[t0] annotation is attempted', () => {
      then('should throw BadRequestError', async () => {
        const scope = getReflectScope({ cwd: process.cwd() });
        const error = await getError(async () =>
          setAnnotation({ scope, text: '' }),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('cannot be empty');
      });

      then('should throw for whitespace-only text', async () => {
        const scope = getReflectScope({ cwd: process.cwd() });
        const error = await getError(async () =>
          setAnnotation({ scope, text: '   ' }),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('cannot be empty');
      });
    });
  });
});
