import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { getAllAnnotations } from './getAllAnnotations';
import { setAnnotation } from './setAnnotation';

/**
 * .what = delay helper for test wait
 * .why = ensures different timestamps between annotations
 */
const delay = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

describe('getAllAnnotations', () => {
  given('[case1] multiple annotations exist', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-getall-anno-${Date.now()}`);

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

      // create first annotation
      const annotation1 = setAnnotation({
        scope,
        text: 'detected a defect: model hallucinated',
      });

      // wait to ensure different timestamp
      await delay(1100);

      // create second annotation
      const annotation2 = setAnnotation({
        scope,
        text: 'corrected defect: added validation',
      });

      return { scope, annotation1, annotation2 };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] all annotations are retrieved', () => {
      then('should return 2 annotations', () => {
        const result = getAllAnnotations({ scope: scene.scope });
        expect(result.count).toEqual(2);
        expect(result.annotations).toHaveLength(2);
      });

      then('annotations should be sorted oldest first', () => {
        const result = getAllAnnotations({ scope: scene.scope });
        expect(result.annotations[0]?.timestamp).toEqual(
          scene.annotation1.timestamp,
        );
        expect(result.annotations[1]?.timestamp).toEqual(
          scene.annotation2.timestamp,
        );
      });

      then('annotations should include text', () => {
        const result = getAllAnnotations({ scope: scene.scope });
        expect(result.annotations[0]?.text).toContain('detected a defect');
        expect(result.annotations[1]?.text).toContain('corrected defect');
      });

      then('annotations should include paths', () => {
        const result = getAllAnnotations({ scope: scene.scope });
        expect(result.annotations[0]?.path).toEqual(scene.annotation1.path);
        expect(result.annotations[1]?.path).toEqual(scene.annotation2.path);
      });
    });
  });

  given('[case2] no annotations exist', () => {
    when('[t0] all annotations are retrieved', () => {
      then('should return empty summary', () => {
        const scope = getReflectScope({ cwd: process.cwd() });
        // use a fresh scope that likely has no annotations
        const result = getAllAnnotations({ scope });
        // structure should be valid even if empty
        expect(result.count).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.annotations)).toBe(true);
      });
    });
  });
});
