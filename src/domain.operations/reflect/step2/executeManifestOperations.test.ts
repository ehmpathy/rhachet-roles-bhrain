import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';
import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { executeManifestOperations } from './executeManifestOperations';

describe('executeManifestOperations', () => {
  const testDir = path.join(os.tmpdir(), `reflect-test-exec-${Date.now()}`);
  const pureDir = path.join(testDir, 'pure');
  const syncDir = path.join(testDir, 'sync');
  const targetDir = path.join(testDir, 'target');

  const mockLog = { log: jest.fn() };

  beforeEach(async () => {
    await fs.mkdir(pureDir, { recursive: true });
    await fs.mkdir(syncDir, { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
    mockLog.log.mockClear();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('OMIT operation', () => {
    it('should log and count omitted rules', async () => {
      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.test.md',
            operation: ReviewerReflectManifestOperation.OMIT,
            reason: 'duplicate rule',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.omitted).toBe(1);
      expect(result.created).toBe(0);
      expect(mockLog.log).toHaveBeenCalledWith(expect.stringContaining('OMIT'));
    });

    // .what = clamps the edge case where a brain omits a proposal that no target rule duplicates
    // .why = the prompt allows OMIT only for an exact duplicate, and that is checkable by comparison.
    //        a live brain omitted all 7 proposals, with reasons like "create new rule", so reflect
    //        produced no rule. an OMIT with no identical target rule is created instead
    it('should create the pure rule when an OMIT has no identical target rule', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.forbid.jargon.md'),
        '# forbid jargon',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.forbid.jargon.md',
            operation: ReviewerReflectManifestOperation.OMIT,
            reason:
              'distinct topic not covered by any target rule; create new rule',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.created).toBe(1);
      expect(result.omitted).toBe(0);
      const syncContent = await fs.readFile(
        path.join(syncDir, 'practices/rule.forbid.jargon.md'),
        'utf-8',
      );
      expect(syncContent).toBe('# forbid jargon');
    });

    it('should keep the OMIT when a target rule holds identical content', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.forbid.jargon.md'),
        '# forbid jargon',
        'utf-8',
      );
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.forbid.jargon.md'),
        '# forbid jargon\n',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.forbid.jargon.md',
            operation: ReviewerReflectManifestOperation.OMIT,
            reason: 'exact duplicate',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.omitted).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  describe('SET_CREATE operation', () => {
    it('should copy pure rule to sync directory', async () => {
      // create pure rule file
      await fs.writeFile(
        path.join(pureDir, 'rule.forbid.test.md'),
        '# test rule',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.forbid.test.md',
            operation: ReviewerReflectManifestOperation.SET_CREATE,
            syncPath: 'practices/rule.forbid.test.md',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.created).toBe(1);
      const syncContent = await fs.readFile(
        path.join(syncDir, 'practices/rule.forbid.test.md'),
        'utf-8',
      );
      expect(syncContent).toBe('# test rule');
    });
  });

  describe('SET_APPEND operation', () => {
    it('should copy pure rule to sync with adapted path', async () => {
      // create pure rule file
      await fs.writeFile(
        path.join(pureDir, 'rule.prefer.example.md'),
        '# example demo',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.prefer.example.md',
            operation: ReviewerReflectManifestOperation.SET_APPEND,
            syncPath: 'practices/rule.prefer.example.[demo].md',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.appended).toBe(1);
    });
  });

  describe('SET_UPDATE operation', () => {
    it('should merge pure content with target rule', async () => {
      // create pure rule file
      await fs.writeFile(
        path.join(pureDir, 'rule.require.tests.md'),
        '## .citations\n\n- new citation',
        'utf-8',
      );

      // create target rule file
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.require.tests.md'),
        '# tldr\n\n# deets\n\n## .citations\n\n- old citation',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.require.tests.md',
            operation: ReviewerReflectManifestOperation.SET_UPDATE,
            syncPath: 'practices/rule.require.tests.md',
            targetPath: 'practices/rule.require.tests.md',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.updated).toBe(1);
      const syncContent = await fs.readFile(
        path.join(syncDir, 'practices/rule.require.tests.md'),
        'utf-8',
      );
      expect(syncContent).toContain('old citation');
      expect(syncContent).toContain('new citation');
    });

    // .what = clamps the edge case where a brain names an UPDATE target the target dir does not hold
    // .why = a live brain asks to UPDATE a rule that is absent from an empty target dir about 1 run in 12.
    //        the merge read the absent path unchecked and threw ENOENT. the pure rule is created
    //        instead, since no target exists to merge into
    it('should create the pure rule when the target rule is absent', async () => {
      await fs.writeFile(
        path.join(pureDir, 'rule.require.arrow-functions.md'),
        '# pure rule',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.require.arrow-functions.md',
            operation: ReviewerReflectManifestOperation.SET_UPDATE,
            syncPath: 'practices/rule.require.arrow-functions.md',
            targetPath: 'practices/rule.require.arrow-functions.md',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      const syncContent = await fs.readFile(
        path.join(syncDir, 'practices/rule.require.arrow-functions.md'),
        'utf-8',
      );
      expect(syncContent).toBe('# pure rule');
      expect(mockLog.log).toHaveBeenCalledWith(
        expect.stringContaining('target absent'),
      );
    });
  });

  describe('multiple operations', () => {
    it('should track counts for all operation types', async () => {
      // create pure rule files
      await fs.writeFile(
        path.join(pureDir, 'rule.create.md'),
        'create content',
        'utf-8',
      );
      await fs.writeFile(
        path.join(pureDir, 'rule.append.md'),
        'append content',
        'utf-8',
      );

      const manifest = new ReviewerReflectManifest({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.omit.md',
            operation: ReviewerReflectManifestOperation.OMIT,
            reason: 'not needed',
          },
          {
            path: 'rule.create.md',
            operation: ReviewerReflectManifestOperation.SET_CREATE,
            syncPath: 'rule.create.md',
          },
          {
            path: 'rule.append.md',
            operation: ReviewerReflectManifestOperation.SET_APPEND,
            syncPath: 'rule.append.[demo].md',
          },
        ],
      });

      const result = await executeManifestOperations({
        manifest,
        pureDir,
        syncDir,
        targetDir,
        log: mockLog,
      });

      expect(result.omitted).toBe(1);
      expect(result.created).toBe(1);
      expect(result.appended).toBe(1);
      expect(result.updated).toBe(0);
    });
  });
});
