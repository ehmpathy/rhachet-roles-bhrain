import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

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

  given('[case1] a manifest with an OMIT operation', () => {
    when('[t0] the manifest is executed', () => {
      then('it logs and counts the omitted rule', async () => {
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
        expect(mockLog.log).toHaveBeenCalledWith(
          expect.stringContaining('OMIT'),
        );
      });
    });
  });

  given('[case2] a manifest with a SET_CREATE operation', () => {
    when('[t0] the manifest is executed', () => {
      then('it copies the pure rule to the sync directory', async () => {
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
  });

  given('[case3] a manifest with a SET_APPEND operation', () => {
    when('[t0] the manifest is executed', () => {
      then('it copies the pure rule to sync with an adapted path', async () => {
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
  });

  given('[case4] a manifest with a SET_UPDATE operation', () => {
    when('[t0] the target rule exists at the named targetPath', () => {
      then('it merges the pure content with the target rule', async () => {
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
    });

    // .note = observed live: a model proposed SET_UPDATE against an EMPTY target, with no
    //         targetPath, and on a retry with a targetPath that named a directory. both
    //         threw and dropped every proposal in the manifest
    when('[t1] no targetPath is given and the target has no such rule', () => {
      then('it demotes the update to a create', async () => {
        await fs.writeFile(
          path.join(pureDir, 'rule.prefer.active_voice.md'),
          '# active voice',
          'utf-8',
        );

        const manifest = new ReviewerReflectManifest({
          timestamp: '2025-01-01T00:00:00.000Z',
          pureRules: [
            {
              path: 'rule.prefer.active_voice.md',
              operation: ReviewerReflectManifestOperation.SET_UPDATE,
              syncPath: 'practices/rule.prefer.active_voice.md',
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
          path.join(syncDir, 'practices/rule.prefer.active_voice.md'),
          'utf-8',
        );
        expect(syncContent).toBe('# active voice');
        expect(mockLog.log).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE→CREATE'),
        );
      });
    });

    when('[t2] the targetPath names a directory, not a rule', () => {
      then('it demotes the update to a create', async () => {
        await fs.writeFile(
          path.join(pureDir, 'rule.prefer.plain_language.md'),
          '# plain language',
          'utf-8',
        );
        await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });

        const manifest = new ReviewerReflectManifest({
          timestamp: '2025-01-01T00:00:00.000Z',
          pureRules: [
            {
              path: 'rule.prefer.plain_language.md',
              operation: ReviewerReflectManifestOperation.SET_UPDATE,
              syncPath: 'practices/rule.prefer.plain_language.md',
              targetPath: 'practices',
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
      });
    });

    when(
      '[t3] the targetPath is absent and a target rule matches by name',
      () => {
        then('it infers the target rule by name', async () => {
          await fs.writeFile(
            path.join(pureDir, 'rule.require.arrow_functions.md'),
            '## .citations\n\n- new citation',
            'utf-8',
          );
          await fs.mkdir(path.join(targetDir, 'practices'), {
            recursive: true,
          });
          await fs.writeFile(
            path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
            '# tldr\n\n# deets\n\n## .citations\n\n- old citation',
            'utf-8',
          );

          const manifest = new ReviewerReflectManifest({
            timestamp: '2025-01-01T00:00:00.000Z',
            pureRules: [
              {
                path: 'rule.require.arrow_functions.md',
                operation: ReviewerReflectManifestOperation.SET_UPDATE,
                syncPath: 'practices/rule.require.arrow-functions.md',
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
            path.join(syncDir, 'practices/rule.require.arrow-functions.md'),
            'utf-8',
          );
          expect(syncContent).toContain('old citation');
          expect(syncContent).toContain('new citation');
        });
      },
    );
  });

  given('[case5] a manifest with several operation kinds', () => {
    when('[t0] the manifest is executed', () => {
      then('it tracks counts for every operation kind', async () => {
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

  /**
   * .what = clamps the edge case where a brain omits a proposal that no target rule duplicates
   * .why = the prompt allows OMIT only for an exact duplicate, and that is checkable by comparison.
   *        a live brain omitted all 7 proposals, with reasons like "create new rule", so reflect
   *        produced no rule. an OMIT with no identical target rule is created instead
   */
  given('[case6] an OMIT whose pure rule no target rule duplicates', () => {
    when('[t0] the manifest is executed', () => {
      then('the pure rule is created, not omitted', async () => {
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
    });
  });

  given('[case7] an OMIT whose pure rule a target rule duplicates', () => {
    when('[t0] the manifest is executed', () => {
      then('the OMIT stands', async () => {
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
  });
});
