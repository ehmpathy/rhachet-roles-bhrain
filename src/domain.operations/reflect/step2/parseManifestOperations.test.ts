import { ReviewerReflectManifestOperation } from '@src/domain.objects/Reviewer/ReviewerReflectManifestOperation';

import { parseManifestOperations } from './parseManifestOperations';

/**
 * .what = helper to catch sync errors
 * .why = parseManifestOperations throws synchronously
 */
const getSyncError = (fn: () => unknown): Error | undefined => {
  try {
    fn();
    return undefined;
  } catch (e) {
    return e as Error;
  }
};

describe('parseManifestOperations', () => {
  describe('valid manifest', () => {
    it('should parse SET_CREATE operation', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.forbid.test.md',
            operation: 'SET_CREATE',
            syncPath: 'practices/code.prod/rule.forbid.test.md',
          },
        ],
      });

      const result = parseManifestOperations({ content });

      expect(result.pureRules).toHaveLength(1);
      expect(result.pureRules[0]?.operation).toBe(
        ReviewerReflectManifestOperation.SET_CREATE,
      );
      expect(result.pureRules[0]?.syncPath).toBe(
        'practices/code.prod/rule.forbid.test.md',
      );
    });

    it('should parse OMIT operation with reason', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.prefer.duplicate.md',
            operation: 'OMIT',
            reason: 'duplicate of existing rule',
          },
        ],
      });

      const result = parseManifestOperations({ content });

      expect(result.pureRules[0]?.operation).toBe(
        ReviewerReflectManifestOperation.OMIT,
      );
      expect(result.pureRules[0]?.reason).toBe('duplicate of existing rule');
    });

    it('should parse SET_UPDATE operation', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.require.tests.md',
            operation: 'SET_UPDATE',
            syncPath: 'practices/code.prod/rule.require.tests.md',
            existingPath: 'practices/code.prod/rule.require.tests.md',
          },
        ],
      });

      const result = parseManifestOperations({ content });

      expect(result.pureRules[0]?.operation).toBe(
        ReviewerReflectManifestOperation.SET_UPDATE,
      );
    });

    it('should parse SET_APPEND operation', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.prefer.example.md',
            operation: 'SET_APPEND',
            syncPath: 'practices/code.prod/rule.prefer.example.[demo].md',
          },
        ],
      });

      const result = parseManifestOperations({ content });

      expect(result.pureRules[0]?.operation).toBe(
        ReviewerReflectManifestOperation.SET_APPEND,
      );
    });
  });

  describe('invalid manifest', () => {
    it('should throw on invalid JSON', () => {
      const error = getSyncError(() =>
        parseManifestOperations({ content: 'not json' }),
      );
      expect(error?.message).toContain('not valid JSON');
    });

    it('should throw on missing timestamp', () => {
      const content = JSON.stringify({
        pureRules: [],
      });

      const error = getSyncError(() => parseManifestOperations({ content }));
      expect(error?.message).toContain('timestamp');
    });

    it('should throw on missing pureRules', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      const error = getSyncError(() => parseManifestOperations({ content }));
      expect(error?.message).toContain('pureRules');
    });

    it('should throw on invalid operation', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.test.md',
            operation: 'INVALID',
          },
        ],
      });

      const error = getSyncError(() => parseManifestOperations({ content }));
      expect(error?.message).toContain('operation');
    });

    it('should throw on missing syncPath for SET_CREATE', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.test.md',
            operation: 'SET_CREATE',
          },
        ],
      });

      const error = getSyncError(() => parseManifestOperations({ content }));
      expect(error?.message).toContain('syncPath');
    });

    it('should throw on missing reason for OMIT', () => {
      const content = JSON.stringify({
        timestamp: '2025-01-01T00:00:00.000Z',
        pureRules: [
          {
            path: 'rule.test.md',
            operation: 'OMIT',
          },
        ],
      });

      const error = getSyncError(() => parseManifestOperations({ content }));
      expect(error?.message).toContain('reason');
    });
  });
});
