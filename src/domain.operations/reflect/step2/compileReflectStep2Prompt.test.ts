import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { compileReflectStep2Prompt } from './compileReflectStep2Prompt';

describe('compileReflectStep2Prompt', () => {
  const testDir = path.join(os.tmpdir(), `reflect-test-step2-${Date.now()}`);
  const draftDir = path.join(testDir, '.draft', 'v2025-01-01');
  const pureDir = path.join(draftDir, 'pure');
  const targetDir = path.join(testDir, 'target');

  beforeEach(async () => {
    await fs.mkdir(pureDir, { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('soft mode', () => {
    it('should include objective section', async () => {
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).toContain('# objective');
      expect(result.prompt).toContain('blend pure rule proposals');
    });

    it('should list existing rules from target', async () => {
      // create existing rule
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.require.tests.md'),
        'existing rule',
        'utf-8',
      );
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).toContain('# existing rules');
      expect(result.prompt).toContain('rule.require.tests.md');
    });

    it('should list pure proposals from pureDir', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.forbid.test.md'),
        'proposal',
        'utf-8',
      );
      await fs.writeFile(
        path.join(pureDir, 'rule.prefer.example.md'),
        'proposal2',
        'utf-8',
      );

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).toContain('# pure proposals');
      expect(result.prompt).toContain('rule.forbid.test.md');
      expect(result.prompt).toContain('rule.prefer.example.md');
    });

    it('should NOT include content in soft mode', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.test.md'),
        'secret content',
        'utf-8',
      );

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).not.toContain('# pure proposal content');
      expect(result.prompt).not.toContain('secret content');
    });

    it('should include JSON output format in instructions', async () => {
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).toContain('# output format');
      expect(result.prompt).toContain('"timestamp"');
      expect(result.prompt).toContain('"pureRules"');
      expect(result.prompt).toContain('SET_CREATE');
      expect(result.prompt).toContain('SET_UPDATE');
      expect(result.prompt).toContain('OMIT');
    });
  });

  describe('hard mode', () => {
    it('should include pure proposal content', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.test.md'),
        '# my rule content',
        'utf-8',
      );

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'hard',
      });

      expect(result.prompt).toContain('# pure proposal content');
      expect(result.prompt).toContain('# my rule content');
    });

    it('should include existing rule content', async () => {
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.require.tests.md'),
        '# existing rule content',
        'utf-8',
      );
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'hard',
      });

      expect(result.prompt).toContain('# existing rule content');
    });
  });

  describe('token estimation', () => {
    it('should estimate tokens based on prompt length', async () => {
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.tokenEstimate).toBeGreaterThan(0);
      expect(result.tokenEstimate).toBeLessThan(result.prompt.length);
    });
  });

  describe('empty directories', () => {
    it('should handle no existing rules', async () => {
      await fs.writeFile(path.join(pureDir, 'rule.test.md'), 'test', 'utf-8');

      const result = await compileReflectStep2Prompt({
        targetDir,
        draftDir,
        pureDir,
        mode: 'soft',
      });

      expect(result.prompt).toContain('no existing rules');
    });
  });
});
